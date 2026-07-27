'use client';

import { useEffect, useState } from 'react';
import { getSkinById } from '@/lib/skins';
import { InstagramIcon, TikTokIcon, YouTubeIcon, FacebookIcon } from '@/components/icons';

interface ClientPublicProfileProps {
  user: any;
  backgroundImages: string[];
}

export default function ClientPublicProfile({ user, backgroundImages }: ClientPublicProfileProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const skin = getSkinById(user?.themeId || 'boop-classic');

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const interval = setInterval(() => setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length), 7000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const currentBackground = backgroundImages.length > 0 ? backgroundImages[currentBgIndex] : null;
  const useThemeBG = user?.useThemeBackground !== false;
  const innerBgColor = useThemeBG ? skin.tokens.cardBg : (user?.innerBackgroundColor || '#ffffff');
  const pageBg = user?.outerBackgroundColor || skin.tokens.pageBg;

  return (
    <div
      className="min-h-screen flex justify-center items-start pt-6 pb-12 px-4"
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: innerBgColor }}
      >
        {/* HERO */}
        <div
          className="relative h-80 flex items-end pb-8"
          style={{
            backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: innerBgColor,
          }}
        >
          {currentBackground && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/85 pointer-events-none" />
          )}

          <div className="px-6 w-full relative z-10">
            <div className="flex justify-center -mb-16 relative">
              <div className="relative w-32 h-32">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded-full border-[6px] border-white shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#f4d9b0] rounded-full border-[6px] border-white shadow-xl flex items-center justify-center text-6xl">
                    🐱
                  </div>
                )}
                {/* Skin profile frame (absolute, transparent center) */}
                {skin.assets.profileFrame && (
                  <img
                    src={skin.assets.profileFrame}
                    alt=""
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scale(1.15)' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`pt-8 pb-12 px-6 ${skin.contentAreaClass || ''}`}
          style={{ backgroundColor: innerBgColor, color: skin.tokens.text }}
        >
          <div className="text-center mb-7">
            <h1 className="text-4xl font-extrabold tracking-tight mb-1.5">
              {user?.name || 'Your Name'}
            </h1>
            <p className="text-lg opacity-80">{user?.bio || 'Short bio here...'}</p>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4 mb-6">
            {user?.instagram && (
              <a href={user.instagram} target="_blank" rel="noopener noreferrer" className={skin.socialIconClass}>
                <InstagramIcon className="w-6 h-6" />
              </a>
            )}
            {user?.tiktok && (
              <a href={user.tiktok} target="_blank" rel="noopener noreferrer" className={skin.socialIconClass}>
                <TikTokIcon className="w-6 h-6" />
              </a>
            )}
            {user?.youtube && (
              <a href={user.youtube} target="_blank" rel="noopener noreferrer" className={skin.socialIconClass}>
                <YouTubeIcon className="w-6 h-6" />
              </a>
            )}
            {user?.facebook && (
              <a href={user.facebook} target="_blank" rel="noopener noreferrer" className={skin.socialIconClass}>
                <FacebookIcon className="w-6 h-6" />
              </a>
            )}
          </div>

          {/* vCard Button */}
          <div className="flex justify-center mb-8">
            <a
              href={`/api/vcard/${user?.username}`}
              className={skin.addToContactsClass + ' flex items-center gap-3'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.5-4h-9V6h9v10z"/>
              </svg>
              <span>ADD TO CONTACTS</span>
            </a>
          </div>

          {/* Links */}
          <div className="space-y-3.5">
            {user?.links &&
              user.links
                .filter((l: any) => l.isActive)
                .map((link: any) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative text-center"
                  >
                    {skin.assets.linkFrame ? (
                      <>
                        <img
                          src={skin.assets.linkFrame}
                          alt=""
                          className="w-full h-14 object-fill pointer-events-none absolute inset-0"
                        />
                        <span
                          className="relative z-10 flex items-center justify-center h-14 font-bold text-lg"
                          style={{ color: skin.tokens.linkText }}
                        >
                          {link.title}
                        </span>
                      </>
                    ) : (
                      <span className={`block py-4 px-8 text-lg ${skin.buttonClass} active:scale-[0.985] transition-all`}>
                        {link.title}
                      </span>
                    )}
                  </a>
                ))}
          </div>

          <p className="text-center text-xs mt-12 tracking-widest opacity-50">
            POWERED BY BOOPBASE
          </p>
        </div>
      </div>
    </div>
  );
}
