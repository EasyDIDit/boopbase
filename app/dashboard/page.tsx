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

  // ... (rest of the file remains the same as previous version for brevity - upload functions, drag & drop, etc.)

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">
            {(user?.username || 'USER').toUpperCase()} DASHBOARD
          </h1>
          <button onClick={saveAllChanges} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50 w-full md:w-auto">
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('links')} className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap ${activeTab === 'links' ? 'border-white text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>Links</button>
          {/* other tabs... */}
        </div>

        {activeTab === 'links' && (
          <div className="space-y-8">
            {/* Improved Links Section */}
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

              {/* Existing Links */}
              {links.length > 0 && (
                <div className="space-y-3">
                  {links.map((link: any, index: number) => (
                    <div key={link.id} className="bg-zinc-800 p-5 rounded-2xl flex items-center gap-4 cursor-move" draggable ... >
                      {/* drag handle, title, url, clicks, delete */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs remain the same */}
      </div>
    </div>
  );
}