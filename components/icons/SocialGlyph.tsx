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
    default:
      return <LinkIcon className={cls} {...props} />;
  }
}
