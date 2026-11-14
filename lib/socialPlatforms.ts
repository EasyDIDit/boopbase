import { normalizeLinkUrl } from './safeUrl';
/**
 * Curated social platform catalog for Boop.
 * Customers pick a platform + handle/URL; only configured ones show on the card.
 */

export type SocialPlatformId =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'snapchat'
  | 'pinterest'
  | 'threads'
  | 'discord'
  | 'twitch'
  | 'spotify'
  | 'github'
  | 'whatsapp'
  | 'telegram'
  | 'reddit'
  | 'behance'
  | 'website'
  | 'cashapp'
  | 'venmo'
  | 'paypal';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  /** URL prefix when user enters a handle (not a full URL) */
  prefix: string;
  placeholder: string;
  /** Optional hint under the field */
  hint?: string;
  /** Payment handles: only links on these official hosts are ever stored or shown. */
  officialHosts?: string[];
  /** Short label shown in front of the handle field, e.g. "cash.app/$". */
  display?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', prefix: 'https://instagram.com/', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', prefix: 'https://tiktok.com/@', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', prefix: 'https://youtube.com/@', placeholder: '@channel' },
  { id: 'facebook', name: 'Facebook', prefix: 'https://facebook.com/', placeholder: 'page or username' },
  { id: 'x', name: 'X (Twitter)', prefix: 'https://x.com/', placeholder: '@handle' },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'https://linkedin.com/in/', placeholder: 'profile-slug' },
  { id: 'snapchat', name: 'Snapchat', prefix: 'https://snapchat.com/add/', placeholder: 'username' },
  { id: 'pinterest', name: 'Pinterest', prefix: 'https://pinterest.com/', placeholder: 'username' },
  { id: 'threads', name: 'Threads', prefix: 'https://threads.net/@', placeholder: '@username' },
  { id: 'discord', name: 'Discord', prefix: 'https://discord.gg/', placeholder: 'invite code or URL' },
  { id: 'twitch', name: 'Twitch', prefix: 'https://twitch.tv/', placeholder: 'username' },
  { id: 'spotify', name: 'Spotify', prefix: 'https://open.spotify.com/user/', placeholder: 'user id or URL' },
  { id: 'github', name: 'GitHub', prefix: 'https://github.com/', placeholder: 'username' },
  { id: 'whatsapp', name: 'WhatsApp', prefix: 'https://wa.me/', placeholder: 'phone with country code' },
  { id: 'telegram', name: 'Telegram', prefix: 'https://t.me/', placeholder: 'username' },
  { id: 'reddit', name: 'Reddit', prefix: 'https://reddit.com/u/', placeholder: 'username' },
  { id: 'behance', name: 'Behance', prefix: 'https://behance.net/', placeholder: 'username' },
  { id: 'website', name: 'Website', prefix: 'https://', placeholder: 'yoursite.com' },
];

/** "Get paid" handles. Users type a handle; we build the official link (no lookalike domains). */
export const PAYMENT_PLATFORMS: SocialPlatform[] = [
  { id: 'cashapp', name: 'Cash App', prefix: 'https://cash.app/$', display: 'cash.app/$', placeholder: 'yourname', officialHosts: ['cash.app'] },
  { id: 'venmo', name: 'Venmo', prefix: 'https://venmo.com/u/', display: 'venmo.com/u/', placeholder: 'your-name', officialHosts: ['venmo.com', 'account.venmo.com'] },
  { id: 'paypal', name: 'PayPal', prefix: 'https://paypal.me/', display: 'paypal.me/', placeholder: 'yourname', officialHosts: ['paypal.me', 'www.paypal.me', 'paypal.com', 'www.paypal.com'] },
];

export function isPaymentPlatform(id: string): boolean {
  return PAYMENT_PLATFORMS.some((p) => p.id === id);
}

/** Payment handle: letters, numbers, dot, dash, underscore only (1–40). */
export function cleanPaymentHandle(raw: string): string {
  return raw.trim().replace(/^\$+/, '').replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
}

/** True when a payment URL is on that platform's official host over https. */
export function isOfficialPaymentUrl(platformId: string, url: string): boolean {
  const p = PAYMENT_PLATFORMS.find((x) => x.id === platformId);
  if (!p) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && (p.officialHosts || []).includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Short field label shown before the handle input (e.g. "instagram.com/"). */
export function socialDisplayPrefix(platformId: string): string {
  const p = getPlatform(platformId);
  if (!p) return '';
  if (p.display) return p.display;
  if (p.id === 'website') return 'https://';
  return p.prefix.replace(/^https?:\/\//, '');
}

/** Handle part of a saved URL for editing (the full URL when it does not match the prefix). */
export function handleFromSocialUrl(platformId: string, url: string): string {
  const p = getPlatform(platformId);
  if (!p || !url) return url || '';
  const bare = (v: string) => v.replace(/^https?:\/\/(www\.)?/i, '').toLowerCase();
  const pre = bare(p.prefix);
  if (p.id !== 'website' && bare(url).startsWith(pre)) return url.replace(/^https?:\/\/(www\.)?/i, '').slice(pre.length).replace(/\/$/, '');
  if (p.id === 'website') return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return url;
}

export type SocialEntry = {
  id: string;
  platform: SocialPlatformId;
  url: string;
};

export function getPlatform(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id) || PAYMENT_PLATFORMS.find((p) => p.id === id);
}

/** Build a full URL from handle or URL input. */
export function buildSocialUrl(platformId: SocialPlatformId, raw: string): string {
  let value = raw.trim();
  if (!value) return '';
  const platform = getPlatform(platformId);
  if (!platform) return value;

  if (isPaymentPlatform(platformId)) {
    // Official links only: a pasted URL must already be on the official host; a handle builds one.
    if (/^https?:\/\//i.test(value)) return isOfficialPaymentUrl(platformId, value) ? value : '';
    const handle = cleanPaymentHandle(value);
    return handle ? platform.prefix + handle : '';
  }

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith('@')) value = value.slice(1);
  value = value.replace(/^\/+/, '');

  // website: ensure https
  if (platformId === 'website') {
    return value.startsWith('http') ? value : `https://${value}`;
  }

  return platform.prefix + value;
}

/** Migrate legacy flat fields → socials[] */
export function legacySocialsToEntries(user: {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  socials?: SocialEntry[];
}): SocialEntry[] {
  if (Array.isArray(user.socials) && user.socials.length > 0) {
    // Only http(s) links ever render (no javascript:/data: links on a public page).
    return user.socials
      .filter((s) => s && s.platform && s.url && normalizeLinkUrl(s.url))
      .filter((s) => !isPaymentPlatform(s.platform) || isOfficialPaymentUrl(s.platform, normalizeLinkUrl(s.url) as string))
      .map((s) => ({ ...s, url: normalizeLinkUrl(s.url) as string }));
  }
  const out: SocialEntry[] = [];
  const pairs: [SocialPlatformId, string | undefined][] = [
    ['instagram', user.instagram],
    ['tiktok', user.tiktok],
    ['youtube', user.youtube],
    ['facebook', user.facebook],
  ];
  for (const [platform, url] of pairs) {
    const safe = url ? normalizeLinkUrl(String(url).trim()) : null;
    if (safe) {
      out.push({ id: `legacy-${platform}`, platform, url: safe });
    }
  }
  return out;
}
