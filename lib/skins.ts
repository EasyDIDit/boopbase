// lib/skins.ts
import { themes, getThemeById, type Theme } from './themes';

export interface SkinTokens {
  text: string;
  accent: string;
  pageBg: string;
  cardBg: string;
  linkText: string;
}

export interface SkinAssets {
  preview: string | null;
  profileFrame: string | null;
  linkFrame: string | null;
  cover: string | null;
  heroOverlay: string | null;
}

export interface SkinFlags {
  allowsCustomHeroImage: boolean;
  allowsCustomPageColor: boolean;
  allowsCustomCardColor: boolean;
}

export interface Skin {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  tokens: SkinTokens;
  assets: SkinAssets;
  flags: SkinFlags;
  buttonClass: string;
  addToContactsClass: string;
  socialIconClass: string;
  contentAreaClass?: string;
}

const CLASSIC_TOKENS: SkinTokens = {
  text: '#000000',
  accent: '#E72679',
  pageBg: '#C4CFDA',
  cardBg: '#ffffff',
  linkText: '#000000',
};

const JAZZ_TOKENS: SkinTokens = {
  text: '#FFFFFF',
  accent: '#FFD700',
  pageBg: '#0F0F0F',
  cardBg: '#1A1A1A',
  linkText: '#FFFFFF',
};

const NIGHT_TOKENS: SkinTokens = {
  text: '#FFFFFF',
  accent: '#00F0FF',
  pageBg: '#050A14',
  cardBg: '#0A1525',
  linkText: '#FFFFFF',
};

/** Registry of real skin packs. Add new packs here when assets are ready. */
const SKIN_REGISTRY: Record<string, Partial<Skin>> = {
  'boop-classic': {
    id: 'boop-classic',
    name: 'Boop Classic',
    description: 'Bold 1930s BOOP baseline',
    isDefault: true,
    tokens: CLASSIC_TOKENS,
    assets: {
      preview: null,
      profileFrame: '/skins/boop-classic/profile-frame.svg',
      linkFrame: '/skins/boop-classic/link-frame.svg',
      cover: null,
      heroOverlay: null,
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: true,
      allowsCustomCardColor: true,
    },
  },
  'jazz-night': {
    id: 'jazz-night',
    name: 'Jazz Night',
    description: 'Sultry 1930s jazz club — gold chrome & black',
    isDefault: false,
    tokens: JAZZ_TOKENS,
    assets: {
      preview: null,
      profileFrame: '/skins/jazz-night/profile-frame.svg',
      linkFrame: '/skins/jazz-night/link-frame.svg',
      cover: null,
      heroOverlay: null,
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: false,
    },
  },
  'night-city': {
    id: 'night-city',
    name: 'Night City',
    description: 'Playful 1930s cartoon city at night — neon cyan & chrome',
    isDefault: false,
    tokens: NIGHT_TOKENS,
    assets: {
      preview: null,
      profileFrame: '/skins/night-city/profile-frame.svg',
      linkFrame: '/skins/night-city/link-frame.svg',
      cover: null,
      heroOverlay: null,
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: false,
    },
  },
};

/**
 * Resolve a skin by id.
 * Always returns a complete Skin. Never throws. Classic is the hard fallback.
 */
export function getSkinById(id: string | null | undefined): Skin {
  const safeId = id || 'boop-classic';
  const pack = SKIN_REGISTRY[safeId];
  const theme: Theme = getThemeById(safeId);

  return {
    id: pack?.id || theme.id,
    name: pack?.name || theme.name,
    description: pack?.description || theme.description,
    isDefault: pack?.isDefault ?? theme.id === 'boop-classic',
    tokens: pack?.tokens || {
      text: theme['--text'],
      accent: theme['--primary'],
      pageBg: '#C4CFDA',
      cardBg: theme['--card-bg'],
      linkText: theme['--text'],
    },
    assets: pack?.assets || {
      preview: null,
      profileFrame: null,
      linkFrame: null,
      cover: null,
      heroOverlay: null,
    },
    flags: pack?.flags || {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: true,
      allowsCustomCardColor: true,
    },
    buttonClass: theme.buttonClass,
    addToContactsClass: theme.addToContactsClass,
    socialIconClass: theme.socialIconClass,
    contentAreaClass: theme.contentAreaClass,
  };
}

export function getAllSkins(): Skin[] {
  const registeredIds = Object.keys(SKIN_REGISTRY);
  const registered = registeredIds.map((id) => getSkinById(id));
  const remaining = themes
    .filter((t) => !SKIN_REGISTRY[t.id])
    .map((t) => getSkinById(t.id));
  return [...registered, ...remaining];
}
