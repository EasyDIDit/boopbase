import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getSessionUsername, unauthorized } from '@/lib/session';
import { normalizeLinkUrl } from '@/lib/safeUrl';
import { cleanImageValue } from '@/lib/imageGuard';
import { cleanEmail, isValidEmail } from '@/lib/authTokens';
import { sendVerificationEmail } from '@/lib/emailVerification';
import { isOfficialPaymentUrl, isPaymentPlatform } from '@/lib/socialPlatforms';

const MAX_BODY_CHARS = 8_000_000;
const MAX_LINKS = 100;

const ALLOWED_FIELDS = [
  'name',
  'bio',
  'backgroundImage',
  'profileImage',
  'outerBackgroundColor',
  'innerBackgroundColor',
  'useThemeBackground',
  'themeOverridesHero',
  'themeId',
  'fontId',
  'links',
  'socials',
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'phone',
  'email',
  'contactEmail',
  'showContactEmail',
  'company',
  'title',
  'address',
  'buttonStyle',
  'backgroundColor',
] as const;

export async function POST(request: NextRequest) {
  try {
    // Only the signed-in user can save; any username in the body is ignored.
    const username = getSessionUsername(request);
    if (!username) return unauthorized();

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: 'That is too much to save at once. Try smaller photos.' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad');
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    await connectDB();
    const current = await User.findOne({ username }).lean<Record<string, unknown>>();
    if (!current) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    const allowedFonts = new Set(['boop', 'clean', 'classic', 'marker', 'condensed']);
    for (const key of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
        if (key === 'fontId') {
          updateData[key] = allowedFonts.has(String(body[key])) ? body[key] : 'boop';
          continue;
        }
        updateData[key] = body[key];
      }
    }

    // Plain text fields must be strings (no objects/arrays that Mongo could treat as operators).
    for (const key of ['name', 'bio', 'phone', 'company', 'title', 'address', 'instagram', 'tiktok', 'youtube', 'facebook', 'outerBackgroundColor', 'innerBackgroundColor', 'backgroundColor', 'buttonStyle', 'themeId'] as const) {
      if (!(key in updateData)) continue;
      if (typeof updateData[key] !== 'string') delete updateData[key];
      else updateData[key] = (updateData[key] as string).slice(0, key === 'bio' ? 400 : 300);
    }
    for (const key of ['useThemeBackground', 'themeOverridesHero', 'showContactEmail'] as const) {
      if (key in updateData) updateData[key] = updateData[key] === true;
    }

    // Photos: size limits, allowed types, and EXIF/GPS stripped (re-encoded on the server).
    for (const slot of ['profileImage', 'backgroundImage'] as const) {
      if (!(slot in updateData)) continue;
      const checked = await cleanImageValue(slot, updateData[slot], current[slot]);
      if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
      updateData[slot] = checked.value;
    }

    // Optional public contact email: empty, or a valid address. Separate from the login email.
    if ('contactEmail' in updateData) {
      const ce = cleanEmail(updateData.contactEmail);
      if (ce && !isValidEmail(ce)) {
        return NextResponse.json({ error: 'Public contact email does not look right. Check it or leave it empty.' }, { status: 400 });
      }
      updateData.contactEmail = ce;
    }

    // Login email: valid, not used by another account; a change needs re-confirming.
    let loginEmailChanged = false;
    if ('email' in updateData) {
      const next = cleanEmail(updateData.email);
      const prev = cleanEmail(current.email);
      if (next === prev) {
        delete updateData.email;
      } else {
        if (!isValidEmail(next)) return NextResponse.json({ error: 'Login email does not look right.' }, { status: 400 });
        const taken = await User.findOne({ email: next, username: { $ne: username } }).select('_id').lean();
        if (taken) return NextResponse.json({ error: 'That login email is already used by another account.' }, { status: 400 });
        updateData.email = next;
        updateData.emailVerified = false;
        loginEmailChanged = true;
      }
    }

    // Only allow http(s) link URLs; bare domains get https://, anything else is rejected.
    if ('links' in updateData && !Array.isArray(updateData.links)) delete updateData.links;
    if (Array.isArray(updateData.links)) {
      if (updateData.links.length > MAX_LINKS) {
        return NextResponse.json({ error: `Up to ${MAX_LINKS} links.` }, { status: 400 });
      }
      const bad: string[] = [];
      // Tap counts come from the server, never the browser (stops counter edits and stale overwrites).
      const savedClicks = new Map<string, number>();
      for (const l of (Array.isArray(current.links) ? current.links : []) as Array<Record<string, unknown>>) {
        savedClicks.set(String(l?.id ?? ''), Number(l?.clicks) || 0);
      }
      const imageErrors: string[] = [];
      const currentImgs = new Map<string, unknown>();
      for (const l of (Array.isArray(current.links) ? current.links : []) as Array<Record<string, unknown>>) {
        currentImgs.set(String(l?.id ?? ''), l?.LNKimg);
      }
      const cleaned = await Promise.all((updateData.links as Array<Record<string, unknown>>).map(async (l) => {
        const c = await cleanImageValue('LNKimg', l?.LNKimg, currentImgs.get(String(l?.id ?? '')));
        if (!c.ok) imageErrors.push(c.error);
        return c.ok ? c.value : '';
      }));
      if (imageErrors.length) return NextResponse.json({ error: imageErrors[0] }, { status: 400 });
      updateData.links = (updateData.links as Array<Record<string, unknown>>).map((l, i) => {
        const url = normalizeLinkUrl(l?.url);
        if (!url) bad.push(String(l?.title ?? l?.url ?? ''));
        const rawImg = cleaned[i];
        const LNKimg =
          rawImg.startsWith('data:image/png') ||
          rawImg.startsWith('data:image/jpeg') ||
          rawImg.startsWith('data:image/webp') ||
          rawImg.startsWith('data:image/svg+xml') ||
          rawImg.startsWith('/uploads/') ||
          rawImg.startsWith('/skins/')
            ? rawImg
            : '';
        // Only link and (existing) video kinds are stored; anything else (e.g. gif) saves as a plain link, extra fields dropped.
        const kind = String(l?.kind || 'link') === 'video' ? 'video' : 'link';
        const rawTap = String(l?.tapUrl || '').trim();
        const tapUrl = kind === 'video' && rawTap ? normalizeLinkUrl(rawTap) : '';
        if (kind === 'video' && rawTap && !tapUrl) bad.push(String(l?.title ?? rawTap));
        const id = String(l?.id ?? '').slice(0, 64);
        return {
          id,
          title: String(l?.title ?? '').slice(0, 75),
          url,
          isActive: l?.isActive !== false,
          clicks: savedClicks.get(id) ?? 0,
          LNKimg,
          kind,
          tapUrl: tapUrl || '',
        };
      });
      if (bad.length) {
        return NextResponse.json(
          { error: `Links must start with http:// or https:// (check: ${bad.join(', ')})` },
          { status: 400 }
        );
      }
    }

    if ('socials' in updateData && !Array.isArray(updateData.socials)) delete updateData.socials;
    if (Array.isArray(updateData.socials)) {
      // Only http(s) social links are stored.
      updateData.socials = (updateData.socials as Array<Record<string, unknown>>)
        .slice(0, 40)
        .map((s) => ({ id: String(s?.id ?? '').slice(0, 64), platform: String(s?.platform ?? '').slice(0, 40), url: normalizeLinkUrl(s?.url) || '' }))
        .filter((s) => s.platform && s.url)
        // Get-paid handles: official paypal.me / cash.app / venmo.com links only.
        .filter((s) => !isPaymentPlatform(s.platform) || isOfficialPaymentUrl(s.platform, s.url));
    }
    for (const key of ['instagram', 'tiktok', 'youtube', 'facebook'] as const) {
      if (key in updateData && updateData[key]) updateData[key] = normalizeLinkUrl(updateData[key]) || '';
    }

    // Keep legacy flat fields in sync when socials[] is saved (backward compatible reads)
    if (Array.isArray(updateData.socials)) {
      const list = updateData.socials as Array<{ platform: string; url: string }>;
      const by = (id: string) => list.find((s) => s.platform === id)?.url || '';
      updateData.instagram = by('instagram');
      updateData.tiktok = by('tiktok');
      updateData.youtube = by('youtube');
      updateData.facebook = by('facebook');
    }

    const user = await User.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (loginEmailChanged) {
      // New login email must be confirmed. Never blocks the save; no email leaves the server unless configured.
      await sendVerificationEmail(user, request.nextUrl.origin).catch(() => null);
    }

    return NextResponse.json({ success: true, username: user.username, emailVerified: user.emailVerified });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 });
  }
}
