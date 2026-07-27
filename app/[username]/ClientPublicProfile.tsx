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
    const interval = setInterval(
      () => setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length),
      7000
    );
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const currentBackground = backgroundImages.length > 0 ? backgroundImages[currentBgIndex] : null;
  const useThemeBG = user?.useThemeBackground !== false;
  const innerBgColor = useThemeBG ? skin.tokens.cardBg : user?.innerBackgroundColor || '#ffffff';
  const pageBg = user?.outerBackgroundColor || skin.tokens.pageBg;

  const hasContact =
    Boolean(user?.phone?.trim()) ||
    Boolean(user?.email?.trim()) ||
    Boolean(user?.company?.trim());

  const activeLinks = (user?.links || []).filter((l: any) => l.isActive !== false);

  const trackAndOpen = async (link: { id: string; url: string }) => {
    try {
      if (user?.username && link.id) {
        await fetch('/api/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, linkId: link.id }),
          keepalive: true,
        });
      }
    } catch {
      // never block navigation
    }
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-screen flex justify-center items-start pt-6 pb-12 px-4"
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-black/10"
        style={{ backgroundColor: innerBgColor }}
      >
        {/* HERO */}
        <div
          className="relative h-72 sm:h-80 flex items-end pb-10"
          style={{
            backgroundImage: currentBackground ? `url(${currentBackground})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: currentBackground ? undefined : innerBgColor,
          }}
        >
          {currentBackground ? (
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/90 pointer-events-none" />
          ) : (
            <div
              className="absolute inset-0 pointer-events-none opacity-90"
              style={{
                background: `linear-gradient(180deg, ${skin.tokens.accent}22 0%, transparent 45%, ${innerBgColor} 100%)`,
              }}
            />
          )}

          <div className="px-6 w-full relative z-10">
            <div className="flex justify-center -mb-14 relative">
              <div className="relative w-[8.5rem] h-[8.5rem]">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                    className="w-full h-full object-cover rounded-full border-[5px] border-white shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f4d9b0] rounded-full border-[5px] border-white shadow-xl flex items-center justify-center text-5xl">
                    🐱
                  </div>
                )}
                {skin.assets.profileFrame && (
                  <img
                    src={skin.assets.profileFrame}
                    alt=""
                    className="absolute inset-0 w-full h-full pointer-events-none scale-[1.18]"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className={`pt-16 pb-10 px-6 ${skin.contentAreaClass || ''}`}
          style={{ backgroundColor: innerBgColor, color: skin.tokens.text }}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {user?.name || 'Your Name'}
            </h1>
            <p className="text-base sm:text-lg opacity-75 mt-3 max-w-[20rem] mx-auto leading-snug break-words">
              {user?.bio || 'Short bio here...'}
            </p>
          </div>

          {/* Socials */}
          <div className="flex justify-center flex-wrap gap-3 mb-6">
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

          {/* Contacts — only if user filled contact fields */}
          {hasContact && (
            <div className="flex justify-center mb-8">
              <a
                href={`/api/vcard/${user?.username}`}
                className={`${skin.addToContactsClass} flex items-center gap-3`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.5-4h-9V6h9v10z" />
                </svg>
                <span>ADD TO CONTACTS</span>
              </a>
            </div>
          )}

          {/* Links */}
          <div className="space-y-3.5">
            {activeLinks.map((link: any) => (
              <button
                key={link.id}
                type="button"
                onClick={() => trackAndOpen(link)}
                className="block relative w-full text-center cursor-pointer"
              >
                {skin.assets.linkFrame ? (
                  <>
                    <img
                      src={skin.assets.linkFrame}
                      alt=""
                      className="w-full h-14 object-fill pointer-events-none absolute inset-0"
                    />
                    <span
                      className="relative z-10 flex items-center justify-center h-14 font-bold text-lg px-4"
                      style={{ color: skin.tokens.linkText }}
                    >
                      {link.title}
                    </span>
                  </>
                ) : (
                  <span
                    className={`block py-4 px-8 text-lg ${skin.buttonClass} active:scale-[0.985] transition-all`}
                  >
                    {link.title}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] mt-12 tracking-[0.2em] opacity-40 uppercase">
            Powered by Boop · Bridging Opportunities
          </p>
        </div>
      </div>
    </div>
  );
}
