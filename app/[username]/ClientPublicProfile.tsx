'use client';

import { useEffect, useState } from 'react';
import { PhoneIcon, InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon } from '@/components/icons';

interface ClientPublicProfileProps {
  user: any;
  backgroundImages: string[];
}

export default function ClientPublicProfile({ user, backgroundImages }: ClientPublicProfileProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const currentBackground = backgroundImages.length > 0
    ? backgroundImages[currentBgIndex]
    : null;

  const buttonStyle = user.buttonStyle || 'solid';
  let buttonClass = "bg-white text-black border-[4px] border-black hover:bg-yellow-300 active:bg-yellow-400 shadow-[3px_3px_0_0_#000] font-bold text-center py-4 px-8 rounded-2xl text-lg active:scale-[0.985] transition-all";

  if (buttonStyle === 'outline') {
    buttonClass = "bg-transparent border-[4px] border-white text-white hover:bg-white hover:text-black active:bg-yellow-300 shadow-[3px_3px_0_0_#000] font-bold text-center py-4 px-8 rounded-2xl text-lg active:scale-[0.985] transition-all";
  } else if (buttonStyle === 'glass') {
    buttonClass = "bg-white/10 backdrop-blur-md border-[4px] border-white/60 text-white hover:bg-white/30 active:bg-yellow-300 shadow-[3px_3px_0_0_#000] font-bold text-center py-4 px-8 rounded-2xl text-lg active:scale-[0.985] transition-all";
  }

  const hasVCardInfo = !!(user.phone?.trim() || user.email?.trim() || user.company?.trim() || user.title?.trim() || user.address?.trim());

  return (
    <div
      className="min-h-screen flex justify-center items-start pt-8 pb-12 px-4"
      style={{ backgroundColor: '#C4CFDA' }}
    >
      <div className="w-full max-w-[420px] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200"
           style={{ backgroundColor: user.backgroundColor || '#0a0a0a' }}>

        {/* HERO SECTION */}
        <div
          className="relative w-full pt-40 pb-28 px-8"
          style={{
            backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%'
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 50%, ${user.backgroundColor || '#0a0a0a'} 90%)`
            }}
          />
        </div>

        {/* CONTENT */}
        <div className="px-8 pt-8 pb-10 -mt-20 relative z-20">

          {/* Profile Photo + Name + Bio */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-32 h-32 rounded-full border-[6px] border-black shadow-[4px_4px_0_0_#000] overflow-hidden bg-white mb-4">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#f4d9b0] flex items-center justify-center text-6xl">🐱</div>
              )}
            </div>

            <h1 className="text-4xl font-black tracking-[-2px] text-white leading-none mb-2 drop-shadow-[3px_3px_0_#000]">
              {user.name}
            </h1>

            {user.bio && (
              <p className="text-white/90 text-[15px] leading-tight max-w-[280px] mx-auto drop-shadow-[1px_1px_0_#000]">
                {user.bio}
              </p>
            )}
          </div>

          {/* Social Icons + Add Contact */}
          <div className="flex justify-center items-center gap-6 mb-10">
            {hasVCardInfo && (
              <a
                href={`/api/vcard/${user.username}`}
                download={`${user.username}.vcf`}
                className="w-14 h-14 flex flex-col items-center justify-center bg-[#C4CFDA] hover:bg-[#E72679] active:bg-[#FCCC82] text-black border-[4px] border-black rounded-2xl shadow-[3px_3px_0_0_#000] active:scale-[0.96] transition-all"
              >
                <PhoneIcon className="w-6 h-6 mb-0.5 text-black" />
                <span className="text-[10px] font-black tracking-widest -mt-0.5">+ ADD</span>
              </a>
            )}

            {user.instagram && user.instagram.trim() !== '' && (
              <a href={user.instagram} target="_blank" className="text-4xl hover:scale-110 transition-all">
                <InstagramIcon className="w-10 h-10 text-[#E72679]" />
              </a>
            )}
            {user.tiktok && user.tiktok.trim() !== '' && (
              <a href={user.tiktok} target="_blank" className="text-4xl hover:scale-110 transition-all">
                <TikTokIcon className="w-10 h-10 text-[#3EBEEF]" />
              </a>
            )}
            {user.youtube && user.youtube.trim() !== '' && (
              <a href={user.youtube} target="_blank" className="text-4xl hover:scale-110 transition-all">
                <YouTubeIcon className="w-10 h-10 text-[#FCCC82]" />
              </a>
            )}
            {user.facebook && user.facebook.trim() !== '' && (
              <a href={user.facebook} target="_blank" className="text-4xl hover:scale-110 transition-all">
                <FacebookIcon className="w-10 h-10 text-[#3EBEEF]" />
              </a>
            )}
          </div>

          {/* Links */}
          <div className="space-y-3.5">
            {user.links && user.links.filter((l: any) => l.isActive).map((link: any) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                className={`block ${buttonClass}`}
              >
                {link.title}
              </a>
            ))}
          </div>

          <p className="text-white/50 text-xs mt-12 text-center tracking-[3px]">POWERED BY BOOPBASE</p>
        </div>
      </div>
    </div>
  );
}