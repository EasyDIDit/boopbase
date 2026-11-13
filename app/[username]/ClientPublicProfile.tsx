'use client';

import { useEffect, useState } from 'react';
import { normalizeLinkUrl } from '@/lib/safeUrl';
import Link from 'next/link';
import { getSkinById } from '@/lib/skins';
import { getProfileFont } from '@/lib/fonts';
import { legacySocialsToEntries } from '@/lib/socialPlatforms';
import { SocialGlyph } from '@/components/icons/SocialGlyph';
import { MascotHead } from '@/components/Mascot';
import { BOOP_LOGO_BLACK, BOOP_LOGO_WHITE } from '@/lib/brandLogos';
import type { PublicProfile } from '@/lib/publicProfile';

interface ClientPublicProfileProps {
  user: PublicProfile;
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


function linkTitleClass(title: string | undefined): string {
  const len = String(title || '').length;
  const size =
    len <= 22 ? 'text-lg leading-snug' :
    len <= 42 ? 'text-[15px] leading-tight' :
    'text-sm leading-tight';
  return `${size} break-words text-center`;
}

export default function ClientPublicProfile({ user, backgroundImages }: ClientPublicProfileProps) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const skin = getSkinById(user?.themeId || 'boop-classic');
  const font = getProfileFont(user?.fontId);

  useEffect(() => {
    if (backgroundImages.length <= 1) return;
    const interval = setInterval(
      () => setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length),
      7000
    );
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) return;
        const me = await res.json();
        if (!cancelled && me?.username && user?.username && me.username.toLowerCase() === user.username.toLowerCase()) {
          setIsOwner(true);
        }
      } catch {
        // public visitors stay without the edit control
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user?.username]);

  const themeOverridesHero = user?.themeOverridesHero === true;
  const hasUserHero = !themeOverridesHero && backgroundImages.length > 0 && Boolean(backgroundImages[0]);
  const userHero = hasUserHero ? backgroundImages[currentBgIndex] : null;
  const skinHero = skin.assets.hero || null;
  const skinCover = skin.assets.cover || null;

  const heroImage = userHero || skinHero;
  const footerArt = skinCover || skinHero;

  const useThemeBG = user?.useThemeBackground !== false;
  const cardColor = useThemeBG ? skin.tokens.cardBg : user?.innerBackgroundColor || '#ffffff';
  const pageColor = user?.outerBackgroundColor || '#C4CFDA';

  const hasContact = user?.hasContactCard === true;

  const videoEmbed = (raw: string): { kind: 'iframe' | 'file'; src: string } | null => {
    try {
      const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.split('/').filter(Boolean)[0];
        return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0` } : null;
      }
      if (host.endsWith('youtube.com')) {
        const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
        return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0` } : null;
      }
      if (host.endsWith('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean).pop();
        return id ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1` } : null;
      }
      if (/\.(mp4|webm|mov)(\?|$)/i.test(u.pathname)) return { kind: 'file', src: u.toString() };
      return null;
    } catch {
      return null;
    }
  };

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
    const safe = normalizeLinkUrl(link.url);
    if (!safe) return;
    window.open(safe, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="min-h-screen flex justify-center items-start pt-6 pb-12 px-4"
      style={{ backgroundColor: pageColor }}
    >
      <div
        className="max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border border-black/15 relative"
        style={{ backgroundColor: cardColor, fontFamily: font.family }}
      >
        {skin.assets.mascot && skin.assets.mascot.position !== 'profile' && (
          <SkinMascotLayer mascot={skin.assets.mascot} />
        )}
        {isOwner && (
          <Link
            href="/dashboard"
            className="absolute top-3 right-3 z-20 rounded-full bg-black px-4 py-2 text-sm font-bold text-white shadow-lg"
          >
            Edit my page
          </Link>
        )}

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
                  // Approved head-only panther. Legacy image assets stay in the repository.
                  <MascotHead className="w-full h-full bg-[#f4d9b0] rounded-full border-[5px] border-white shadow-xl" />
                )}
                {skin.assets.mascot?.position === 'profile' && (
                  <SkinMascotLayer mascot={skin.assets.mascot} />
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

          {(socials.length > 0 || (user?.showContactEmail && user?.contactEmail)) && (
            <div className="flex justify-center flex-wrap gap-3 mb-6">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={skin.socialIconClass}
                  title={s.platform}
                  onClick={() => {
                    try {
                      const body = JSON.stringify({ username: user?.username });
                      if (navigator.sendBeacon) navigator.sendBeacon('/api/track-social', new Blob([body], { type: 'application/json' }));
                    } catch {
                      // never block the tap
                    }
                  }}
                >
                  <SocialGlyph platform={s.platform} className="w-6 h-6" />
                </a>
              ))}
              {user?.showContactEmail && user?.contactEmail ? (
                <a
                  href={`mailto:${user.contactEmail}`}
                  className={skin.socialIconClass}
                  aria-label="Email"
                  title={user.contactEmail}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden>
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </a>
              ) : null}
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


          <div className="flex flex-col gap-3.5">
            {activeLinks.map((link: any) => (
              <div key={link.id} className="w-full">
              {!(link.kind === 'video' && videoEmbed(link.url)) && (
              <button
                type="button"
                onClick={() => {
                  trackAndOpen(link);
                }}
                className="block relative w-full text-center cursor-pointer"
              >
                {skin.assets.linkFrame ? (
                  <>
                    <img
                      src={skin.assets.linkFrame}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                    />
                    <span
                      className="relative z-10 grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 px-[clamp(1.9rem,12%,3.25rem)] py-4 font-bold"
                      style={{ color: skin.tokens.linkText }}
                    >
                      {link.LNKimg ? (<span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg" aria-hidden>
                        <img src={link.LNKimg} alt="" className="h-full w-full object-contain" />
                      </span>) : <span aria-hidden />}
                      <span className={linkTitleClass(link.title)}>{link.title}</span><span aria-hidden />
                    </span>
                  </>
                ) : (
                  <span className={`relative grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-3 py-4 pl-5 pr-5 ${skin.buttonClass} active:scale-[0.985] transition-all`}>
                    {link.LNKimg ? (<span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg" aria-hidden>
                        <img src={link.LNKimg} alt="" className="h-full w-full object-contain" />
                      </span>) : <span aria-hidden />}
                    <span className={linkTitleClass(link.title)}>{link.title}</span><span aria-hidden />
                  </span>
                )}
              </button>
              )}
              {link.kind === 'video' && videoEmbed(link.url) ? (
                <button type="button" onClick={() => trackAndOpen({ ...link, url: link.tapUrl || link.url })} aria-label={`Open ${link.title}`} className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-black text-left active:scale-[0.985] transition-all">
                  {(() => {
                    const embed = videoEmbed(link.url);
                    if (!embed) return <p className="p-4 text-center text-sm text-white">This video link cannot play here.</p>;
                    if (embed.kind === 'file') {
                      return <video src={embed.src} autoPlay muted loop playsInline className="pointer-events-none absolute inset-0 h-full w-full object-cover" />;
                    }
                    return (
                      <iframe
                        src={embed.src}
                        title={link.title}
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 border-0"
                        tabIndex={-1}
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    );
                  })()}
                </button>
              ) : null}
              </div>
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
              Building Opportunities One Profile at a Time
            </p>
            <a
              href="https://www.boopbase.com/login"
              className="mt-1 opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Boop login"
            >
              <img
                src={logoSrc}
                alt="Boop"
                className="h-8 w-auto max-w-[10rem] object-contain"
              />
            </a>
            <p className="mt-2 text-center text-[10px] opacity-45 m-0">
              <a
                href={`mailto:heyeasy@easydidit.com?subject=${encodeURIComponent(`Report BOOP profile: ${user?.username || ''}`)}`}
                className="hover:opacity-100 underline"
              >
                Report
              </a>
              {' · '}
              <Link href="/terms" className="hover:opacity-100 underline">Terms</Link>
              {' · '}
              <Link href="/privacy" className="hover:opacity-100 underline">Privacy</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}


function SkinMascotLayer({ mascot }: { mascot: NonNullable<ReturnType<typeof getSkinById>['assets']['mascot']> }) {
  const size = mascot.size ?? 72;
  const pos: Record<string, string> = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
    profile: '-bottom-1 -right-3',
  };
  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none absolute z-20 flex items-center justify-center ${pos[mascot.position] || pos['top-right']}`}
      style={{ width: size, height: size, fontSize: size * 0.7, lineHeight: 1 }}
    >
      {mascot.src ? <img src={mascot.src} alt="" className="h-full w-full object-contain" /> : mascot.emoji}
    </span>
  );
}
