'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import ClientPublicProfile from '@/app/[username]/ClientPublicProfile';
import { getAllSkins, getSkinById } from '@/lib/skins';
import {
  SOCIAL_PLATFORMS,
  buildSocialUrl,
  legacySocialsToEntries,
  getPlatform,
  type SocialEntry,
  type SocialPlatformId,
} from '@/lib/socialPlatforms';
import { SocialGlyph } from '@/components/icons/SocialGlyph';
import { FieldTip } from '@/components/FieldTip';
import { Mascot, MascotStyleSwitch } from '@/components/Mascot';
import InsightsPanel from '@/components/InsightsPanel';
import { IMAGE_ACCEPT, prepareImage } from '@/lib/imageResize';
import { PROFILE_FONTS } from '@/lib/fonts';

type ImageStatus = { kind: 'idle' | 'busy' | 'ready' | 'error'; msg?: string };

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
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
  const [links, setLinks] = useState<any[]>([]);
  const [socials, setSocials] = useState<SocialEntry[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Links drag — refs are source of truth during gesture (React state alone races with dragEnd)
  const dragFromRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Social add form
  const [pickPlatform, setPickPlatform] = useState<SocialPlatformId>('instagram');
  const [socialInput, setSocialInput] = useState('');

  // Preview scale-to-fit
  const previewShellRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.85);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setUser(data);
        setName(data.name || '');
        setUsernameDraft(data.username || '');
        setBio(data.bio || '');
        setPhoto(data.profileImage || null);
        setBgImage(data.backgroundImage || null);
        setOuterBg(data.outerBackgroundColor || '#C4CFDA');
        setInnerBg(data.innerBackgroundColor || '#ffffff');
        setUseThemeBg(data.useThemeBackground !== false);
        setThemeOverridesHero(data.themeOverridesHero === true);
        setThemeId(data.themeId || 'boop-classic');
        setFontId(data.fontId || 'boop');
        setLinks(data.links || []);
        setSocials(legacySocialsToEntries(data));
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setCompany(data.company || '');
        setTitle(data.title || '');
        setAddress(data.address || '');
        setTotalViews(data.views || 0);
      })
      .catch(console.error);
  }, []);

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
      const scaleH = (shellH - 8) / contentH;
      const scaleW = (shellW - 8) / contentW;
      const next = Math.min(1, scaleH, scaleW);
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
  }, [name, bio, photo, bgImage, themeId, links, socials, outerBg, innerBg, useThemeBg, phone, email]);


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

  const saveAllChanges = async () => {
    if (!user?.username) {
      setSaveOk(false);
      setSaveMsg('Not logged in');
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    setNeedsLogin(false);
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
          links,
          socials,
          phone,
          email,
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
        setSaveOk(true);
        setSaveMsg('Saved');
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
  };

  const addSocial = () => {
    const url = buildSocialUrl(pickPlatform, socialInput);
    if (!url) return;
    const next = socials.filter((s) => s.platform !== pickPlatform);
    next.push({
      id: `${pickPlatform}-${Date.now()}`,
      platform: pickPlatform,
      url,
    });
    setSocials(next);
    setSocialInput('');
  };

  const removeSocial = (id: string) => {
    setSocials(socials.filter((s) => s.id !== id));
  };



  const setLinkTap = (id: string | number, tapUrl: string) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, tapUrl } : l)));
  };

  const setLinkKind = (id: string | number, kind: 'link' | 'video') => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, kind } : l)));
  };

  const setLinkImg = async (id: string | number, file: File | null) => {
    if (!file) {
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, LNKimg: '' } : l)));
      return;
    }
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    const isSvg = type === 'image/svg+xml' || name.endsWith('.svg');
    try {
      if (isSvg) {
        const text = await file.text();
        if (/<script/i.test(text)) throw new Error('SVG cannot include script');
        const LNKimg = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, LNKimg } : l)));
        return;
      }
      const LNKimg = await prepareImage(file, 128, 128, true);
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, LNKimg } : l)));
    } catch (err) {
      setSaveOk(false);
      setSaveMsg(err instanceof Error ? err.message : 'LNKimg failed');
    }
  };

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setLinks([
      ...links,
      { id: String(Date.now()), title: newTitle.trim(), url: finalUrl, isActive: true, clicks: 0, LNKimg: '', kind: 'link' },
    ]);
    setNewTitle('');
    setNewUrl('');
  };

  const deleteLink = (id: string | number) => {
    if (!confirm('Delete this link?')) return;
    setLinks(links.filter((l) => l.id !== id));
  };

  /** Start drag — store index in ref so drop/reorder never loses it */
  const onLinkDragStart = (index: number, linkId: string, e: React.DragEvent) => {
    dragFromRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Delay visual state so the browser can capture the drag image first
    requestAnimationFrame(() => setDraggingId(linkId));
  };

  /**
   * Live reorder while hovering another row.
   * List shifts immediately so you see the slot open between neighbors.
   */
  const onLinkDragOver = (overIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const from = dragFromRef.current;
    if (from === null || from === overIndex) return;

    setLinks((prev) => {
      if (from < 0 || from >= prev.length || overIndex < 0 || overIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(overIndex, 0, moved);
      dragFromRef.current = overIndex;
      return next;
    });
  };

  const onLinkDragEnd = () => {
    dragFromRef.current = null;
    setDraggingId(null);
  };

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
      setBgStatus({ kind: 'ready', msg: 'Hero image ready — press Save' });
    } catch (err) {
      setBgStatus({ kind: 'error', msg: err instanceof Error ? err.message : 'Image failed' });
    }
  };

  const liveUser = useMemo(
    () => ({
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
      company,
      title,
      address,
    }),
    [
      user?.username,
      name,
      bio,
      photo,
      bgImage,
      outerBg,
      innerBg,
      useThemeBg,
      themeOverridesHero,
      themeId,
      fontId,
      links,
      socials,
      phone,
      email,
      company,
      title,
      address,
    ]
  );

  const backgroundImages = bgImage ? [bgImage] : [];
  const skins = getAllSkins();
  const activeSkin = getSkinById(themeId);
  const selectedPlatform = getPlatform(pickPlatform);
  const availablePlatforms = SOCIAL_PLATFORMS;
  const isDragging = draggingId !== null;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'social', label: 'Social' },
    { id: 'links', label: 'Links' },
    { id: 'design', label: 'Design' },
    { id: 'insights', label: 'Insights' },
  ];

  const publicUrl = user?.username ? `/${user.username}` : '#';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#ff7ab6] tracking-widest uppercase">Boop studio</p>
            <h1 className="text-xl md:text-2xl font-bold">{user?.username || '…'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveMsg && (
              <span className={`text-sm font-medium px-2 ${saveOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveOk && <Mascot pose="4-thumbs-up" className="inline-block h-8 w-8 align-middle mr-1" />}
                {saveMsg}
                {needsLogin && (
                  <>
                    {' '}
                    <Link href="/login" className="underline">
                      Log in
                    </Link>
                  </>
                )}
              </span>
            )}
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-zinc-600 text-sm hover:bg-zinc-900"
            >
              View live
            </a>
            <button
              type="button"
              onClick={() => setShowMobilePreview(true)}
              className="lg:hidden px-4 py-2 rounded-xl border border-zinc-600 text-sm"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={saveAllChanges}
              disabled={saving}
              className="bg-[#E72679] hover:bg-pink-600 text-white px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto gap-1 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-[3px] transition-colors ${
                activeTab === tab.id
                  ? 'border-[#E72679] text-white'
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="mb-3 flex justify-end"><MascotStyleSwitch /></div>
        {(() => {
          const steps = [
            { id: 'profile', label: 'Add a photo', done: !!photo },
            { id: 'profile', label: 'Add your name', done: !!name.trim() },
            { id: 'profile', label: 'Write a short bio', done: !!bio.trim() },
            { id: 'social', label: 'Add a social', done: socials.length > 0 },
            { id: 'links', label: 'Add a link', done: links.length > 0 },
          ];
          const doneCount = steps.filter((x) => x.done).length;
          const pct = Math.round((doneCount / steps.length) * 100);
          return (
            <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#E72679]/20 via-zinc-900 to-zinc-900 p-5 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Mascot pose={pct === 100 ? '4-thumbs-up' : '3-waving'} className="h-20 w-20 sm:h-24 sm:w-24" />
                <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#ff7ab6]">Start here</p>
                  <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                    {pct === 100 ? 'Your Boop page is ready. Hit Save.' : 'Build your Boop page in 5 quick steps'}
                  </h2>
                </div>
                <span className="text-sm font-semibold text-zinc-300">{doneCount} of {steps.length} done</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile complete">
                <div className="h-full rounded-full bg-[#E72679] transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {steps.map((x) => (
                  <button
                    key={x.label}
                    type="button"
                    onClick={() => setActiveTab(x.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      x.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}
                  >
                    <span aria-hidden>{x.done ? '✓' : '○'}</span>
                    {x.label}
                    <span className="sr-only">{x.done ? '(done)' : '(to do)'}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Section title="Photo">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden">
                      {photo ? (
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src="/mascots/poses/panther-3d-3-waving.webp" alt="" className="w-full h-full object-contain p-1" />
                      )}
                    </div>
                    <label className="cursor-pointer bg-white text-black px-5 py-2.5 rounded-xl font-medium text-sm">
                      {photoStatus.kind === 'busy' ? 'Processing…' : 'Upload photo'}
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={uploadPhoto}
                        disabled={photoStatus.kind === 'busy'}
                        className="hidden"
                      />
                    </label>
                    <ImageStatusNote status={photoStatus} />
                  </div>
                </Section>
                <Section title="Hero image">
                  <p className="text-sm text-zinc-400 mb-3">
                    The wide image behind your photo. Theme can override this from Design.
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    {bgImage && (
                      <div className="w-full max-w-xs h-28 rounded-xl overflow-hidden border border-zinc-700">
                        <img src={bgImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium">
                      {bgStatus.kind === 'busy' ? 'Processing…' : 'Upload hero'}
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={uploadBgImage}
                        disabled={bgStatus.kind === 'busy'}
                        className="hidden"
                      />
                    </label>
                    <ImageStatusNote status={bgStatus} />
                    {bgImage && (
                      <button type="button" onClick={() => setBgImage(null)} className="text-red-400 text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                </Section>
                <Section title="Username">
                  <p className="text-sm text-zinc-400 mb-3">
                    No @. This is your public link. Your card still opens this profile if you change it.
                  </p>
                  <input
                    type="text"
                    value={usernameDraft}
                    onChange={(e) =>
                      setUsernameDraft(
                        e.target.value
                          .toLowerCase()
                          .replace(/@/g, "")
                          .replace(/[^a-z0-9._-]/g, "")
                      )
                    }
                    placeholder="yourname — no @"
                    className="w-full bg-zinc-800 p-4 rounded-2xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <p className="mt-2 text-xs text-white/40">
                    Example: boopbase.com/yourname
                  </p>
                  {usernameDraft ? (
                    <p className="mt-1 text-xs font-medium text-emerald-300">
                      Your link: boopbase.com/{usernameDraft}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={changeUsername}
                    disabled={changingUsername || !usernameDraft || usernameDraft === user?.username}
                    className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
                  >
                    {changingUsername ? "Updating…" : "Update username"}
                  </button>
                  {usernameMsg && (
                    <p className={`mt-2 text-sm ${usernameOk ? "text-emerald-300" : "text-red-400"}`}>
                      {usernameMsg}
                    </p>
                  )}
                </Section>
                <Section title="Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 p-4 rounded-2xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30"
                    placeholder="What people see, e.g. Jordan Lee"
                  />
                  <FieldTip kind="public" pose="1-pointing">Shows big at the top of your page.</FieldTip>
                </Section>
                <Section title="Headline / bio" right={`${bio.length}/200`}>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="w-full bg-zinc-800 p-4 rounded-2xl h-28 resize-y border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30"
                    placeholder="One line about you, e.g. Maker in the ATL"
                  />
                  <FieldTip kind="public" pose="5-peeking">Shows under your name. Keep it short and sweet.</FieldTip>
                </Section>
                <Section title="Contact card (vCard)">
                  <FieldTip kind="tip" pose="2-phone-card" className="mb-3">
                    Add to Contacts only shows on your public page if you fill phone or email. These details go into the contact file people save.
                  </FieldTip>
                  <div className="space-y-3">
                    <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Phone</span><input type="text" placeholder="Phone for contacts, e.g. 404-555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Email</span><input type="email" placeholder="Email for contacts, e.g. you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Company</span><input type="text" placeholder="Company, e.g. Easy Did It" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Job title</span><input type="text" placeholder="Job title, e.g. Maker" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">City or address</span><input type="text" placeholder="City or address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                  </div>
                </Section>
              </div>
            )}

            {activeTab === 'social' && (
              <Section title="Social buttons">
                <p className="text-sm text-zinc-400 mb-4">
                  Pick a platform, add your @ or URL, then Add. Only platforms you add show on your card.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <select
                    value={pickPlatform}
                    onChange={(e) => setPickPlatform(e.target.value as SocialPlatformId)}
                    className="bg-zinc-800 p-3 rounded-xl sm:w-44 shrink-0"
                  >
                    {availablePlatforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSocial();
                    }}
                    placeholder={selectedPlatform?.placeholder || '@username'}
                    className="flex-1 bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30"
                  />
                  <button
                    type="button"
                    onClick={addSocial}
                    className="bg-white text-black px-5 py-3 rounded-xl font-medium shrink-0"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2 mt-6">
                  {socials.length === 0 ? (
                    <div className="flex items-center gap-3"><Mascot pose="3-waving" className="h-16 w-16" /><p className="text-zinc-500 text-sm">No social buttons yet — add your first above.</p></div>
                  ) : (
                    socials.map((s) => {
                      const meta = getPlatform(s.platform);
                      return (
                        <div
                          key={s.id}
                          className="bg-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-600 flex items-center justify-center shrink-0">
                              <SocialGlyph platform={s.platform} className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{meta?.name || s.platform}</div>
                              <div className="text-xs text-zinc-500 truncate">{s.url}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSocial(s.id)}
                            className="text-red-400 text-sm shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </Section>
            )}

            {activeTab === 'links' && (
              <Section title="Links">
                <div className="mb-4 flex flex-col gap-2">
                  <FieldTip kind="link" pose="1-pointing">Paste the full web address, then give the button a short label.</FieldTip>
                  <FieldTip kind="tip" pose="5-peeking">Drag to reorder. Tap the image square to add a PNG or SVG. Switch Link to Video to play it right on your page. Save when done.</FieldTip>
                </div>
                <div className="flex flex-col gap-2 mb-5">
                  <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Web address</span><input type="text" placeholder="https://your-site.com" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">Button label</span><input type="text" placeholder="Button label, e.g. My site" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl border border-zinc-700 focus:border-[#E72679] focus:outline-none focus:ring-2 focus:ring-[#E72679]/30" /></label>
                  <button type="button" onClick={addLink} className="rounded-xl bg-[#E72679] py-3 font-bold text-white transition hover:brightness-110 active:scale-[0.99]">
                    Add link
                  </button>
                </div>
                {links.length === 0 ? (
                  <div className="flex items-center gap-3"><Mascot pose="3-waving" className="h-16 w-16" /><p className="text-zinc-500 text-sm">No links yet.</p></div>
                ) : (
                  <div className="flex flex-col gap-2" onDragEnd={onLinkDragEnd}>
                    {links.map((link: any, index: number) => {
                      const isActive = draggingId === link.id;
                      return (
                        <div
                          key={link.id}
                          draggable
                          onDragStart={(e) => onLinkDragStart(index, String(link.id), e)}
                          onDragOver={(e) => onLinkDragOver(index, e)}
                          onDrop={(e) => e.preventDefault()}
                          className={`p-3 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-3 select-none transition-all duration-150 ${
                            isActive
                              ? 'opacity-50 border-2 border-solid border-[#E72679] bg-zinc-800 shadow-lg shadow-pink-500/10 scale-[1.01]'
                              : isDragging
                                ? 'border-2 border-dashed border-zinc-600 bg-zinc-800/90'
                                : 'border-2 border-transparent bg-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span
                            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-white shrink-0 px-1 touch-none"
                            title="Drag to reorder"
                            aria-label="Drag to reorder"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <circle cx="9" cy="6" r="1.5" />
                              <circle cx="15" cy="6" r="1.5" />
                              <circle cx="9" cy="12" r="1.5" />
                              <circle cx="15" cy="12" r="1.5" />
                              <circle cx="9" cy="18" r="1.5" />
                              <circle cx="15" cy="18" r="1.5" />
                            </svg>
                          </span>

                          <label
                            style={link.LNKimg ? { backgroundColor: "#ffffff", backgroundImage: "linear-gradient(45deg,#e4e4e7 25%,transparent 25%,transparent 75%,#e4e4e7 75%),linear-gradient(45deg,#e4e4e7 25%,transparent 25%,transparent 75%,#e4e4e7 75%)", backgroundSize: "10px 10px", backgroundPosition: "0 0,5px 5px" } : undefined}
                            className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ${link.LNKimg ? "" : "bg-zinc-900"} ${link.LNKimg ? "border border-zinc-700" : "border-2 border-dashed border-zinc-600 hover:border-[#E72679]"}`}
                            title="Add an image to this link"
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            {link.LNKimg ? (
                              <img src={link.LNKimg} alt="" className="h-full w-full object-contain p-1.5" />
                            ) : (
                              <span className="flex h-full w-full flex-col items-center justify-center text-zinc-400"><span className="text-lg leading-none">+</span><span className="text-[0.6rem] font-semibold">Image</span></span>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,.png,.svg"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                void setLinkImg(link.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <div className="min-w-0 flex-1 pointer-events-none">
                            <div className="font-medium truncate">{link.title}</div>
                            <div className="text-xs text-zinc-500 truncate">{link.kind === 'video' ? `Plays: ${link.url}` : link.url}</div>
                            {link.kind === 'video' && (
                              <div className="pointer-events-auto mt-2 space-y-1">
                                <label className="block text-xs font-semibold text-zinc-300" htmlFor={`tap-${link.id}`}>Tap goes to</label>
                                <input
                                  id={`tap-${link.id}`}
                                  type="url"
                                  inputMode="url"
                                  value={link.tapUrl || ''}
                                  placeholder="Leave blank to open the full video"
                                  onChange={(e) => setLinkTap(link.id, e.target.value)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-[#E72679] focus:ring-2 focus:ring-[#E72679]/40"
                                />
                                <FieldTip kind="link" pose="1-pointing">Your video plays silently in the button. Tapping it opens this link.</FieldTip>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setLinkKind(link.id, link.kind === 'video' ? 'link' : 'video')}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${link.kind === 'video' ? 'bg-white text-black' : 'bg-zinc-700 text-white'}`}
                          >
                            {link.kind === 'video' ? 'Video' : 'Link'}
                          </button>
                          {link.LNKimg ? (
                            <button
                              type="button"
                              onClick={() => setLinkImg(link.id, null)}
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="text-xs text-zinc-400 shrink-0"
                            >
                              Clear
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => deleteLink(link.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="text-red-400 text-sm shrink-0 px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>
            )}

            {activeTab === 'design' && (
              <div className="space-y-6">
                <Section title="Skin">
                  <p className="text-sm text-zinc-400 mb-4">Full card look (frames + colors). Default is Boop Classic.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {skins.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setThemeId(s.id)}
                        className={`text-left p-3 rounded-2xl border transition-all ${
                          themeId === s.id ? 'border-[#E72679] bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        <div
                          className="h-20 rounded-xl mb-2 flex items-end p-2 border border-black/20"
                          style={{ backgroundColor: s.tokens.cardBg, color: s.tokens.text }}
                        >
                          <div className="flex gap-1">
                            <span className="w-4 h-4 rounded-full border border-black/30" style={{ background: s.tokens.accent }} />
                            <span className="w-4 h-4 rounded-full border border-black/30" style={{ background: s.tokens.pageBg }} />
                          </div>
                        </div>
                        <div className="font-semibold text-sm">{s.name}</div>
                        <div className="text-xs text-zinc-400">{s.description}</div>
                        {s.isDefault && (
                          <div className="text-[10px] text-[#E72679] mt-1 uppercase tracking-wide">Default</div>
                        )}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Font">
                  <p className="mb-4 text-sm text-zinc-400">Type on your card. Skin colors stay the same.</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROFILE_FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontId(f.id)}
                        className={`rounded-2xl border p-3 text-left ${fontId === f.id ? 'border-[#E72679] bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'}`}
                      >
                        <span className="block text-lg" style={{ fontFamily: f.family }}>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </Section>

                {activeSkin.flags.allowsCustomCardColor && (
                  <Section title="Card color">
                    <label className="flex items-center gap-3 mb-3 cursor-pointer text-sm">
                      <input type="checkbox" checked={useThemeBg} onChange={(e) => setUseThemeBg(e.target.checked)} className="w-4 h-4" />
                      Use skin card color
                    </label>
                    {!useThemeBg && (
                      <input type="color" value={innerBg} onChange={(e) => setInnerBg(e.target.value)} className="w-14 h-10" />
                    )}
                  </Section>
                )}

                {activeSkin.flags.allowsCustomPageColor && (
                  <Section title="Page background (outside card)">
                    <input type="color" value={outerBg} onChange={(e) => setOuterBg(e.target.value)} className="w-14 h-10" />
                  </Section>
                )}

                <Section title="Theme and your hero">
                  <label className="flex items-start gap-3 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={themeOverridesHero}
                      onChange={(e) => setThemeOverridesHero(e.target.checked)}
                      className="mt-1 w-4 h-4"
                    />
                    <span>
                      <span className="block font-medium">Theme overrides hero image</span>
                      <span className="block text-zinc-400 mt-1">
                        On: the skin hero shows, even if you uploaded one. Off: your hero wins.
                      </span>
                    </span>
                  </label>
                </Section>
              </div>
            )}

            {activeTab === 'insights' && (
              <Section title="Insights">
                <FieldTip kind="tip" pose="2-phone-card" className="mb-5">
                  Honest counts from your live page. Daily history, social taps and contact saves count from the day this update went live.
                </FieldTip>
                <InsightsPanel
                  views={totalViews}
                  links={links}
                  daily={user?.daily || {}}
                  contactSaves={user?.contactSaves || 0}
                  socialTaps={user?.socialTaps || 0}
                />
              </Section>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-center text-xs text-zinc-500 mb-3 tracking-widest uppercase">Live card</p>
              <div
                ref={previewShellRef}
                className="rounded-3xl border border-zinc-700 overflow-hidden bg-zinc-900 flex justify-center"
                style={{ height: 'calc(100vh - 9rem)' }}
              >
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                    width: '100%',
                    maxWidth: '28rem',
                  }}
                >
                  <div ref={previewInnerRef}>
                    <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMobilePreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col lg:hidden">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <span className="font-medium">Preview</span>
            <button type="button" onClick={() => setShowMobilePreview(false)} className="text-sm px-3 py-1 rounded-lg bg-zinc-800">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex justify-center">
            <div
              className="w-full max-w-md origin-top"
              style={{ transform: 'scale(0.72)', transformOrigin: 'top center' }}
            >
              <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900 p-5 shadow-lg shadow-black/20 sm:p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="h-5 w-1.5 rounded-full bg-[#E72679]" aria-hidden />
          {title}
        </h3>
        {right ? <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-400">{right}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ImageStatusNote({ status }: { status: ImageStatus }) {
  if (status.kind === 'idle' || !status.msg) return null;
  const color =
    status.kind === 'error' ? 'text-red-400' : status.kind === 'ready' ? 'text-emerald-400' : 'text-zinc-400';
  return (
    <p role="status" aria-live="polite" className={`flex items-center justify-center gap-2 text-sm text-center max-w-xs ${color}`}>
      {status.kind !== 'error' && <Mascot pose={status.kind === 'busy' ? '5-peeking' : '4-thumbs-up'} className="h-8 w-8" />}
      {status.msg}
    </p>
  );
}
