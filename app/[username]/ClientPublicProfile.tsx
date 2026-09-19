'use client';

import { useEffect, useState } from 'react';
import { getSkinById } from '@/lib/skins';
import { legacySocialsToEntries } from '@/lib/socialPlatforms';
import { SocialGlyph } from '@/components/icons/SocialGlyph';
import { BOOP_LOGO_BLACK, BOOP_LOGO_WHITE } from '@/lib/brandLogos';

interface ClientPublicProfileProps {
  user: any;
  backgroundImages: string[];
}

function isLightColor(color: string | undefined): boolean {
  const c = (color || '#000000').trim().toLowerCase();
  if (c === 'white' || c === '#fff' || c === '#ffffff') return true;
  if (c === 'black' || c === '#000' || c === '#000000') return false;
  const hex = c.startsWith('#') ? c.slice(1) : '';
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
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

  const hasUserHero = backgroundImages.length > 0 && Boolean(backgroundImages[0]);
  const userHero = hasUserHero ? backgroundImages[currentBgIndex] : null;
  const skinHero = skin.assets.hero || null;
  const skinCover = skin.assets.cover || null;

  const heroImage = userHero || skinHero;
  const footerArt = skinCover || skinHero;

  const useThemeBG = user?.useThemeBackground !== false;
  const cardColor = useThemeBG ? skin.tokens.cardBg : user?.innerBackgroundColor || '#ffffff';
  const pageColor = user?.outerBackgroundColor || '#C4CFDA';

  const hasContact =
    Boolean(user?.phone?.trim()) ||
    Boolean(user?.email?.trim()) ||
    Boolean(user?.company?.trim());

  const activeLinks = (user?.links || []).filter((l: any) => l.isActive !== false);
  const socials = legacySocialsToEntries(user || {});

  const footerTextColor = skin.tokens.text;
  const logoSrc = isLightColor(footerTextColor) ? BOOP_LOGO_WHITE : BOOP_LOGO_BLACK;

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
      <div
        className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-black/15"
        style={{ backgroundColor: cardColor }}
      >
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

        <div
          className={`pt-16 px-6 ${skin.contentAreaClass || ''}`}
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

          {socials.length > 0 && (
            <div className="flex justify-center flex-wrap gap-3 mb-6">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={skin.socialIconClass}
                  title={s.platform}
                >
                  <SocialGlyph platform={s.platform} className="w-6 h-6" />
                </a>
              ))}
            </div>
          )}

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
        </div>

        <div className="relative" style={{ backgroundColor: cardColor }}>
          {footerArt && (
            <div
              className="relative w-full h-32 sm:h-40 mt-6"
              style={{
                backgroundImage: `url(${footerArt})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
              aria-hidden
            >
              <div
                className="absolute inset-x-0 top-0 h-12 pointer-events-none"
                style={{ background: `linear-gradient(to bottom, ${cardColor}, transparent)` }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${cardColor}, transparent)` }}
              />
            </div>
          )}

          <footer
            className="flex flex-col items-center gap-1.5 px-6 pt-4 pb-6"
            style={{ color: footerTextColor }}
          >
            <p className="text-center text-[10px] tracking-[0.18em] opacity-45 m-0">
              Building Opportunities One Profile at a time
            </p>
            <a
              href="https://easydidit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Boop by EasyDidIt"
            >
              <img
                src={logoSrc}
                alt="Boop"
                className="h-8 w-auto max-w-[10rem] object-contain"
              />
            </a>
            <p className="text-center text-[11px] tracking-[0.12em] opacity-55 m-0">
              by EasyDidIt
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
