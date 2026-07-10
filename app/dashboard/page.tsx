'use client';

import { useState, useEffect } from 'react';

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
  const [iconStyle, setIconStyle] = useState('default'); // new: icon style
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
        setIconStyle(data.iconStyle || 'default');
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
          iconStyle,           // new
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
        alert('All changes saved successfully!');
      } else {
        alert('Failed to save changes');
      }
    } catch (err) {
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  // ... (uploadPhoto, uploadBgImage, addLink, deleteLink, drag handlers remain the same)

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
  const updateIconStyle = (style: string) => setIconStyle(style);

  // Drag handlers (same as before)
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
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-4 border-b-2 ${activeTab === 'profile' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>My Profile</button>
          <button onClick={() => setActiveTab('links')} className={`px-6 py-4 border-b-2 ${activeTab === 'links' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Links</button>
          <button onClick={() => setActiveTab('design')} className={`px-6 py-4 border-b-2 ${activeTab === 'design' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Design</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-6 py-4 border-b-2 ${activeTab === 'analytics' ? 'border-white text-white' : 'border-transparent text-zinc-400'}`}>Analytics</button>
        </div>

        {/* Design Tab - New Customization Options */}
        {activeTab === 'design' && (
          <div className="space-y-8">
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Link Button Style</h3>
              <div className="grid grid-cols-3 gap-4">
                {['solid', 'outline', 'glass'].map((style) => (
                  <button
                    key={style}
                    onClick={() => updateButtonStyle(style)}
                    className={`py-4 rounded-2xl font-medium border transition-all ${buttonStyle === style ? 'bg-white text-black' : 'bg-transparent border-white/30 text-white/80'}`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Social Icon Style</h3>
              <div className="grid grid-cols-3 gap-4">
                {['default', 'bold', 'minimal'].map((style) => (
                  <button
                    key={style}
                    onClick={() => updateIconStyle(style)}
                    className={`py-4 rounded-2xl font-medium border transition-all ${iconStyle === style ? 'bg-white text-black' : 'bg-transparent border-white/30 text-white/80'}`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Image & Color (same as before) */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Background Image</h3>
              <div className="flex flex-col items-center gap-4">
                {bgImage && <div className="w-64 h-36 border border-zinc-700 rounded-2xl overflow-hidden"><img src={bgImage} alt="Preview" className="w-full h-full object-cover" /></div>}
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
          </div>
        )}

        {/* Other tabs remain the same (shortened for brevity) */}
        {/* ... profile, links, analytics tabs ... */}

      </div>
    </div>
  );
}