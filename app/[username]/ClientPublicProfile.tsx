'use client';

import { useEffect, useState } from 'react';
import { getThemeById } from '@/lib/themes';
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon } from '@/components/icons';

interface ClientPublicProfileProps {
  user: any;
  backgroundImages: string[];
}

export default function ClientPublicProfile({ user, backgroundImages }: ClientPublicProfileProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const theme = getThemeById(user?.themeId || 'boop-classic');

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length), 7000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const currentBackground = backgroundImages.length > 0 ? backgroundImages[currentBgIndex] : null;
  const useThemeBG = user?.useThemeBackground !== false;
  const innerBgColor = useThemeBG && theme['--card-bg'] ? theme['--card-bg'] : (user?.innerBackgroundColor || '#ffffff');

  return (
    <div className="min-h-screen flex justify-center items-start pt-6 pb-12 px-4" style={{ backgroundColor: user?.outerBackgroundColor || '#C4CFDA' }}>
      <div className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl" style={{ backgroundColor: innerBgColor }}>
        
        {/* HERO */}
        <div className="relative h-80 flex items-end pb-8" style={{
          backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: innerBgColor,
        }}>
          {currentBackground && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/85 pointer-events-none" />
          )}

          <div className="px-6 w-full relative z-10">
            <div className="flex justify-center -mb-16">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-32 h-32 object-cover rounded-full border-[6px] border-white shadow-xl" />
              ) : (
                <div className="w-32 h-32 bg-[#f4d9b0] rounded-full border-[6px] border-white shadow-xl flex items-center justify-center text-6xl">🐱</div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className={`pt-8 pb-12 px-6 ${theme.contentAreaClass || 'bg-white/95'}`} style={{ backgroundColor: innerBgColor, color: theme['--text'] }}>
          <div className="text-center mb-7">
            <h1 className="text-4xl font-extrabold tracking-tight mb-1.5">{user?.name || 'Your Name'}</h1>
            <p className="text-lg opacity-80">{user?.bio || 'Short bio here...'}</p>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4 mb-6">
            {user?.instagram && (
              <a href={user.instagram} target="_blank" className={theme.socialIconClass}>
                <InstagramIcon className="w-6 h-6" />
              </a>
            )}
            {user?.tiktok && (
              <a href={user.tiktok} target="_blank" className={theme.socialIconClass}>
                <TikTokIcon className="w-6 h-6" />
              </a>
            )}
            {user?.youtube && (
              <a href={user.youtube} target="_blank" className={theme.socialIconClass}>
                <YouTubeIcon className="w-6 h-6" />
              </a>
            )}
            {user?.facebook && (
              <a href={user.facebook} target="_blank" className={theme.socialIconClass}>
                <FacebookIcon className="w-6 h-6" />
              </a>
            )}
          </div>

          {/* vCard Button with Mobile Phone Icon */}
          <div className="flex justify-center mb-8">
            <a 
              href={`/api/vcard/${user?.username}`} 
              className={theme.addToContactsClass + " flex items-center gap-3"}
            >
              {/* Mobile Phone SVG Icon (single color) */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.5-4h-9V6h9v10z"/>
              </svg>
              <span>ADD TO CONTACTS</span>
            </a>
          </div>

          {/* Links */}
          <div className="space-y-3.5">
            {user?.links && user.links.filter((l: any) => l.isActive).map((link: any) => (
              <a key={link.id} href={link.url} target="_blank" className={`block text-center ${theme.buttonClass} py-4 px-8 text-lg active:scale-[0.985] transition-all`}>
                {link.title}
              </a>
            ))}
          </div>

          <p className="text-center text-xs mt-12 tracking-widest opacity-50">POWERED BY BOOPBASE</p>
        </div>
      </div>
    </div>
  );
}