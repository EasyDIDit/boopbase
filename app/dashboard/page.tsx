'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientPublicProfile from '@/app/[username]/ClientPublicProfile';
import { getAllSkins, getSkinById } from '@/lib/skins';
import {
  SOCIAL_PLATFORMS,
  PAYMENT_PLATFORMS,
  buildSocialUrl,
  legacySocialsToEntries,
  getPlatform,
  handleFromSocialUrl,
  socialDisplayPrefix,
  isPaymentPlatform,
  type SocialEntry,
  type SocialPlatformId,
} from '@/lib/socialPlatforms';
import { SocialGlyph } from '@/components/icons/SocialGlyph';
import { FieldTip } from '@/components/FieldTip';
import { Mascot, MascotHead } from '@/components/Mascot';
import BoopLogo from '@/components/BoopLogo';
import InsightsPanel from '@/components/InsightsPanel';
import { IMAGE_ACCEPT, prepareImage } from '@/lib/imageResize';
import { PROFILE_FONTS } from '@/lib/fonts';
import { profileSetupComplete } from '@/lib/mascot';
import { toPublicProfile } from '@/lib/publicProfile';
import { normalizeLinkUrl } from '@/lib/safeUrl';
import { EditorIcon, type EditorIconName } from '@/components/editor/EditorIcons';
import { LinkCard, LINK_TITLE_MAX, type EditorLink } from '@/components/editor/LinkCard';
import { ShareSheet, copyText } from '@/components/editor/ShareSheet';
import { BottomSheet } from '@/components/editor/BottomSheet';
import { FirstRun } from '@/components/editor/FirstRun';

type ImageStatus = { kind: 'idle' | 'busy' | 'ready' | 'error'; msg?: string };
type TabId = 'profile' | 'links' | 'social' | 'design' | 'insights';

const BIO_MAX = 200;
const field =
  'min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base leading-[1.35] text-white outline-none placeholder:text-zinc-500 focus:border-[#E72679] focus:ring-[3px] focus:ring-[#E72679]/25';
const lbl = 'mb-1.5 mt-3 flex items-center justify-between text-[13px] font-semibold text-zinc-300';

/** Everything the Save button sends. Undo restores the last saved copy of this. */
type Draft = {
  name: string;
  bio: string;
  photo: string | null;
  bgImage: string | null;
  outerBg: string;
  innerBg: string;
  useThemeBg: boolean;
  themeOverridesHero: boolean;
  themeId: string;
  fontId: string;
  links: EditorLink[];
  socials: SocialEntry[];
  phone: string;
  email: string;
  contactEmail: string;
  showContactEmail: boolean;
  company: string;
  title: string;
  address: string;
};

function draftFromUser(data: any): Draft {
  return {
    name: data.name || '',
    bio: data.bio || '',
    photo: data.profileImage || null,
    bgImage: data.backgroundImage || null,
    outerBg: data.outerBackgroundColor || '#C4CFDA',
    innerBg: data.innerBackgroundColor || '#ffffff',
    useThemeBg: data.useThemeBackground !== false,
    themeOverridesHero: data.themeOverridesHero === true,
    themeId: data.themeId || 'boop-classic',
    fontId: data.fontId || 'boop',
    links: Array.isArray(data.links) ? data.links : [],
    socials: legacySocialsToEntries(data),
    phone: data.phone || '',
    email: data.email || '',
    contactEmail: data.contactEmail || '',
    showContactEmail: data.showContactEmail === true,
    company: data.company || '',
    title: data.title || '',
    address: data.address || '',
  };
}

/** Link ids are timestamps (same as before); called only from event handlers. */
function newLinkId(): string {
  return String(Date.now());
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);
  const [usernameOk, setUsernameOk] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [outerBg, setOuterBg] = useState('#C4CFDA');
  const [innerBg, setInnerBg] = useState('#ffffff');
  const [useThemeBg, setUseThemeBg] = useState(true);
  const [themeOverridesHero, setThemeOverridesHero] = useState(false);
  const [themeId, setThemeId] = useState('boop-classic');
  const [fontId, setFontId] = useState('boop');
  const [links, setLinks] = useState<EditorLink[]>([]);
  const [socials, setSocials] = useState<SocialEntry[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [showContactEmail, setShowContactEmail] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<ImageStatus>({ kind: 'idle' });
  const [bgStatus, setBgStatus] = useState<ImageStatus>({ kind: 'idle' });
  const [totalViews, setTotalViews] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [firstRunOpen, setFirstRunOpen] = useState(false);
  const [origin, setOrigin] = useState('');

  // Links drag (pointer events: works with touch on iPhone/Android and with a mouse)
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef<{ id: string; pointerId: number; grab: number } | null>(null);
  const linksRef = useRef<EditorLink[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // Preview scale-to-fit (desktop column)
  const previewShellRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.85);

  useLayoutEffect(() => {
    linksRef.current = links;
  }, [links]);

  const applyDraft = useCallback((d: Draft) => {
    setName(d.name);
    setBio(d.bio);
    setPhoto(d.photo);
    setBgImage(d.bgImage);
    setOuterBg(d.outerBg);
    setInnerBg(d.innerBg);
    setUseThemeBg(d.useThemeBg);
    setThemeOverridesHero(d.themeOverridesHero);
    setThemeId(d.themeId);
    setFontId(d.fontId);
    setLinks(d.links);
    setSocials(d.socials);
    setPhone(d.phone);
    setEmail(d.email);
    setContactEmail(d.contactEmail);
    setShowContactEmail(d.showContactEmail);
    setCompany(d.company);
    setTitle(d.title);
    setAddress(d.address);
  }, []);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        setOrigin(window.location.origin);
        if (data.error) return;
        setUser(data);
        setUsernameDraft(data.username || '');
        const d = draftFromUser(data);
        applyDraft(d);
        setSaved(d);
        setTotalViews(data.views || 0);
        let skipped = false;
        try { skipped = window.localStorage.getItem(`boop-first-run-skipped:${data.username}`) === '1'; } catch { /* private mode */ }
        if (!skipped && !profileSetupComplete({ photo: d.photo, name: d.name, bio: d.bio, socials: d.socials, links: d.links })) setFirstRunOpen(true);
      })
      .catch(console.error);
  }, [applyDraft]);

  const draft: Draft = useMemo(
    () => ({ name, bio, photo, bgImage, outerBg, innerBg, useThemeBg, themeOverridesHero, themeId, fontId, links, socials, phone, email, contactEmail, showContactEmail, company, title, address }),
    [name, bio, photo, bgImage, outerBg, innerBg, useThemeBg, themeOverridesHero, themeId, fontId, links, socials, phone, email, contactEmail, showContactEmail, company, title, address]
  );

  const unsaved = useMemo(() => {
    if (!saved) return 0;
    return (Object.keys(draft) as Array<keyof Draft>).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k])).length;
  }, [draft, saved]);

  useEffect(() => {
    const shell = previewShellRef.current;
    const inner = previewInnerRef.current;
    if (!shell || !inner) return;
    const measure = () => {
      const shellH = shell.clientHeight;
      const shellW = shell.clientWidth;
      const contentH = inner.scrollHeight;
      const contentW = inner.scrollWidth || shellW;
      if (!contentH || !shellH) return;
      const next = Math.min(1, (shellH - 8) / contentH, (shellW - 8) / contentW);
      setPreviewScale(Math.max(0.35, Number(next.toFixed(3))));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(shell);
    ro.observe(inner);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [draft, activeTab]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  };

  const changeUsername = async () => {
    if (!user?.username) return;
    setChangingUsername(true);
    setUsernameMsg(null);
    try {
      const res = await fetch('/api/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUsernameOk(false);
        setUsernameMsg(data.error || 'Could not change username');
        return;
      }
      setUser((u: any) => (u ? { ...u, username: data.username } : u));
      setUsernameDraft(data.username);
      setUsernameOk(true);
      setUsernameMsg('Updated. Your card still works.');
    } catch {
      setUsernameOk(false);
      setUsernameMsg('Could not change username');
    } finally {
      setChangingUsername(false);
    }
  };

  const saveAllChanges = async (): Promise<boolean> => {
    if (!user?.username) {
      setSaveOk(false);
      setSaveMsg('Not logged in');
      return false;
    }
    setSaving(true);
    setSaveMsg(null);
    setNeedsLogin(false);
    // Half-started links (no title and no address) are dropped, not sent.
    const sendLinks = links.filter((l) => (l.title || '').trim() || (l.url || '').trim());
    const snapshot: Draft = { ...draft, links: sendLinks };
    let ok = false;
    try {
      const res = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name,
          bio,
          backgroundImage: bgImage,
          profileImage: photo,
          outerBackgroundColor: outerBg,
          innerBackgroundColor: innerBg,
          useThemeBackground: useThemeBg,
          themeOverridesHero,
          themeId,
          fontId,
          links: sendLinks,
          socials,
          phone,
          email,
          contactEmail,
          showContactEmail,
          company,
          title,
          address,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && (data?.success === true || data?.success === undefined)) {
        ok = true;
        setSaveOk(true);
        setSaveMsg('Saved');
        setLinks(sendLinks);
        setSaved(snapshot);
        if (typeof data?.emailVerified === 'boolean') setUser((u: typeof user) => (u ? { ...u, emailVerified: data.emailVerified } : u));
        setPhotoStatus((s) => (s.kind === 'ready' ? { kind: 'idle' } : s));
        setBgStatus((s) => (s.kind === 'ready' ? { kind: 'idle' } : s));
        setTimeout(() => setSaveMsg(null), 2500);
      } else if (res.status === 401) {
        setSaveOk(false);
        setNeedsLogin(true);
        setSaveMsg('Please log in again');
      } else {
        setSaveOk(false);
        setSaveMsg(data?.error || `Save failed (${res.status})`);
      }
    } catch {
      setSaveOk(false);
      setSaveMsg('Save failed');
    }
    setSaving(false);
    return ok;
  };

  const undoAll = () => {
    if (!saved) return;
    applyDraft(saved);
    setExpandedId(null);
    setSaveMsg(null);
    setPhotoStatus({ kind: 'idle' });
    setBgStatus({ kind: 'idle' });
  };

  const logout = async () => {
    try { await fetch('/api/logout', { method: 'POST' }); } catch { /* still leave */ }
    router.replace('/login');
    router.refresh();
  };

  /* ---------- socials ---------- */
  const setSocialHandle = (id: string, platform: SocialPlatformId, value: string) => {
    const url = value.trim() ? buildSocialUrl(platform, value) : '';
    if (value.trim() && !url && isPaymentPlatform(platform)) return; // off-domain paste: ignore
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, url } : s)));
  };

  const addSocialEntry = (platform: SocialPlatformId) => {
    const existing = socials.find((s) => s.platform === platform);
    if (!existing) setSocials((prev) => [...prev, { id: `${platform}-${Date.now()}`, platform, url: '' }]);
    setShowAddSocial(false);
    window.setTimeout(() => document.getElementById(`social-${platform}`)?.focus(), 60);
  };

  const removeSocial = (id: string) => setSocials((prev) => prev.filter((s) => s.id !== id));

  const setPaymentHandle = (platform: SocialPlatformId, value: string) => {
    const url = value.trim() ? buildSocialUrl(platform, value) : '';
    if (value.trim() && !url) return;
    setSocials((prev) => {
      const has = prev.some((s) => s.platform === platform);
      if (!url) return prev.filter((s) => s.platform !== platform);
      return has ? prev.map((s) => (s.platform === platform ? { ...s, url } : s)) : [...prev, { id: `${platform}-${Date.now()}`, platform, url }];
    });
  };

  /* ---------- links ---------- */
  const patchLink = (id: string, patch: Partial<EditorLink>) =>
    setLinks((prev) => prev.map((l) => (String(l.id) === id ? { ...l, ...patch } : l)));

  const setLinkImg = async (id: string, file: File | null) => {
    if (!file) {
      patchLink(id, { LNKimg: '' });
      return;
    }
    const fname = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    const isSvg = type === 'image/svg+xml' || fname.endsWith('.svg');
    try {
      if (isSvg) {
        const text = await file.text();
        if (/<script/i.test(text)) throw new Error('SVG cannot include script');
        patchLink(id, { LNKimg: `data:image/svg+xml;utf8,${encodeURIComponent(text)}` });
        return;
      }
      patchLink(id, { LNKimg: await prepareImage(file, 128, 128, true) });
    } catch (err) {
      setSaveOk(false);
      setSaveMsg(err instanceof Error ? err.message : 'Link photo failed');
    }
  };

  const addLink = () => {
    const id = newLinkId();
    setLinks((prev) => [...prev, { id, title: '', url: '', isActive: true, clicks: 0, LNKimg: '', kind: 'link' }]);
    setExpandedId(id);
    window.setTimeout(() => {
      cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`title-${id}`)?.focus({ preventScroll: true });
    }, 80);
  };

  const finishLink = (id: string) => {
    const l = links.find((x) => String(x.id) === id);
    setExpandedId(null);
    if (!l) return;
    if (!l.title.trim() && !l.url.trim()) {
      setLinks((prev) => prev.filter((x) => String(x.id) !== id));
      return;
    }
    const url = l.url.trim() ? normalizeLinkUrl(l.url) : '';
    if (url && url !== l.url) patchLink(id, { url });
  };

  const deleteLink = (id: string) => {
    if (!confirm('Delete this link?')) return;
    setLinks((prev) => prev.filter((l) => String(l.id) !== id));
    setExpandedId(null);
  };

  const moveLink = (from: number, to: number) => {
    setLinks((prev) => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onGripDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const card = cardRefs.current.get(id);
    if (!card) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id, pointerId: e.pointerId, grab: e.clientY - card.getBoundingClientRect().top };
    setExpandedId(null);
    setDraggingId(id);
    setDragY(e.clientY);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const y = e.clientY;
    const list = linksRef.current;
    const from = list.findIndex((l) => String(l.id) === d.id);
    // Target slot = how many other cards have their middle above the finger.
    let to = 0;
    for (const l of list) {
      if (String(l.id) === d.id) continue;
      const el = cardRefs.current.get(String(l.id));
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top + r.height / 2 < y) to++;
    }
    if (from !== -1 && to !== from) {
      setLinks((prev) => {
        const i = prev.findIndex((l) => String(l.id) === d.id);
        if (i === -1 || i === to || to >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(i, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
    if (y < 140) window.scrollBy(0, -14);
    else if (y > window.innerHeight - 170) window.scrollBy(0, 14);
    setDragY(y);
  };

  const onGripUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const body = cardRefs.current.get(d.id)?.querySelector<HTMLElement>('[data-link-card-body]');
    if (body) body.style.translate = '';
    dragRef.current = null;
    setDraggingId(null);
  };

  // The lifted card follows the finger; its slot in the list changes as it passes neighbours.
  useLayoutEffect(() => {
    const d = dragRef.current;
    if (!d || !draggingId) return;
    const el = cardRefs.current.get(d.id);
    const listEl = listRef.current;
    if (!el || !listEl) return;
    const listTop = listEl.getBoundingClientRect().top;
    const body = el.querySelector<HTMLElement>('[data-link-card-body]');
    if (body) body.style.translate = `0 ${dragY - d.grab - listTop - el.offsetTop}px`;
  }, [dragY, links, draggingId]);

  /* ---------- images ---------- */
  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file after an error
    if (!file) return;
    setPhotoStatus({ kind: 'busy', msg: 'Processing photo…' });
    try {
      setPhoto(await prepareImage(file, 400, 400));
      setPhotoStatus({ kind: 'ready', msg: 'Photo ready — press Save' });
    } catch (err) {
      setPhotoStatus({ kind: 'error', msg: err instanceof Error ? err.message : 'Photo failed' });
    }
  };

  const uploadBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setBgStatus({ kind: 'busy', msg: 'Processing image…' });
    try {
      setBgImage(await prepareImage(file, 1200, 1200));
      setBgStatus({ kind: 'ready', msg: 'Cover ready — press Save' });
    } catch (err) {
      setBgStatus({ kind: 'error', msg: err instanceof Error ? err.message : 'Image failed' });
    }
  };

  // Preview goes through the same public allowlist strangers get.
  const liveUser = useMemo(
    () => toPublicProfile({
      username: user?.username || 'preview',
      name,
      bio,
      profileImage: photo,
      backgroundImage: bgImage,
      outerBackgroundColor: outerBg,
      innerBackgroundColor: innerBg,
      useThemeBackground: useThemeBg,
      themeOverridesHero,
      themeId,
      fontId,
      links,
      socials,
      phone,
      email,
      contactEmail,
      showContactEmail,
      company,
      title,
      address,
    } as Record<string, unknown>),
    [user?.username, name, bio, photo, bgImage, outerBg, innerBg, useThemeBg, themeOverridesHero, themeId, fontId, links, socials, phone, email, contactEmail, showContactEmail, company, title, address]
  );

  const backgroundImages = bgImage ? [bgImage] : [];
  const skins = getAllSkins();
  const activeSkin = getSkinById(themeId);
  const isDragging = draggingId !== null;
  const publicUrl = user?.username ? `${origin}/${user.username}` : '';
  const setupSteps = [!!photo, !!name.trim(), !!bio.trim(), socials.some((s) => s.url), links.length > 0];
  const setupDone = setupSteps.filter(Boolean).length;
  const regularSocials = socials.filter((s) => !isPaymentPlatform(s.platform));
  const addablePlatforms = SOCIAL_PLATFORMS.filter((p) => !socials.some((s) => s.platform === p.id));

  const tabs: Array<{ id: TabId; label: string; icon: EditorIconName }> = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'links', label: 'Links', icon: 'link' },
    { id: 'social', label: 'Socials', icon: 'at' },
    { id: 'design', label: 'Look', icon: 'brush' },
    { id: 'insights', label: 'Insights', icon: 'chart' },
  ];

  const copyLink = async () => {
    if (publicUrl && (await copyText(publicUrl))) flash('Link copied');
  };

  const closeFirstRun = () => {
    setFirstRunOpen(false);
    try { if (user?.username) window.localStorage.setItem(`boop-first-run-skipped:${user.username}`, '1'); } catch { /* ignore */ }
  };

  const headerBtn = 'flex h-12 w-[46px] flex-col items-center justify-center gap-[3px] rounded-xl text-[10px] font-semibold text-zinc-200 hover:bg-zinc-900 lg:w-14';

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] [font-family:var(--font-outfit),system-ui,sans-serif]" data-editor>
      {/* Compact header: brand + @username, then Preview / Copy / Share / Log out */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#09090b] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center gap-2 pl-4 pr-2.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <BoopLogo variant="white" className="h-[17px] w-auto self-start" />
            <span className="truncate text-[13px] text-zinc-400" data-editor-username>@{user?.username || '…'}</span>
          </div>
          <nav className="mr-2 hidden items-center gap-1 lg:flex" aria-label="Editor sections">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${activeTab === tab.id ? 'bg-zinc-900 text-[#E72679]' : 'text-zinc-400 hover:text-white'}`}>
                <EditorIcon name={tab.icon} className="h-[18px] w-[18px]" />{tab.label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => setShowPreview(true)} className={headerBtn}><EditorIcon name="eye" />Preview</button>
          <button type="button" onClick={copyLink} className={headerBtn} disabled={!publicUrl}><EditorIcon name="link" />Copy</button>
          <button type="button" onClick={() => setShowShare(true)} className={`${headerBtn} bg-[#E72679] text-white hover:bg-[#E72679]`} disabled={!publicUrl}><EditorIcon name="share" />Share</button>
          <button type="button" onClick={logout} className={headerBtn}><EditorIcon name="out" />Log out</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-3.5 pb-[calc(170px+env(safe-area-inset-bottom))] pt-3.5 lg:px-4 lg:pb-32 lg:pt-6">
        <div className={`grid grid-cols-1 gap-8 ${activeTab !== 'insights' ? 'lg:grid-cols-2' : ''}`}>
          <div data-active-tab={activeTab} className="min-w-0">
            {activeTab === 'profile' && (
              <div>
                {!profileSetupComplete({ photo, name, bio, socials: socials.filter((s) => s.url), links }) && (
                  <button type="button" onClick={() => setFirstRunOpen(true)} data-finish-setup
                    className="mb-3 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-[#E72679]/40 bg-[#E72679]/10 px-4 py-2 text-left">
                    <span className="flex-1 text-sm font-semibold">Finish setting up your Boop <span className="font-normal text-zinc-400">· {setupDone} of 5 done</span></span>
                    <span className="text-sm font-bold text-[#ff7ab6]">Continue →</span>
                  </button>
                )}

                {/* Cover + photo */}
                <div className="mb-3 overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-900">
                  <div className="relative h-[76px] bg-[linear-gradient(135deg,#47202f,#E72679_70%,#ff7ab6)]">
                    {bgImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    {bgImage && (
                      <button type="button" onClick={() => setBgImage(null)} aria-label="Remove cover" className="absolute left-1 top-1 flex h-11 w-11 items-center justify-center">
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-black text-white"><EditorIcon name="x" className="h-3 w-3" /></span>
                      </button>
                    )}
                    <label className="absolute right-2.5 top-2.5 flex h-11 cursor-pointer items-center gap-2 rounded-[14px] bg-black/55 px-3 text-sm font-bold text-white">
                      <EditorIcon name="cam" className="h-4 w-4" />
                      {bgStatus.kind === 'busy' ? 'Processing…' : 'Change cover'}
                      <input type="file" accept={IMAGE_ACCEPT} onChange={uploadBgImage} disabled={bgStatus.kind === 'busy'} className="sr-only" />
                    </label>
                  </div>
                  <div className="-mt-10 flex items-end gap-3.5 px-4 pb-4">
                    <div className="relative shrink-0">
                      <label className="block cursor-pointer" aria-label={photo ? 'Upload a new profile photo' : 'Upload a profile photo'}>
                        <span className="block h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-900 bg-[#2a2a2e]">
                          {photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <MascotHead />
                          )}
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-zinc-900 bg-[#E72679] text-white" aria-hidden>
                          <EditorIcon name="cam" className="h-[17px] w-[17px]" />
                        </span>
                        <input type="file" accept={IMAGE_ACCEPT} onChange={uploadPhoto} disabled={photoStatus.kind === 'busy'} className="sr-only" />
                      </label>
                      {photo && (
                        <button type="button" onClick={() => { setPhoto(null); setPhotoStatus({ kind: 'idle' }); }} aria-label="Remove profile photo (shows the Boop panther)" data-remove-photo
                          className="absolute -left-3 -top-1 flex h-11 w-11 items-center justify-center">
                          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-black text-white"><EditorIcon name="x" className="h-3 w-3" /></span>
                        </button>
                      )}
                    </div>
                    <div className="pb-0.5 pt-12">
                      <p className="text-[15px] font-bold">Profile photo</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">Tap to upload over it.<br />No photo = Boop panther.</p>
                    </div>
                  </div>
                  <ImageStatusNote status={photoStatus} />
                  <ImageStatusNote status={bgStatus} />
                </div>

                <Section title="About you">
                  <label className={`${lbl} mt-0`} htmlFor="profile-name">Name</label>
                  <input type="text" id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} placeholder="What people see, e.g. Jordan Lee" />

                  <label className={lbl} htmlFor="profile-bio"><span>Headline / bio</span><span className="font-medium text-zinc-500">{bio.length}/{BIO_MAX}</span></label>
                  <textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} maxLength={BIO_MAX} rows={2}
                    className={`${field} resize-none [field-sizing:content]`} placeholder="One line about you, e.g. Maker in the ATL" />

                  <label className={lbl} htmlFor="profile-contact-email">Public contact email</label>
                  <input id="profile-contact-email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="you@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={field} />
                  <p className="mt-1.5 text-[13px] leading-snug text-zinc-400">Optional. Goes on your contact card. Your login email always stays private.</p>
                  <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={showContactEmail} onChange={(e) => setShowContactEmail(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#E72679]" />
                    <span>
                      <span className="block">Show email icon on my public profile</span>
                      <span className="block text-xs text-zinc-500">Your contact card still includes this email even when this is unchecked.</span>
                    </span>
                  </label>

                  <label className={lbl} htmlFor="profile-company">Company</label>
                  <input id="profile-company" type="text" placeholder="e.g. Your Company" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" className={field} />

                  <label className={lbl} htmlFor="profile-phone">Phone</label>
                  <input id="profile-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 404-555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />

                  <label className={lbl} htmlFor="profile-title">Job title</label>
                  <input id="profile-title" type="text" placeholder="Job title, e.g. Maker" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="organization-title" className={field} />

                  <label className={lbl} htmlFor="profile-address">City or address</label>
                  <input id="profile-address" type="text" placeholder="City or address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} className={field} />
                  <FieldTip kind="tip" className="mt-3">
                    Add to Contacts shows on your public page when you fill in phone, public email, company, job title, or city.
                  </FieldTip>
                </Section>

                <Section title="Account">
                  <label className={`${lbl} mt-0`} htmlFor="profile-username">Your link</label>
                  <input
                    id="profile-username"
                    type="text"
                    value={usernameDraft}
                    onChange={(e) => setUsernameDraft(e.target.value.toLowerCase().replace(/@/g, '').replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="yourname — no @"
                    className={field}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <p className="mt-1.5 break-all text-[13px] text-emerald-300">{usernameDraft ? `boopbase.com/${usernameDraft}` : 'Example: boopbase.com/yourname'}</p>
                  <p className="mt-1 text-[13px] text-zinc-400">No @. Your card still opens this profile if you change it.</p>
                  <button type="button" onClick={changeUsername} disabled={changingUsername || !usernameDraft || usernameDraft === user?.username}
                    className="mt-2 h-11 rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-40">
                    {changingUsername ? 'Updating…' : 'Update username'}
                  </button>
                  {usernameMsg && <p className={`mt-2 text-sm ${usernameOk ? 'text-emerald-300' : 'text-red-400'}`}>{usernameMsg}</p>}

                  <label className={lbl} htmlFor="profile-login-email">Login email (private)</label>
                  <input id="profile-login-email" type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                  {user?.emailVerified === false && (
                    <div role="status" className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
                      Confirm your login email: check your inbox for our link.{' '}
                      <button type="button" className="font-semibold underline" onClick={async () => {
                        const res = await fetch('/api/verify-email/resend', { method: 'POST' });
                        const d = await res.json().catch(() => ({}));
                        setVerifyMsg(d.message || d.error || (res.ok ? 'Sent.' : 'Could not send.'));
                      }}>Send a new link</button>
                      {verifyMsg && <span className="mt-1 block text-xs">{verifyMsg}</span>}
                    </div>
                  )}
                </Section>
              </div>
            )}

            {activeTab === 'links' && (
              <div>
                {!isDragging && (
                  <div className="mb-3 flex gap-2">
                    <button type="button" onClick={() => addLink()} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#E72679] text-base font-bold text-white">
                      <EditorIcon name="plus" className="h-[18px] w-[18px]" />Add link
                    </button>
                  </div>
                )}
                {isDragging && (
                  <div className="sticky top-[72px] z-30 mx-auto mb-3 flex w-fit items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,.4)]" role="status">
                    <EditorIcon name="grip" className="h-4 w-4 text-[#E72679]" />Hold the dots and drag · let go to drop
                  </div>
                )}
                {links.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-400">
                    No links yet. Tap <b className="text-white">Add link</b> to add your first one.
                  </div>
                ) : (
                  <div ref={listRef} className="relative" data-links-list>
                    {links.map((link, index) => {
                      const id = String(link.id);
                      return (
                        <LinkCard
                          key={id}
                          ref={(el) => { if (el) cardRefs.current.set(id, el); else cardRefs.current.delete(id); }}
                          link={link}
                          index={index}
                          count={links.length}
                          expanded={expandedId === id && !isDragging}
                          lifted={draggingId === id}
                          dimmed={isDragging && draggingId !== id}
                          onEdit={() => setExpandedId(id)}
                          onDone={() => finishLink(id)}
                          onChange={(patch) => patchLink(id, patch)}
                          onPhoto={(file) => void setLinkImg(id, file)}
                          onDelete={() => deleteLink(id)}
                          onGripPointerDown={onGripDown(id)}
                          onGripPointerMove={onGripMove}
                          onGripPointerUp={onGripUp}
                          onMove={(delta) => moveLink(index, index + delta)}
                        />
                      );
                    })}
                  </div>
                )}
                <p className="mt-1 text-[13px] text-zinc-500">Hold the dots to drag a link into a new spot. Titles up to {LINK_TITLE_MAX} characters wrap on your page.</p>
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <h2 className="text-[17px] font-bold">Socials</h2>
                  <button type="button" onClick={() => setShowAddSocial(true)} className="h-11 rounded-[14px] border-[1.5px] border-zinc-600 px-3.5 text-[15px] font-bold">+ Add social</button>
                </div>
                {regularSocials.length === 0 && (
                  <p className="mb-2.5 rounded-[18px] border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-400">No socials yet. Only the ones you add show on your page.</p>
                )}
                {regularSocials.map((s) => (
                  <HandleCard key={s.id} id={`social-${s.platform}`} platform={s.platform} name={getPlatform(s.platform)?.name || s.platform}
                    prefix={socialDisplayPrefix(s.platform)} value={handleFromSocialUrl(s.platform, s.url)} placeholder={getPlatform(s.platform)?.placeholder || ''}
                    onChange={(v) => setSocialHandle(s.id, s.platform, v)} onRemove={() => removeSocial(s.id)} />
                ))}

                <div className="mb-1 mt-4 flex items-end justify-between">
                  <h2 className="text-[17px] font-bold">Get paid</h2>
                  <span className="text-xs text-zinc-400">Official links only</span>
                </div>
                <p className="mb-2.5 text-[13px] leading-snug text-zinc-400">Type your handle — we build the official paypal.me, cash.app or venmo.com link.</p>
                {PAYMENT_PLATFORMS.map((p) => {
                  const entry = socials.find((s) => s.platform === p.id);
                  return (
                    <HandleCard key={p.id} id={`social-${p.id}`} platform={p.id} name={p.name} prefix={p.display || ''} placeholder={p.placeholder}
                      value={entry ? handleFromSocialUrl(p.id, entry.url) : ''} onChange={(v) => setPaymentHandle(p.id, v)}
                      onRemove={entry ? () => removeSocial(entry.id) : undefined} />
                  );
                })}
              </div>
            )}

            {activeTab === 'design' && (
              <div>
                <h2 className="text-[17px] font-bold">Pick your look</h2>
                <p className="mb-3 mt-0.5 text-[13px] leading-snug text-zinc-400">Tap a skin. Preview shows it on your page before you save.</p>
                <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Skin">
                  {skins.map((s) => {
                    const on = themeId === s.id;
                    return (
                      <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => setThemeId(s.id)}
                        className={`rounded-2xl p-[3px] text-left ${on ? 'bg-[#E72679]' : 'bg-zinc-800'}`}>
                        <span className="flex h-32 flex-col items-center gap-1.5 rounded-[13px] pt-3" style={{ background: s.tokens.pageBg }}>
                          <span className="block h-[46px] w-[46px] overflow-hidden rounded-full border-2" style={{ background: s.tokens.cardBg, borderColor: s.tokens.accent }}>
                            <MascotHead />
                          </span>
                          <span className="block h-3.5 w-[72%] rounded-full border-[1.5px]" style={{ background: s.tokens.cardBg, borderColor: s.tokens.accent }} />
                          <span className="block h-3.5 w-[72%] rounded-full border-[1.5px]" style={{ background: s.tokens.cardBg, borderColor: s.tokens.accent }} />
                        </span>
                        <span className="flex items-center justify-between px-1.5 pb-1 pt-[7px] text-sm font-semibold">
                          {s.name}
                          {on && <EditorIcon name="check" className="h-4 w-4" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <Section title="Font" className="mt-4">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROFILE_FONTS.map((f) => (
                      <button key={f.id} type="button" onClick={() => setFontId(f.id)} aria-pressed={fontId === f.id}
                        className={`min-h-12 rounded-xl border p-3 text-left ${fontId === f.id ? 'border-[#E72679] bg-zinc-800' : 'border-zinc-700'}`}>
                        <span className="block text-lg" style={{ fontFamily: f.family }}>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                {(activeSkin.flags.allowsCustomCardColor || activeSkin.flags.allowsCustomPageColor) && (
                  <Section title="Colors">
                    {activeSkin.flags.allowsCustomCardColor && (
                      <>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                          <input type="checkbox" checked={useThemeBg} onChange={(e) => setUseThemeBg(e.target.checked)} className="h-5 w-5 accent-[#E72679]" />
                          Use skin card color
                        </label>
                        {!useThemeBg && (
                          <label className="flex min-h-11 items-center gap-3 text-sm">
                            <input type="color" value={innerBg} onChange={(e) => setInnerBg(e.target.value)} className="h-11 w-14" />Card color
                          </label>
                        )}
                      </>
                    )}
                    {activeSkin.flags.allowsCustomPageColor && (
                      <label className="flex min-h-11 items-center gap-3 text-sm">
                        <input type="color" value={outerBg} onChange={(e) => setOuterBg(e.target.value)} className="h-11 w-14" />Page background (outside card)
                      </label>
                    )}
                  </Section>
                )}

                <Section title="Theme and your cover">
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" checked={themeOverridesHero} onChange={(e) => setThemeOverridesHero(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#E72679]" />
                    <span>
                      <span className="block font-medium">Theme overrides cover image</span>
                      <span className="mt-1 block text-zinc-400">On: the skin cover shows, even if you uploaded one. Off: your cover wins.</span>
                    </span>
                  </label>
                </Section>
              </div>
            )}

            {activeTab === 'insights' && (
              <Section title="Insights">
                <FieldTip kind="tip" className="mb-5">
                  Honest counts from your live page. Daily history, social taps and contact saves count from the day this update went live.
                </FieldTip>
                <InsightsPanel
                  views={totalViews}
                  links={links}
                  daily={user?.daily || {}}
                  contactSaves={user?.contactSaves || 0}
                  socialTaps={user?.socialTaps || 0}
                />
                <div data-insights-mascot className="flex justify-center pt-10">
                  <Mascot pose="2-phone-card" className="h-72 w-56 sm:h-80 sm:w-64" />
                </div>
              </Section>
            )}
          </div>

          {activeTab !== 'insights' && (
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-3 text-center text-xs uppercase tracking-widest text-zinc-500">Live card</p>
                <div ref={previewShellRef} className="flex justify-center overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-900" style={{ height: 'calc(100vh - 13rem)' }}>
                  <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center', width: '100%', maxWidth: '28rem' }}>
                    <div ref={previewInnerRef}>
                      <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: save bar + tab bar (tabs move to the header on wide screens) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-[#0c0c0e] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 border-b border-[#1f1f23] px-3.5 py-2 lg:border-b-0" data-save-bar>
          <div className="min-w-0 flex-1 text-sm" role="status" aria-live="polite">
            {saving ? (
              <span className="text-zinc-400">Saving…</span>
            ) : saveMsg && !saveOk ? (
              <span className="text-red-400">
                {saveMsg}
                {needsLogin && (<>{' '}<Link href="/login" className="underline">Log in</Link></>)}
              </span>
            ) : unsaved > 0 ? (
              <b className="font-semibold text-[#fbbf24]">{unsaved} unsaved change{unsaved === 1 ? '' : 's'}</b>
            ) : saved ? (
              <span className="flex items-center gap-1.5 text-[#4ade80]"><EditorIcon name="check" className="h-4 w-4" />All changes saved</span>
            ) : null}
          </div>
          {unsaved > 0 ? (
            <>
              <button type="button" onClick={undoAll} disabled={saving} className="h-11 rounded-[14px] border-[1.5px] border-zinc-600 px-3.5 text-[15px] font-bold disabled:opacity-50">Undo</button>
              <button type="button" onClick={() => void saveAllChanges()} disabled={saving} className="h-11 rounded-[14px] bg-[#E72679] px-5 text-base font-bold text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button type="button" disabled className="h-11 rounded-[14px] bg-zinc-800 px-5 text-base font-bold text-zinc-400">Saved</button>
          )}
        </div>
        <nav className="mx-auto flex h-14 max-w-lg lg:hidden" aria-label="Editor sections">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0 }); }} aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-[3px] text-xs font-semibold ${activeTab === tab.id ? 'text-[#E72679]' : 'text-zinc-500'}`}>
              <EditorIcon name={tab.icon} className="h-[22px] w-[22px]" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {toast && (
        <div role="status" aria-live="polite" data-toast className="fixed left-1/2 top-[30%] z-[90] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black shadow-[0_8px_24px_rgba(0,0,0,.4)]">
          <EditorIcon name="check" className="h-4 w-4 text-[#16a34a]" />{toast}
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-[75] flex flex-col bg-[#09090b]" role="dialog" aria-modal="true" aria-label="Preview">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <span className="font-semibold">Preview</span>
            <div className="flex items-center gap-2">
              {publicUrl && <a href={`/${user.username}`} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center rounded-xl px-3 text-sm text-zinc-300 underline">Open live page</a>}
              <button type="button" onClick={() => setShowPreview(false)} aria-label="Close preview" className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800"><EditorIcon name="x" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex flex-1 justify-center overflow-y-auto">
            <div className="w-full max-w-md">
              <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
            </div>
          </div>
        </div>
      )}

      {showShare && publicUrl && (
        <ShareSheet url={publicUrl} name={name} photo={photo} onClose={() => setShowShare(false)} onCopied={() => flash('Link copied')}
          onPreview={() => { setShowShare(false); setShowPreview(true); }} />
      )}

      {showAddSocial && (
        <BottomSheet title="Add a social" labelledBy="add-social-title" onClose={() => setShowAddSocial(false)}>
          <div className="grid grid-cols-2 gap-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {addablePlatforms.map((p) => (
              <button key={p.id} type="button" onClick={() => addSocialEntry(p.id)} className="flex min-h-12 items-center gap-2.5 rounded-xl bg-zinc-800 px-3 text-left text-[15px] font-semibold">
                <SocialGlyph platform={p.id} className="h-5 w-5 shrink-0" />{p.name}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {firstRunOpen && user && (
        <FirstRun
          name={name}
          bio={bio}
          photo={photo}
          photoBusy={photoStatus.kind === 'busy'}
          photoMsg={photoStatus.kind === 'error' ? photoStatus.msg : undefined}
          socialsCount={socials.filter((s) => s.url).length}
          linksCount={links.length}
          saving={saving}
          setName={setName}
          setBio={setBio}
          onPhoto={uploadPhoto}
          onAddSocial={(platform, handle) => {
            const url = buildSocialUrl(platform, handle);
            if (!url || !normalizeLinkUrl(url)) return false;
            setSocials((prev) => [...prev.filter((s) => s.platform !== platform), { id: `${platform}-${Date.now()}`, platform, url }]);
            return true;
          }}
          onAddLink={(t, u) => {
            const url = normalizeLinkUrl(u);
            if (!url || !t.trim()) return false;
            setLinks((prev) => [...prev, { id: String(Date.now()), title: t.trim().slice(0, LINK_TITLE_MAX), url, isActive: true, clicks: 0, LNKimg: '', kind: 'link' }]);
            return true;
          }}
          onSave={saveAllChanges}
          onClose={closeFirstRun}
        />
      )}
    </div>
  );
}

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mb-3 rounded-[20px] border border-zinc-800 bg-zinc-900 p-4 ${className}`}>
      <h3 className="mb-3 flex items-center gap-2 text-[17px] font-bold">
        <span className="h-[18px] w-1 rounded-sm bg-[#E72679]" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

function HandleCard({
  id,
  platform,
  name,
  prefix,
  value,
  placeholder,
  onChange,
  onRemove,
}: {
  id: string;
  platform: string;
  name: string;
  prefix: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="mb-2.5 rounded-[18px] border border-[#2e2e33] bg-zinc-900 pb-3 pl-3 pr-1 pt-1" data-social-card={platform}>
      <div className="flex items-center gap-2">
        <SocialGlyph platform={platform} className="h-5 w-5 shrink-0" />
        <label htmlFor={id} className="flex-1 text-[15px] font-bold">{name}</label>
        {onRemove ? (
          <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="flex h-11 w-11 items-center justify-center text-[#f87171]">
            <EditorIcon name="trash" className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>
      <div className="mr-2 flex min-h-12 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 focus-within:border-[#E72679] focus-within:ring-[3px] focus-within:ring-[#E72679]/25">
        {prefix && <span className="flex shrink-0 items-center whitespace-nowrap border-r border-zinc-700 bg-[#202023] px-3 text-sm font-medium text-zinc-400">{prefix}</span>}
        <input id={id} type="text" inputMode={platform === 'whatsapp' ? 'tel' : 'text'} autoCapitalize="none" autoCorrect="off" spellCheck={false}
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-zinc-500" />
      </div>
    </div>
  );
}

function ImageStatusNote({ status }: { status: ImageStatus }) {
  if (status.kind === 'idle' || !status.msg) return null;
  const color = status.kind === 'error' ? 'text-red-400' : status.kind === 'ready' ? 'text-emerald-400' : 'text-zinc-400';
  return (
    <p role="status" aria-live="polite" className={`px-4 pb-3 text-sm ${color}`}>
      {status.msg}
    </p>
  );
}
