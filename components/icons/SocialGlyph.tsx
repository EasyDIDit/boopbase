'use client';

import { SVGProps } from 'react';
import type { SocialPlatformId } from '@/lib/socialPlatforms';
import {
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  FacebookIcon,
  TwitterIcon,
  LinkIcon,
} from '@/components/icons';

/** Maps platform id → icon. Unknown platforms use LinkIcon. */
export function SocialGlyph({
  platform,
  className,
  ...props
}: { platform: SocialPlatformId | string; className?: string } & SVGProps<SVGSVGElement>) {
  const cls = className || 'w-6 h-6';
  switch (platform) {
    case 'instagram':
      return <InstagramIcon className={cls} {...props} />;
    case 'tiktok':
      return <TikTokIcon className={cls} {...props} />;
    case 'youtube':
      return <YouTubeIcon className={cls} {...props} />;
    case 'facebook':
      return <FacebookIcon className={cls} {...props} />;
    case 'x':
      return <TwitterIcon className={cls} {...props} />;
    case 'cashapp':
    case 'venmo':
    case 'paypal':
      return <PayGlyph letter={platform === 'cashapp' ? '$' : platform === 'venmo' ? 'V' : 'P'} className={cls} {...props} />;
    default:
      return <LinkIcon className={cls} {...props} />;
  }
}

/** Get-paid handles: a simple letter badge (no third-party logo files). */
function PayGlyph({ letter, className, ...props }: { letter: string; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...props}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.18" />
      <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="800" fontFamily="Arial, sans-serif" fill="currentColor">{letter}</text>
    </svg>
  );
}
