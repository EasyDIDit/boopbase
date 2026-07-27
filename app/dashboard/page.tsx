'use client';

import { useState, useEffect, useMemo } from 'react';
import ClientPublicProfile from '@/app/[username]/ClientPublicProfile';
import { getAllSkins, getSkinById } from '@/lib/skins';

const socialPlatforms = [
  { name: 'Instagram', prefix: 'https://instagram.com/', field: 'instagram' as const },
  { name: 'TikTok', prefix: 'https://tiktok.com/@', field: 'tiktok' as const },
  { name: 'YouTube', prefix: 'https://youtube.com/@', field: 'youtube' as const },
  { name: 'Facebook', prefix: 'https://facebook.com/', field: 'facebook' as const },
];

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
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
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

  const [igInput, setIgInput] = useState('');
  const [ttInput, setTtInput] = useState('');
  const [ytInput, setYtInput] = useState('');
  const [fbInput, setFbInput] = useState('');

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
        setInstagram(data.instagram || '');
        setTiktok(data.tiktok || '');
        setYoutube(data.youtube || '');
        setFacebook(data.facebook || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setCompany(data.company || '');
        setTitle(data.title || '');
        setAddress(data.address || '');
        setTotalViews(data.views || 0);
        setIgInput(extractHandle(data.instagram, 'instagram.com/'));
        setTtInput(extractHandle(data.tiktok, 'tiktok.com/@'));
        setYtInput(extractHandle(data.youtube, 'youtube.com/@'));
        setFbInput(extractHandle(data.facebook, 'facebook.com/'));
      })
      .catch(console.error);
  }, []);

  function extractHandle(url: string, marker: string) {
    if (!url) return '';
    if (url.startsWith('@')) return url;
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    return '@' + url.slice(idx + marker.length).replace(/\/$/, '');
  }

  function applySocial(platform: (typeof socialPlatforms)[number], raw: string) {
    let value = raw.trim();
    if (!value) {
      if (platform.field === 'instagram') {
        setInstagram('');
        setIgInput('');
      }
      if (platform.field === 'tiktok') {
        setTiktok('');
        setTtInput('');
      }
      if (platform.field === 'youtube') {
        setYoutube('');
        setYtInput('');
      }
      if (platform.field === 'facebook') {
        setFacebook('');
        setFbInput('');
      }
      return;
    }
    if (value.startsWith('@')) value = platform.prefix + value.slice(1);
    else if (!value.startsWith('http')) value = platform.prefix + value;
    if (platform.field === 'instagram') {
      setInstagram(value);
      setIgInput(raw);
    }
    if (platform.field === 'tiktok') {
      setTiktok(value);
      setTtInput(raw);
    }
    if (platform.field === 'youtube') {
      setYoutube(value);
      setYtInput(raw);
    }
    if (platform.field === 'facebook') {
      setFacebook(value);
      setFbInput(raw);
    }
  }

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
          instagram,
          tiktok,
          youtube,
          facebook,
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
      instagram,
      tiktok,
      youtube,
      facebook,
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
      instagram,
      tiktok,
      youtube,
      facebook,
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
                <p className="text-sm text-zinc-400 mb-4">Enter @username — full URL is built for you.</p>
                <div className="space-y-4">
                  {(
                    [
                      ['Instagram', igInput, socialPlatforms[0], instagram],
                      ['TikTok', ttInput, socialPlatforms[1], tiktok],
                      ['YouTube', ytInput, socialPlatforms[2], youtube],
                      ['Facebook', fbInput, socialPlatforms[3], facebook],
                    ] as const
                  ).map(([label, value, platform, full]) => (
                    <div key={label}>
                      <label className="text-sm text-zinc-400 mb-1 block">{label}</label>
                      <input
                        type="text"
                        placeholder="@username"
                        value={value}
                        onChange={(e) => applySocial(platform, e.target.value)}
                        className="w-full bg-zinc-800 p-3 rounded-xl"
                      />
                      {full ? <p className="text-xs text-zinc-500 mt-1 truncate">{full}</p> : null}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === 'links' && (
              <Section title="Links">
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
                  <div className="space-y-2">
                    {links.map((link: any, index: number) => (
                      <div
                        key={link.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                          if (dragIndex === index) return;
                          const next = [...links];
                          const [dragged] = next.splice(dragIndex, 1);
                          next.splice(index, 0, dragged);
                          setLinks(next);
                        }}
                        className="bg-zinc-800 p-3 rounded-xl flex justify-between items-center gap-3 cursor-move"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{link.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{link.url}</div>
                        </div>
                        <button type="button" onClick={() => deleteLink(link.id)} className="text-red-400 text-sm shrink-0">
                          Delete
                        </button>
                      </div>
                    ))}
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
              <div className="rounded-3xl border border-zinc-700 overflow-hidden max-h-[80vh] overflow-y-auto bg-zinc-900">
                <div className="origin-top scale-[0.9] w-[111%]">
                  <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
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
          <div className="flex-1 overflow-y-auto">
            <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
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
