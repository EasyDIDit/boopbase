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

  // Load user data on mount
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

      const data = await res.json();

      if (res.ok) {
        alert('All changes saved successfully!');
      } else {
        alert(data.error || 'Failed to save changes');
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
      if (event.target && event.target.result) {
        setPhoto(event.target.result as string);
      }
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
      if (event.target && event.target.result) {
        setBgImage(event.target.result as string);
      }
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
          <button 
            onClick={saveAllChanges} 
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50 w-full md:w-auto"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>My Profile</button>
          <button onClick={() => setActiveTab('links')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'links' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>Links</button>
          <button onClick={() => setActiveTab('design')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'design' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>Design</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'analytics' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>Analytics</button>
        </div>

        {activeTab === 'links' && (
          <div className="space-y-8">
            {/* Social Links */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Social Links</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Instagram URL" value={instagram} onChange={e => setInstagram(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="TikTok URL" value={tiktok} onChange={e => setTiktok(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="YouTube URL" value={youtube} onChange={e => setYoutube(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
                <input type="text" placeholder="Facebook URL" value={facebook} onChange={e => setFacebook(e.target.value)} className="w-full bg-zinc-800 p-4 rounded-2xl" />
              </div>
            </div>

            {/* Regular Links with Drag & Drop */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Regular Links (Drag to reorder)</h3>
              <div className="flex flex-col md:flex-row gap-2 mb-4">
                <input type="text" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1 bg-zinc-800 p-3 rounded" />
                <input type="text" placeholder="https://" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="flex-1 bg-zinc-800 p-3 rounded" />
                <button onClick={addLink} className="bg-white text-black px-6 rounded font-medium">Add</button>
              </div>

              {links.length > 0 ? (
                <div className="space-y-2">
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
              ) : (
                <p className="text-gray-400">No regular links yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Profile Photo */}
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

            {/* Name */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Name</h3>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-zinc-800 p-4 rounded-2xl text-lg" 
                placeholder="Your full name" 
              />
            </div>

            {/* Bio */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl">Headline / Bio</h3>
                <span className="text-sm text-gray-400">{bio.length}/200</span>
              </div>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value.slice(0, 200))} 
                maxLength={200}
                className="w-full max-w-full bg-zinc-800 p-4 rounded-2xl h-32 resize-y" 
                placeholder="Your tagline or bio..." 
              />
            </div>

            {/* vCard Info */}
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

        {activeTab === 'design' && (
          <div className="space-y-8">
            {/* Background Image */}
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

            {/* Background Color */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Background Color</h3>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-16 h-12" />
            </div>

            {/* Button Style */}
            <div className="bg-zinc-900 rounded-3xl p-8">
              <h3 className="text-xl mb-4">Button Style</h3>
              <div className="grid grid-cols-3 gap-4">
                {['solid', 'outline', 'glass'].map((style) => (
                  <button
                    key={style}
                    onClick={() => updateButtonStyle(style)}
                    className={`py-4 rounded-2xl font-medium border transition-all ${
                      buttonStyle === style ? 'bg-white text-black border-white' : 'bg-transparent border-white/30 hover:border-white/60 text-white/80'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
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
                <p className="text-gray-400 text-center py-8">No links yet. Add some to see performance.</p>
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