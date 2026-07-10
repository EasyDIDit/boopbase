'use client';

import { useState, useEffect } from 'react';
import ClientPublicProfile from '../[username]/ClientPublicProfile';

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
      })
      .catch(err => console.error('Failed to load user data', err));
  }, []);

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/save-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'pez',
          name,
          bio,
          buttonStyle,
          backgroundColor: bgColor,
          backgroundImage: bgImage,
          profileImage: photo,
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
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) setPhoto(event.target.result as string);
    };
    reader.readAsDataURL(file);
    setUploadingPhoto(false);
  };

  const uploadBgImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBg(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) setBgImage(event.target.result as string);
    };
    reader.readAsDataURL(file);
    setUploadingBg(false);
  };

  const addLink = () => {
    if (!newTitle || !newUrl) return;
    setLinks([...links, { id: Date.now(), title: newTitle, url: newUrl, isActive: true, clicks: 0 }]);
    setNewTitle('');
    setNewUrl('');
  };

  const deleteLink = (id: number) => {
    if (!confirm('Delete this link?')) return;
    setLinks(links.filter(l => l.id !== id));
  };

  const updateButtonStyle = (style: string) => setButtonStyle(style);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;
    const newLinks = [...links];
    const [draggedLink] = newLinks.splice(dragIndex, 1);
    newLinks.splice(dropIndex, 0, draggedLink);
    setLinks(newLinks);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex h-screen">

        {/* LEFT SIDE - Controls (Linktree style) */}
        <div className="w-1/2 border-r border-zinc-800 overflow-auto p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">
                {(user?.username || 'USER').toUpperCase()} DASHBOARD
              </h1>
              <button 
                onClick={saveAllChanges} 
                disabled={saving}
                className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-2xl font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 mb-8">
              {['profile', 'links', 'design', 'analytics'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 font-medium capitalize border-b-2 transition-all ${
                    activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'links' && (
              <div className="space-y-8">
                {/* Add Link */}
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Add New Link</h3>
                  <div className="flex gap-3">
                    <input type="text" placeholder="Link Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1 bg-zinc-800 p-4 rounded-2xl" />
                    <input type="text" placeholder="https://" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 bg-zinc-800 p-4 rounded-2xl" />
                    <button onClick={addLink} className="bg-white text-black px-8 rounded-2xl font-medium">Add</button>
                  </div>
                </div>

                {/* Links List */}
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Your Links</h3>
                  {links.length > 0 ? (
                    <div className="space-y-3">
                      {links.map((link: any, index: number) => (
                        <div key={link.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, index)} className="bg-zinc-800 p-4 rounded-2xl flex items-center gap-4 cursor-move">
                          <div className="text-zinc-500">⋮⋮</div>
                          <div className="flex-1">
                            <div className="font-medium">{link.title}</div>
                            <div className="text-sm text-gray-400 truncate">{link.url}</div>
                          </div>
                          <button onClick={() => deleteLink(link.id)} className="text-red-400">Delete</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No links yet. Add some above.</p>
                  )}
                </div>
              </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && (
              <div className="space-y-8">
                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Background Image</h3>
                  {bgImage && <img src={bgImage} alt="preview" className="w-full h-48 object-cover rounded-2xl mb-4" />}
                  <label className="cursor-pointer block bg-white text-black py-4 text-center rounded-2xl font-medium">Upload Background Image<input type="file" accept="image/*" onChange={uploadBgImage} className="hidden" /></label>
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Background Color</h3>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-20 h-12" />
                </div>

                <div className="bg-zinc-900 rounded-3xl p-8">
                  <h3 className="text-xl mb-4">Button Style</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {['solid', 'outline', 'glass'].map(s => (
                      <button key={s} onClick={() => setButtonStyle(s)} className={`py-4 rounded-2xl ${buttonStyle === s ? 'bg-white text-black' : 'bg-zinc-800'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs (profile + analytics) can be added later if needed */}
          </div>
        </div>

        {/* RIGHT SIDE - LIVE PREVIEW */}
        <div className="w-1/2 bg-zinc-900 overflow-auto p-8">
          <div className="sticky top-8">
            <h3 className="text-xl mb-4 text-white/70">Live Preview</h3>
            <div className="border border-zinc-700 rounded-3xl overflow-hidden">
              <ClientPublicProfile 
                user={{
                  ...user,
                  name,
                  bio,
                  profileImage: photo,
                  backgroundColor: bgColor,
                  backgroundImage: bgImage,
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
                }} 
                backgroundImages={bgImage ? [bgImage] : []} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}