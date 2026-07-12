'use client';

import { useState, useEffect } from 'react';
import ClientPublicProfile from '../[username]/ClientPublicProfile';
import { themes } from '@/lib/themes';

const MAX_IMAGE_SIZE_MB = 2;

const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [outerBgColor, setOuterBgColor] = useState('#C4CFDA');
  const [useOuterBgColor, setUseOuterBgColor] = useState(true);
  const [innerBgColor, setInnerBgColor] = useState('#ffffff');
  const [useThemeBackground, setUseThemeBackground] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState('boop-classic');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUser(data);
          setName(data.name || '');
          setBio(data.bio || '');
          setPhoto(data.profileImage || null);
          setOuterBgColor(data.outerBackgroundColor || '#C4CFDA');
          setUseOuterBgColor(data.useOuterBackgroundColor !== false);
          setInnerBgColor(data.innerBackgroundColor || '#ffffff');
          setUseThemeBackground(data.useThemeBackground === true);
          setBgImage(data.backgroundImage || null);
          setLinks(data.links || []);
          setSelectedThemeId(data.themeId || 'boop-classic');
          setInstagram(data.instagram || '');
          setTiktok(data.tiktok || '');
          setYoutube(data.youtube || '');
          setFacebook(data.facebook || '');
        }
      })
      .catch(() => {});
  }, []);

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          name,
          bio,
          themeId: selectedThemeId,
          outerBackgroundColor: outerBgColor,
          useOuterBackgroundColor: useOuterBgColor,
          innerBackgroundColor: innerBgColor,
          useThemeBackground: useThemeBackground,
          backgroundImage: bgImage,
          profileImage: photo,
          links,
          instagram,
          tiktok,
          youtube,
          facebook,
        }),
      });

      if (res.ok) {
        alert('✅ All changes saved successfully!');
      } else {
        alert('Failed to save changes');
      }
    } catch (err) {
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  const uploadPhoto = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`Image is too large. Please use an image under ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 600, 0.75);
      setPhoto(compressedBase64);
    } catch (error) {
      alert('Failed to process image');
    }
  };

  const uploadBgImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`Image is too large. Please use an image under ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 1200, 0.65);
      setBgImage(compressedBase64);
    } catch (error) {
      alert('Failed to process image');
    }
  };

  const addLink = () => {
    if (!newTitle || !newUrl) return;
    setLinks([...links, { id: Date.now(), title: newTitle, url: newUrl, isActive: true, clicks: 0 }]);
    setNewTitle(''); setNewUrl('');
  };

  const deleteLink = (id: number) => {
    if (!confirm('Delete this link?')) return;
    setLinks(links.filter(l => l.id !== id));
  };

  // ==================== DRAG & DROP (RESTORED) ====================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLinks = [...links];
    const [draggedItem] = newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedItem);

    setLinks(newLinks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  // ============================================================

  const PreviewSkeleton = () => (
    <div className="bg-zinc-900 rounded-3xl p-8 animate-pulse">
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 bg-zinc-800 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-zinc-800 rounded w-3/4 mx-auto" />
        <div className="h-5 bg-zinc-800 rounded w-1/2 mx-auto" />
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-14 bg-zinc-800 rounded-2xl" />
        <div className="h-14 bg-zinc-800 rounded-2xl" />
        <div className="h-14 bg-zinc-800 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold">
          {(user?.username || 'USER').toUpperCase()} DASHBOARD
        </h1>

        <button
          onClick={() => setShowPreviewModal(true)}
          className="lg:hidden bg-white text-black px-5 py-2 rounded-2xl font-semibold text-sm active:scale-[0.985]"
        >
          Show Preview
        </button>

        <button 
          onClick={saveAllChanges} 
          disabled={saving} 
          className="hidden lg:block bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-2xl font-semibold"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        
        {/* EDITOR */}
        <div className="w-full lg:w-1/2 overflow-auto p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-zinc-800">
          <div className="max-w-2xl mx-auto">
            <div className="lg:hidden flex justify-end mb-6">
              <button 
                onClick={saveAllChanges} 
                disabled={saving} 
                className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-2xl font-semibold text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
              {['profile', 'links', 'social', 'design', 'analytics'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-5 py-3 font-medium capitalize text-sm lg:text-base whitespace-nowrap border-b-2 ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Profile Photo</h3>
                  {photo && <img src={photo} alt="profile" className="w-32 h-32 object-cover rounded-full mb-4" />}
                  <label className="cursor-pointer block bg-white text-black py-4 text-center rounded-2xl font-medium">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                  </label>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Name</h3>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Bio / Tagline (max 75 chars)</h3>
                  <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 75))} className="w-full bg-zinc-800 p-4 rounded-2xl h-24 resize-y" />
                  <p className="text-xs text-right text-zinc-400 mt-1">{bio.length}/75</p>
                </div>
              </div>
            )}

            {/* LINKS TAB (WITH DRAG & DROP RESTORED) */}
            {activeTab === 'links' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Add New Link</h3>
                  <div className="flex gap-3">
                    <input type="text" placeholder="Link Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1 bg-zinc-800 p-4 rounded-2xl" />
                    <input type="text" placeholder="https://" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 bg-zinc-800 p-4 rounded-2xl" />
                    <button onClick={addLink} className="bg-white text-black px-8 rounded-2xl font-medium">Add</button>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Your Links (Drag to reorder)</h3>
                  {links.length > 0 ? (
                    <div className="space-y-3">
                      {links.map((link, index) => (
                        <div
                          key={link.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            group bg-zinc-800 p-4 rounded-2xl flex items-center gap-4 cursor-move transition-all border-2
                            ${draggedIndex === index 
                              ? 'opacity-40 border-dashed border-white scale-[0.97] shadow-xl' 
                              : 'border-transparent hover:bg-zinc-700 hover:border-zinc-600'
                            }
                          `}
                        >
                          <div className="text-zinc-500 cursor-grab active:cursor-grabbing select-none text-lg">⋮⋮</div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate text-lg">{link.title}</div>
                            <div className="text-sm text-gray-400 truncate">{link.url}</div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="bg-emerald-900 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                              {link.clicks || 0} clicks
                            </span>
                            <button 
                              onClick={() => deleteLink(link.id)} 
                              className="text-red-400 hover:text-red-500 px-3 py-1 opacity-70 group-hover:opacity-100 transition-opacity"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No links yet. Add some above!</p>
                  )}
                </div>
              </div>
            )}

            {/* SOCIAL TAB */}
            {activeTab === 'social' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-6">Social Media Links</h3>
                  <div className="space-y-6">
                    <div><label className="block text-sm mb-2">Instagram</label><input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/yourusername" className="w-full bg-zinc-800 p-4 rounded-2xl" /></div>
                    <div><label className="block text-sm mb-2">TikTok</label><input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/@yourusername" className="w-full bg-zinc-800 p-4 rounded-2xl" /></div>
                    <div><label className="block text-sm mb-2">YouTube</label><input type="text" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/@yourchannel" className="w-full bg-zinc-800 p-4 rounded-2xl" /></div>
                    <div><label className="block text-sm mb-2">Facebook</label><input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/yourpage" className="w-full bg-zinc-800 p-4 rounded-2xl" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Choose Theme</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {themes.map(theme => (
                      <button key={theme.id} onClick={() => setSelectedThemeId(theme.id)} className={`p-6 rounded-2xl border-2 text-left ${selectedThemeId === theme.id ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'}`}>
                        <div className="font-semibold text-lg">{theme.name}</div>
                        <div className="text-sm text-zinc-400 mt-1">{theme.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Background Image (Hero)</h3>
                  {bgImage && <img src={bgImage} className="w-full h-48 object-cover rounded-2xl mb-4" />}
                  <label className="cursor-pointer block bg-white text-black py-4 text-center rounded-2xl font-medium">
                    Upload Background Image
                    <input type="file" accept="image/*" onChange={uploadBgImage} className="hidden" />
                  </label>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl">Outer Background (OBG)</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useOuterBgColor} onChange={(e) => setUseOuterBgColor(e.target.checked)} className="w-5 h-5" />
                      <span className="text-sm">Use Color</span>
                    </label>
                  </div>
                  {useOuterBgColor && <input type="color" value={outerBgColor} onChange={e => setOuterBgColor(e.target.value)} className="w-20 h-12" />}
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl">Inside Background (IBG)</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!useThemeBackground} onChange={(e) => setUseThemeBackground(!e.target.checked)} className="w-5 h-5" />
                      <span className="text-sm">Use Custom Color</span>
                    </label>
                  </div>
                  {!useThemeBackground && <input type="color" value={innerBgColor} onChange={e => setInnerBgColor(e.target.value)} className="w-20 h-12" />}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
{activeTab === 'analytics' && (
  <div className="space-y-8">
    <div className="bg-zinc-900 rounded-3xl p-8">
      <h3 className="text-xl mb-6">Analytics Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Profile Views */}
        <div className="bg-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Total Profile Views</div>
          <div className="text-5xl font-bold">{user?.views || 0}</div>
        </div>

        {/* Total Link Clicks */}
        <div className="bg-zinc-800 rounded-2xl p-6">
          <div className="text-sm text-zinc-400 mb-1">Total Link Clicks</div>
          <div className="text-5xl font-bold">
            {links.reduce((sum, link) => sum + (link.clicks || 0), 0)}
          </div>
        </div>
      </div>
    </div>

    {/* Per-Link Breakdown */}
    <div className="bg-zinc-900 rounded-3xl p-8">
      <h3 className="text-xl mb-6">Link Performance</h3>
      
      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="bg-zinc-800 p-5 rounded-2xl flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{link.title}</div>
                <div className="text-sm text-gray-400 truncate">{link.url}</div>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-emerald-400">{link.clicks || 0}</div>
                <div className="text-xs text-zinc-400">clicks</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No links yet. Add some to see performance.</p>
      )}
    </div>
  </div>
)}
          </div>
        </div>

        {/* DESKTOP PREVIEW */}
        <div className="hidden lg:block w-1/2 bg-zinc-900 overflow-auto p-6">
          <div className="sticky top-6">
            <h3 className="text-xl text-white/70 mb-4">👀 Live Preview</h3>
            {user ? (
              <div className="border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl">
                <ClientPublicProfile 
                  user={{
                    ...user, name, bio, profileImage: photo,
                    outerBackgroundColor: useOuterBgColor ? outerBgColor : '#C4CFDA',
                    innerBackgroundColor: innerBgColor,
                    useThemeBackground: useThemeBackground,
                    backgroundImage: bgImage,
                    themeId: selectedThemeId, links, instagram, tiktok, youtube, facebook
                  }} 
                  backgroundImages={bgImage ? [bgImage] : []} 
                />
              </div>
            ) : (
              <PreviewSkeleton />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col lg:hidden">
          <div className="flex justify-between items-center p-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <button onClick={() => setShowPreviewModal(false)} className="text-3xl leading-none px-4">×</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {user ? (
              <ClientPublicProfile 
                user={{
                  ...user, name, bio, profileImage: photo,
                  outerBackgroundColor: useOuterBgColor ? outerBgColor : '#C4CFDA',
                  innerBackgroundColor: innerBgColor,
                  useThemeBackground: useThemeBackground,
                  backgroundImage: bgImage,
                  themeId: selectedThemeId, links, instagram, tiktok, youtube, facebook
                }} 
                backgroundImages={bgImage ? [bgImage] : []} 
              />
            ) : (
              <PreviewSkeleton />
            )}
          </div>
        </div>
      )}
    </div>
  );
}