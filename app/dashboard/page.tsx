'use client';

import { useState, useEffect } from 'react';

const socialPlatforms = [
  { name: 'Instagram', prefix: 'https://instagram.com/', icon: '📷' },
  { name: 'TikTok', prefix: 'https://tiktok.com/@', icon: '🎵' },
  { name: 'YouTube', prefix: 'https://youtube.com/@', icon: '▶️' },
  { name: 'Facebook', prefix: 'https://facebook.com/', icon: '📘' },
  { name: 'X/Twitter', prefix: 'https://x.com/', icon: '🐦' },
  { name: 'Custom Link', prefix: '', icon: '🔗' }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('links');
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(socialPlatforms[0]);
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [totalViews, setTotalViews] = useState(0);

  // Load user data
  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setName(data.name || '');
        setBio(data.bio || '');
        setPhoto(data.profileImage || null);
        setBgColor(data.backgroundColor || '#000000');
        setBgImage(data.backgroundImage || null);
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
      })
      .catch(err => console.error(err));
  }, []);

  // Image compression
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
    setSaving(true);
    try {
      const res = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'pez',
          name, bio, buttonStyle, backgroundColor: bgColor,
          backgroundImage: bgImage, profileImage: photo,
          links, instagram, tiktok, youtube, facebook,
          phone, email, company, title, address
        }),
      });

      if (res.ok) {
        alert('All changes saved successfully!');
      } else {
        alert('Failed to save changes');
      }
    } catch (err) {
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  const addLink = () => {
    if (!newTitle || !newUrl) return;

    let finalUrl = newUrl;
    if (selectedPlatform.prefix && newUrl.startsWith('@')) {
      finalUrl = selectedPlatform.prefix + newUrl.slice(1);
    }

    setLinks([...links, { 
      id: Date.now(), 
      title: newTitle, 
      url: finalUrl, 
      isActive: true, 
      clicks: 0,
      platform: selectedPlatform.name 
    }]);

    setNewTitle('');
    setNewUrl('');
  };

  const deleteLink = (id: number) => {
    if (!confirm('Delete this link?')) return;
    setLinks(links.filter(l => l.id !== id));
  };

  const updateButtonStyle = (style: string) => setButtonStyle(style);

  const uploadPhoto = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const resized = await resizeImage(file, 400, 400);
      setPhoto(resized);
    } catch (err) {
      alert('Failed to process image');
    }
    setUploadingPhoto(false);
  };

  const uploadBgImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const resized = await resizeImage(file, 1200, 1200);
      setBgImage(resized);
    } catch (err) {
      alert('Failed to process image');
    }
    setUploadingBg(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            {(user?.username || 'USER').toUpperCase()} DASHBOARD
          </h1>
          <button onClick={saveAllChanges} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('links')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'links' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Links</button>
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Profile</button>
          <button onClick={() => setActiveTab('design')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'design' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Design</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'analytics' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Analytics</button>
        </div>

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-6">Add New Link</h3>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <select 
                  value={selectedPlatform.name} 
                  onChange={(e) => {
                    const plat = socialPlatforms.find(p => p.name === e.target.value);
                    setSelectedPlatform(plat || socialPlatforms[0]);
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white"
                >
                  {socialPlatforms.map((plat) => (
                    <option key={plat.name} value={plat.name}>{plat.icon} {plat.name}</option>
                  ))}
                </select>

                <input 
                  type="text" 
                  placeholder={selectedPlatform.name === 'Custom Link' ? "https://..." : "@username"} 
                  value={newUrl} 
                  onChange={(e) => setNewUrl(e.target.value)} 
                  className="flex-1 bg-zinc-800 p-3 rounded-2xl" 
                />

                <input 
                  type="text" 
                  placeholder="Display Title" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="flex-1 bg-zinc-800 p-3 rounded-2xl" 
                />

                <button onClick={addLink} className="bg-white text-black px-8 rounded-2xl font-medium">Add Link</button>
              </div>

              {links.length > 0 && (
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
                        const newLinks = [...links];
                        const [draggedLink] = newLinks.splice(dragIndex, 1);
                        newLinks.splice(index, 0, draggedLink);
                        setLinks(newLinks);
                      }}
                      className="bg-zinc-800 p-4 rounded-2xl flex justify-between items-center cursor-move border border-transparent hover:border-zinc-600"
                    >
                      <div>
                        <div className="font-medium">{link.title}</div>
                        <div className="text-sm text-gray-400">{link.url}</div>
                      </div>
                      <div className="text-emerald-400 font-mono">
                        {(link.clicks || 0)} clicks
                      </div>
                      <button onClick={() => deleteLink(link.id)} className="text-red-400">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Profile Photo</h3>
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden">
                  {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl">👤</div>}
                </div>
                <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-2xl font-medium">
                  Upload Photo<input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Name</h3>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl text-lg" placeholder="Your full name" />
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl">Headline / Bio</h3>
                <span className="text-sm text-gray-400">{bio.length}/200</span>
              </div>
              <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))} maxLength={200} className="w-full bg-zinc-800 p-4 rounded-2xl h-32 resize-y" placeholder="Your tagline or bio..." />
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">vCard Info</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* DESIGN TAB */}
        {activeTab === 'design' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Background Image</h3>
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
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Background Color</h3>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-16 h-12" />
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Button Style</h3>
              <div className="grid grid-cols-3 gap-4">
                {['solid', 'outline', 'glass'].map((style) => (
                  <button
                    key={style}
                    onClick={() => updateButtonStyle(style)}
                    className={`py-4 rounded-2xl font-medium border transition-all ${
                      buttonStyle === style ? 'bg-white text-black border-white' : 'bg-transparent border-white/30 text-white/80'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
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

            <div className="bg-zinc-800 rounded-3xl p-8">
              <h4 className="text-lg mb-6">Link Performance</h4>
              {links.length > 0 ? (
                <div className="space-y-4">
                  {links.map((link: any, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-900 p-4 rounded-2xl">
                      <div>
                        <div className="font-medium">{link.title}</div>
                        <div className="text-sm text-gray-400 truncate max-w-[300px]">{link.url}</div>
                      </div>
                      <div className="text-emerald-400 font-mono">
                        {(link.clicks || 0)} clicks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No links yet.</p>
              )}
            </div>
          </div>
        )}

        <button onClick={saveAllChanges} className="w-full bg-emerald-500 py-4 rounded-2xl font-semibold mt-8">
          Save All Changes
        </button>
      </div>
    </div>
  );
}