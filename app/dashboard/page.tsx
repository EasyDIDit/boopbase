'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [outerBg, setOuterBg] = useState('#C4CFDA');
  const [innerBg, setInnerBg] = useState('#ffffff');
  const [useThemeBg, setUseThemeBg] = useState(true);
  const [themeId, setThemeId] = useState('boop-classic');
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
  const [totalViews, setTotalViews] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Links drag-and-drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null); // 0..links.length

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
        setBio(data.bio || '');
        setPhoto(data.profileImage || null);
        setBgImage(data.backgroundImage || null);
        setOuterBg(data.outerBackgroundColor || '#C4CFDA');
        setInnerBg(data.innerBackgroundColor || '#ffffff');
        setUseThemeBg(data.useThemeBackground !== false);
        setThemeId(data.themeId || 'boop-classic');
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

  const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const saveAllChanges = async () => {
    if (!user?.username) {
      setSaveOk(false);
      setSaveMsg('Not logged in');
      return;
    }
    setSaving(true);
    setSaveMsg(null);
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
          themeId,
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
        setTimeout(() => setSaveMsg(null), 2500);
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

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setLinks([
      ...links,
      { id: String(Date.now()), title: newTitle.trim(), url: finalUrl, isActive: true, clicks: 0 },
    ]);
    setNewTitle('');
    setNewUrl('');
  };

  const deleteLink = (id: string | number) => {
    if (!confirm('Delete this link?')) return;
    setLinks(links.filter((l) => l.id !== id));
  };

  const clearDrag = () => {
    setDragIndex(null);
    setInsertAt(null);
  };

  const onLinkDragStart = (index: number, e: React.DragEvent) => {
    setDragIndex(index);
    setInsertAt(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Slight delay so browser paints drag image from full-opacity row
    requestAnimationFrame(() => {
      // state already set; row will fade via class
    });
  };

  const onLinkDragOver = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const nextInsert = e.clientY < mid ? index : index + 1;
    if (nextInsert !== insertAt) setInsertAt(nextInsert);
  };

  const onLinkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || insertAt === null) {
      clearDrag();
      return;
    }
    // No-op if landing in same slot
    if (insertAt === dragIndex || insertAt === dragIndex + 1) {
      clearDrag();
      return;
    }
    const next = [...links];
    const [moved] = next.splice(dragIndex, 1);
    const target = insertAt > dragIndex ? insertAt - 1 : insertAt;
    next.splice(target, 0, moved);
    setLinks(next);
    clearDrag();
  };

  const uploadPhoto = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await resizeImage(file, 400, 400));
    } catch {
      setSaveOk(false);
      setSaveMsg('Photo failed');
    }
  };

  const uploadBgImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBgImage(await resizeImage(file, 1200, 1200));
    } catch {
      setSaveOk(false);
      setSaveMsg('Background failed');
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
      themeId,
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
      themeId,
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
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const selectedPlatform = getPlatform(pickPlatform);
  const availablePlatforms = SOCIAL_PLATFORMS;
  const isDragging = dragIndex !== null;

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'social', label: 'Social' },
    { id: 'links', label: 'Links' },
    { id: 'design', label: 'Design' },
    { id: 'insights', label: 'Insights' },
  ];

  const publicUrl = user?.username ? `/${user.username}` : '#';

  const DropGap = ({ show }: { show: boolean }) => (
    <div
      className={`transition-all duration-150 ease-out overflow-hidden ${
        show ? 'h-14 opacity-100 my-1' : 'h-0 opacity-0 my-0'
      }`}
      aria-hidden
    >
      <div className="h-full rounded-xl border-2 border-dashed border-[#E72679] bg-[#E72679]/15 flex items-center justify-center">
        <span className="text-[10px] tracking-widest uppercase text-[#E72679] font-semibold">Drop here</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500 tracking-widest uppercase">Boop studio</p>
            <h1 className="text-xl md:text-2xl font-bold">@{user?.username || '…'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveMsg && (
              <span className={`text-sm font-medium px-2 ${saveOk ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMsg}
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
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#E72679] text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl">🐱</div>
                      )}
                    </div>
                    <label className="cursor-pointer bg-white text-black px-5 py-2.5 rounded-xl font-medium text-sm">
                      Upload photo
                      <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                    </label>
                  </div>
                </Section>
                <Section title="Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 p-4 rounded-2xl"
                    placeholder="Display name"
                  />
                </Section>
                <Section title="Headline / bio" right={`${bio.length}/200`}>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="w-full bg-zinc-800 p-4 rounded-2xl h-28 resize-y"
                    placeholder="What should people know in one line?"
                  />
                </Section>
                <Section title="Contact card (vCard)">
                  <p className="text-sm text-zinc-400 mb-3">
                    Add to Contacts only shows on your public page if you fill phone or email.
                  </p>
                  <div className="space-y-3">
                    <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl" />
                    <input type="text" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl" />
                    <input type="text" placeholder="Job title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl" />
                    <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-zinc-800 p-3 rounded-xl" />
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
                    className="flex-1 bg-zinc-800 p-3 rounded-xl"
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
                    <p className="text-zinc-500 text-sm">No social buttons yet — add your first above.</p>
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
                <p className="text-sm text-zinc-400 mb-4">
                  Drag the handle to reorder. A pink gap shows exactly where the link will land.
                </p>
                <div className="flex flex-col gap-2 mb-5">
                  <input type="text" placeholder="https://…" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="bg-zinc-800 p-3 rounded-xl" />
                  <input type="text" placeholder="Title on button" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-zinc-800 p-3 rounded-xl" />
                  <button type="button" onClick={addLink} className="bg-white text-black py-3 rounded-xl font-medium">
                    Add link
                  </button>
                </div>
                {links.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No links yet.</p>
                ) : (
                  <div
                    className="flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onLinkDrop}
                    onDragEnd={clearDrag}
                  >
                    {/* Gap before first item */}
                    <DropGap show={isDragging && insertAt === 0} />

                    {links.map((link: any, index: number) => {
                      const isActiveDrag = dragIndex === index;
                      // Hide the natural gap next to the dragged row's original neighbors when insert would be redundant
                      const showGapAfter =
                        isDragging &&
                        insertAt === index + 1 &&
                        !(dragIndex === index); // don't show gap right under the item you're lifting from its own slot visual

                      return (
                        <div key={link.id}>
                          <div
                            draggable
                            onDragStart={(e) => onLinkDragStart(index, e)}
                            onDragOver={(e) => onLinkDragOver(index, e)}
                            className={`p-3 rounded-xl flex items-center gap-3 transition-all duration-150 ${
                              isActiveDrag
                                ? 'opacity-40 border-2 border-solid border-[#E72679] bg-zinc-800 scale-[0.98]'
                                : isDragging
                                  ? 'border-2 border-dashed border-zinc-600 bg-zinc-800/80'
                                  : 'border-2 border-transparent bg-zinc-800'
                            }`}
                          >
                            {/* Drag handle */}
                            <span
                              className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white shrink-0 select-none px-1"
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

                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{link.title}</div>
                              <div className="text-xs text-zinc-500 truncate">{link.url}</div>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteLink(link.id)}
                              className="text-red-400 text-sm shrink-0"
                            >
                              Delete
                            </button>
                          </div>

                          {/* Gap after this item (between this and next) */}
                          <DropGap show={!!showGapAfter} />
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

                {activeSkin.flags.allowsCustomHeroImage && (
                  <Section title="Hero image">
                    <div className="flex flex-col items-center gap-3">
                      {bgImage && (
                        <div className="w-full max-w-xs h-28 rounded-xl overflow-hidden border border-zinc-700">
                          <img src={bgImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="cursor-pointer bg-white text-black px-5 py-2.5 rounded-xl text-sm font-medium">
                        Upload hero
                        <input type="file" accept="image/*" onChange={uploadBgImage} className="hidden" />
                      </label>
                      {bgImage && (
                        <button type="button" onClick={() => setBgImage(null)} className="text-red-400 text-sm">
                          Remove
                        </button>
                      )}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <Section title="Insights">
                <p className="text-sm text-zinc-400 mb-6">
                  Honest counts from your live page. Link taps update when visitors open links.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-zinc-800 rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold text-emerald-400">{totalViews}</div>
                    <div className="text-zinc-400 text-sm mt-1">Card views</div>
                  </div>
                  <div className="bg-zinc-800 rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold text-emerald-400">{totalClicks}</div>
                    <div className="text-zinc-400 text-sm mt-1">Link taps</div>
                  </div>
                </div>
                {links.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm text-zinc-400 mb-2">By link</h4>
                    {[...links]
                      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
                      .map((link: any) => (
                        <div key={link.id} className="flex justify-between bg-zinc-800 p-3 rounded-xl text-sm">
                          <span className="truncate pr-3">{link.title}</span>
                          <span className="text-emerald-400 font-mono shrink-0">{link.clicks || 0}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Add links to see tap counts.</p>
                )}
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
    <div className="bg-zinc-900 rounded-3xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {right ? <span className="text-sm text-zinc-500">{right}</span> : null}
      </div>
      {children}
    </div>
  );
}
