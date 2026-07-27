'use client';

import { useState, useEffect, useMemo } from 'react';
import ClientPublicProfile from '@/app/[username]/ClientPublicProfile';
import { themes } from '@/lib/themes';

const socialPlatforms = [
  { name: 'Instagram', prefix: 'https://instagram.com/', field: 'instagram' as const },
  { name: 'TikTok', prefix: 'https://tiktok.com/@', field: 'tiktok' as const },
  { name: 'YouTube', prefix: 'https://youtube.com/@', field: 'youtube' as const },
  { name: 'Facebook', prefix: 'https://facebook.com/', field: 'facebook' as const },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('social');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [outerBg, setOuterBg] = useState('#C4CFDA');
  const [innerBg, setInnerBg] = useState('#ffffff');
  const [useThemeBg, setUseThemeBg] = useState(true);
  const [themeId, setThemeId] = useState('boop-classic');
  const [links, setLinks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [buttonStyle, setButtonStyle] = useState('solid');
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
  const [totalViews, setTotalViews] = useState(0);

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
        setBgColor(data.backgroundColor || '#0a0a0a');
        setBgImage(data.backgroundImage || null);
        setOuterBg(data.outerBackgroundColor || '#C4CFDA');
        setInnerBg(data.innerBackgroundColor || '#ffffff');
        setUseThemeBg(data.useThemeBackground !== false);
        setThemeId(data.themeId || 'boop-classic');
        setLinks(data.links || []);
        setButtonStyle(data.buttonStyle || 'solid');
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

    if (value.startsWith('@')) {
      value = platform.prefix + value.slice(1);
    } else if (!value.startsWith('http')) {
      value = platform.prefix + value;
    }

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

  const resizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
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
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const saveAllChanges = async () => {
    if (!user?.username) {
      alert('Not logged in');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name,
          bio,
          buttonStyle,
          backgroundColor: bgColor,
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
      if (res.ok) {
        alert('All changes saved successfully!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to save changes');
      }
    } catch {
      alert('Failed to save changes');
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
      {
        id: String(Date.now()),
        title: newTitle.trim(),
        url: finalUrl,
        isActive: true,
        clicks: 0,
      },
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
      const resized = await resizeImage(file, 400, 400);
      setPhoto(resized);
    } catch {
      alert('Failed to process image');
    }
  };

  const uploadBgImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file, 1200, 1200);
      setBgImage(resized);
    } catch {
      alert('Failed to process image');
    }
  };

  const liveUser = useMemo(
    () => ({
      username: user?.username || 'preview',
      name,
      bio,
      profileImage: photo,
      backgroundImage: bgImage,
      backgroundColor: bgColor,
      outerBackgroundColor: outerBg,
      innerBackgroundColor: innerBg,
      useThemeBackground: useThemeBg,
      themeId,
      buttonStyle,
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
      bgColor,
      outerBg,
      innerBg,
      useThemeBg,
      themeId,
      buttonStyle,
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

  const tabs = [
    { id: 'social', label: 'Social Buttons' },
    { id: 'links', label: 'Links' },
    { id: 'profile', label: 'Profile' },
    { id: 'design', label: 'Design' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            {(user?.username || 'USER').toUpperCase()} DASHBOARD
          </h1>
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {activeTab === 'social' && (
              <div className="bg-zinc-900 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-xl mb-1">Social Buttons</h3>
                  <p className="text-zinc-400 text-sm">
                    Enter @username — the full link is created automatically
                  </p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Instagram</label>
                    <input
                      type="text"
                      placeholder="@yourusername"
                      value={igInput}
                      onChange={(e) => applySocial(socialPlatforms[0], e.target.value)}
                      className="w-full bg-zinc-800 p-4 rounded-2xl"
                    />
                    {instagram && <p className="text-xs text-zinc-500 mt-1 truncate">{instagram}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">TikTok</label>
                    <input
                      type="text"
                      placeholder="@yourusername"
                      value={ttInput}
                      onChange={(e) => applySocial(socialPlatforms[1], e.target.value)}
                      className="w-full bg-zinc-800 p-4 rounded-2xl"
                    />
                    {tiktok && <p className="text-xs text-zinc-500 mt-1 truncate">{tiktok}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">YouTube</label>
                    <input
                      type="text"
                      placeholder="@yourusername"
                      value={ytInput}
                      onChange={(e) => applySocial(socialPlatforms[2], e.target.value)}
                      className="w-full bg-zinc-800 p-4 rounded-2xl"
                    />
                    {youtube && <p className="text-xs text-zinc-500 mt-1 truncate">{youtube}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Facebook</label>
                    <input
                      type="text"
                      placeholder="@page or username"
                      value={fbInput}
                      onChange={(e) => applySocial(socialPlatforms[3], e.target.value)}
                      className="w-full bg-zinc-800 p-4 rounded-2xl"
                    />
                    {facebook && <p className="text-xs text-zinc-500 mt-1 truncate">{facebook}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'links' && (
              <div className="bg-zinc-900 rounded-3xl p-8">
                <h3 className="text-xl mb-6">Custom Links</h3>
                <div className="flex flex-col gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="https://your-link.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="bg-zinc-800 p-3 rounded-2xl"
                  />
                  <input
                    type="text"
                    placeholder="Display Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-zinc-800 p-3 rounded-2xl"
                  />
                  <button onClick={addLink} className="bg-white text-black py-3 rounded-2xl font-medium">
                    Add Link
                  </button>
                </div>
                {links.length > 0 ? (
                  <div className="space-y-3">
                    {links.map((link: any, index: number) => (
                      <div
                        key={link.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          if (dragIndex === index) return;
                          const next = [...links];
                          const [dragged] = next.splice(dragIndex, 1);
                          next.splice(index, 0, dragged);
                          setLinks(next);
                        }}
                        className="bg-zinc-800 p-4 rounded-2xl flex justify-between items-center cursor-move"
                      >
                        <div className="min-w-0">
                          <div className="font-medium">{link.title}</div>
                          <div className="text-sm text-gray-400 truncate">{link.url}</div>
                        </div>
                        <button onClick={() => deleteLink(link.id)} className="text-red-400 shrink-0 ml-4">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No custom links yet.</p>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Profile Photo</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden">
                      {photo ? (
                        <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl">👤</div>
                      )}
                    </div>
                    <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-2xl font-medium">
                      Upload Photo
                      <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Name</h3>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-800 p-4 rounded-2xl text-lg"
                    placeholder="Your full name"
                  />
                </div>
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl">Headline / Bio</h3>
                    <span className="text-sm text-gray-400">{bio.length}/200</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    maxLength={200}
                    className="w-full bg-zinc-800 p-4 rounded-2xl h-32 resize-y"
                    placeholder="Your tagline or bio..."
                  />
                </div>
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">vCard Info</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                    <input type="text" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                    <input type="text" placeholder="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                    <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Theme</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeId(t.id)}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          themeId === t.id
                            ? 'border-white bg-zinc-800'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                        }`}
                      >
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-sm text-zinc-400">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Card background</h3>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useThemeBg}
                      onChange={(e) => setUseThemeBg(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span>Use theme card color</span>
                  </label>
                  {!useThemeBg && (
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Custom card color</label>
                      <input type="color" value={innerBg} onChange={(e) => setInnerBg(e.target.value)} className="w-16 h-12" />
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Page background (outside card)</h3>
                  <input type="color" value={outerBg} onChange={(e) => setOuterBg(e.target.value)} className="w-16 h-12" />
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Hero / background image</h3>
                  <div className="flex flex-col items-center gap-4">
                    {bgImage && (
                      <div className="w-64 h-36 border border-zinc-700 rounded-2xl overflow-hidden">
                        <img src={bgImage} alt="Background Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-2xl font-medium">
                      Upload Background Image
                      <input type="file" accept="image/*" onChange={uploadBgImage} className="hidden" />
                    </label>
                    {bgImage && (
                      <button type="button" onClick={() => setBgImage(null)} className="text-red-400 text-sm">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Legacy background color</h3>
                  <p className="text-sm text-zinc-400 mb-2">Kept for compatibility; outer/inner colors above control the live page.</p>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-16 h-12" />
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Button Style</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['solid', 'outline', 'glass'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setButtonStyle(style)}
                        className={`py-4 rounded-2xl font-medium border transition-all ${
                          buttonStyle === style
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent border-white/30 text-white/80'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-3">Theme styles usually override this on the public page.</p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-zinc-900 rounded-3xl p-8 space-y-8">
                <h3 className="text-2xl mb-6">Analytics Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-800 rounded-3xl p-8 text-center">
                    <div className="text-6xl font-bold text-emerald-400 mb-2">{totalViews}</div>
                    <div className="text-zinc-400">Total Profile Views</div>
                  </div>
                  <div className="bg-zinc-800 rounded-3xl p-8 text-center">
                    <div className="text-6xl font-bold text-emerald-400 mb-2">{links.length}</div>
                    <div className="text-zinc-400">Active Links</div>
                  </div>
                </div>
                {links.length > 0 && (
                  <div className="bg-zinc-800 rounded-3xl p-6">
                    <h4 className="text-lg mb-4">Link Performance</h4>
                    <div className="space-y-3">
                      {links.map((link: any) => (
                        <div key={link.id} className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl">
                          <div className="min-w-0">
                            <div className="font-medium">{link.title}</div>
                            <div className="text-sm text-gray-400 truncate">{link.url}</div>
                          </div>
                          <div className="text-emerald-400 font-mono shrink-0 ml-4">{link.clicks || 0} clicks</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LIVE PREVIEW = real public profile component */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <h3 className="text-xl mb-4 text-center text-zinc-400">Live Preview</h3>
              <div className="rounded-3xl border border-zinc-700 overflow-hidden bg-zinc-900 max-h-[85vh] overflow-y-auto">
                <div className="origin-top scale-[0.92] w-[108.7%]">
                  <ClientPublicProfile user={liveUser} backgroundImages={backgroundImages} />
                </div>
              </div>
              <p className="text-center text-xs text-zinc-500 mt-3">
                Same component as your public page (including Add to Contacts)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={saveAllChanges}
          disabled={saving}
          className="w-full bg-emerald-500 py-4 rounded-2xl font-semibold mt-8 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
