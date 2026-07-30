/**
 * Curated social platform catalog for Boop.
 * Customers pick a platform + handle/URL; only configured ones show on the card.
 */

export type SocialPlatformId =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'snapchat'
  | 'pinterest'
  | 'threads'
  | 'discord'
  | 'twitch'
  | 'spotify'
  | 'github'
  | 'whatsapp'
  | 'telegram'
  | 'reddit'
  | 'behance'
  | 'website';

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  /** URL prefix when user enters a handle (not a full URL) */
  prefix: string;
  placeholder: string;
  /** Optional hint under the field */
  hint?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', prefix: 'https://instagram.com/', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', prefix: 'https://tiktok.com/@', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', prefix: 'https://youtube.com/@', placeholder: '@channel' },
  { id: 'facebook', name: 'Facebook', prefix: 'https://facebook.com/', placeholder: 'page or username' },
  { id: 'x', name: 'X (Twitter)', prefix: 'https://x.com/', placeholder: '@handle' },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'https://linkedin.com/in/', placeholder: 'profile-slug' },
  { id: 'snapchat', name: 'Snapchat', prefix: 'https://snapchat.com/add/', placeholder: 'username' },
  { id: 'pinterest', name: 'Pinterest', prefix: 'https://pinterest.com/', placeholder: 'username' },
  { id: 'threads', name: 'Threads', prefix: 'https://threads.net/@', placeholder: '@username' },
  { id: 'discord', name: 'Discord', prefix: 'https://discord.gg/', placeholder: 'invite code or URL' },
  { id: 'twitch', name: 'Twitch', prefix: 'https://twitch.tv/', placeholder: 'username' },
  { id: 'spotify', name: 'Spotify', prefix: 'https://open.spotify.com/user/', placeholder: 'user id or URL' },
  { id: 'github', name: 'GitHub', prefix: 'https://github.com/', placeholder: 'username' },
  { id: 'whatsapp', name: 'WhatsApp', prefix: 'https://wa.me/', placeholder: 'phone with country code' },
  { id: 'telegram', name: 'Telegram', prefix: 'https://t.me/', placeholder: 'username' },
  { id: 'reddit', name: 'Reddit', prefix: 'https://reddit.com/u/', placeholder: 'username' },
  { id: 'behance', name: 'Behance', prefix: 'https://behance.net/', placeholder: 'username' },
  { id: 'website', name: 'Website', prefix: 'https://', placeholder: 'yoursite.com' },
];

export type SocialEntry = {
  id: string;
  platform: SocialPlatformId;
  url: string;
};

export function getPlatform(id: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

/** Build a full URL from handle or URL input. */
export function buildSocialUrl(platformId: SocialPlatformId, raw: string): string {
  let value = raw.trim();
  if (!value) return '';
  const platform = getPlatform(platformId);
  if (!platform) return value;

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith('@')) value = value.slice(1);
  value = value.replace(/^\/+/, '');

  // website: ensure https
  if (platformId === 'website') {
    return value.startsWith('http') ? value : `https://${value}`;
  }

  return platform.prefix + value;
}

/** Migrate legacy flat fields → socials[] */
export function legacySocialsToEntries(user: {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  socials?: SocialEntry[];
}): SocialEntry[] {
  if (Array.isArray(user.socials) && user.socials.length > 0) {
    return user.socials.filter((s) => s && s.platform && s.url);
  }
  const out: SocialEntry[] = [];
  const pairs: [SocialPlatformId, string | undefined][] = [
    ['instagram', user.instagram],
    ['tiktok', user.tiktok],
    ['youtube', user.youtube],
    ['facebook', user.facebook],
  ];
  for (const [platform, url] of pairs) {
    if (url && String(url).trim()) {
      out.push({ id: `legacy-${platform}`, platform, url: String(url).trim() });
    }
  }
  return out;
}
