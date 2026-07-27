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

  // Custom upload ALWAYS wins. Remove/clear hero in Design to see the skin’s default hero.
  const hasUserHero = backgroundImages.length > 0 && Boolean(backgroundImages[0]);
  const userHero = hasUserHero ? backgroundImages[currentBgIndex] : null;
  const skinHero = skin.assets.hero || null;
  const skinCover = skin.assets.cover || null;

  // Top of card
  const heroImage = userHero || skinHero;

  // Bottom of card (under links) — prefer cover, else reuse hero art so themed skins always extend
  const footerArt = skinCover || skinHero;

  const useThemeBG = user?.useThemeBackground !== false;
  const cardColor = useThemeBG ? skin.tokens.cardBg : user?.innerBackgroundColor || '#ffffff';

  // Outside card: solid only
  const pageColor = user?.outerBackgroundColor || '#C4CFDA';

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
      style={{ backgroundColor: pageColor }}
    >
      {/* CARD */}
      <div
        className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-black/15"
        style={{ backgroundColor: cardColor }}
      >
        {/* HERO */}
        <div
          className="relative h-72 sm:h-80 flex items-end pb-10"
          style={{
            backgroundColor: cardColor,
            backgroundImage: heroImage ? `url(${heroImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {heroImage ? (
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/80 pointer-events-none" />
          ) : (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(180deg, ${skin.tokens.accent}28 0%, transparent 50%, ${cardColor} 100%)`,
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

        {/* MAIN CONTENT */}
        <div
          className={`pt-16 pb-8 px-6 ${skin.contentAreaClass || ''}`}
          style={{ backgroundColor: cardColor, color: skin.tokens.text }}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {user?.name || 'Your Name'}
            </h1>
            <p className="text-base sm:text-lg opacity-75 mt-3 max-w-[20rem] mx-auto leading-snug break-words">
              {user?.bio || 'Short bio here...'}
            </p>
          </div>

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
                  <span className={`block py-4 px-8 text-lg ${skin.buttonClass} active:scale-[0.985] transition-all`}>
                    {link.title}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] mt-10 mb-2 tracking-[0.2em] opacity-40 uppercase">
            Powered by Boop · Bridging Opportunities
          </p>
        </div>

        {/*
          SKIN FOOTER — inside the card, under links.
          Card extends so themed art sits underneath the content stack.
        */}
        {footerArt && (
          <div
            className="relative w-full h-36 sm:h-44"
            style={{
              backgroundImage: `url(${footerArt})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: cardColor,
            }}
            aria-hidden
          >
            {/* Soft blend from content color into the art */}
            <div
              className="absolute inset-x-0 top-0 h-16 pointer-events-none"
              style={{
                background: `linear-gradient(to bottom, ${cardColor}, transparent)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
