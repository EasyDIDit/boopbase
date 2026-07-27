// lib/skins.ts — curated catalog only. Customers pick; owner ships packs.
import { themes, getThemeById, type Theme } from './themes';
import { buildProfileRingSvg, buildLinkFrameSvg, svgDataUrl, FRAME_PRESETS } from './skinFrames';

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
  hero: string | null;
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

function frames(preset: keyof typeof FRAME_PRESETS) {
  const p = FRAME_PRESETS[preset];
  return {
    profileFrame: svgDataUrl(buildProfileRingSvg(p.ring)),
    linkFrame: svgDataUrl(buildLinkFrameSvg(p.link)),
  };
}

/**
 * OWNER CATALOG — only packs listed here appear in Design.
 * To add a skin: (1) FRAME_PRESETS entry (2) optional SVG cover/hero (3) register here.
 */
const SKIN_REGISTRY: Record<string, Partial<Skin>> = {
  'boop-classic': {
    id: 'boop-classic',
    name: 'Boop Classic',
    description: 'Bold 1930s BOOP baseline — pink & grey',
    isDefault: true,
    tokens: {
      text: '#000000',
      accent: '#E72679',
      pageBg: '#C4CFDA',
      cardBg: '#ffffff',
      linkText: '#000000',
    },
    assets: {
      preview: null,
      ...frames('classic'),
      cover: null,
      hero: null,
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
    description: 'Sultry club — gold chrome & black',
    isDefault: false,
    tokens: {
      text: '#FFFFFF',
      accent: '#FFD700',
      pageBg: '#0F0F0F',
      cardBg: '#1A1A1A',
      linkText: '#FFFFFF',
    },
    assets: {
      preview: null,
      ...frames('jazz'),
      cover: '/skins/jazz-night/page-bg.svg',
      hero: '/skins/jazz-night/hero.svg',
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
    description: 'Cartoon skyline — neon cyan',
    isDefault: false,
    tokens: {
      text: '#FFFFFF',
      accent: '#00F0FF',
      pageBg: '#050A14',
      cardBg: '#0A1525',
      linkText: '#FFFFFF',
    },
    assets: {
      preview: null,
      ...frames('night'),
      cover: '/skins/night-city/page-bg.svg',
      hero: '/skins/night-city/hero.svg',
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: false,
    },
  },
  'pink-cabaret': {
    id: 'pink-cabaret',
    name: 'Pink Cabaret',
    description: 'Stage lights & blush — feminine punch',
    isDefault: false,
    tokens: {
      text: '#18152E',
      accent: '#E72679',
      pageBg: '#2A1220',
      cardBg: '#FFF0F5',
      linkText: '#18152E',
    },
    assets: {
      preview: null,
      ...frames('cabaret'),
      cover: '/skins/pink-cabaret/page-bg.svg',
      hero: '/skins/pink-cabaret/hero.svg',
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: false,
    },
  },
  'soda-sky': {
    id: 'soda-sky',
    name: 'Soda Sky',
    description: 'Bright blue pop — clean daytime',
    isDefault: false,
    tokens: {
      text: '#18152E',
      accent: '#3EBEEF',
      pageBg: '#B8E4F5',
      cardBg: '#FFFFFF',
      linkText: '#18152E',
    },
    assets: {
      preview: null,
      ...frames('soda'),
      cover: '/skins/soda-sky/page-bg.svg',
      hero: '/skins/soda-sky/hero.svg',
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: true,
    },
  },
  'butter-cream': {
    id: 'butter-cream',
    name: 'Butter Cream',
    description: 'Warm yellow cream — soft vintage',
    isDefault: false,
    tokens: {
      text: '#18152E',
      accent: '#E8A84A',
      pageBg: '#F5E6C8',
      cardBg: '#FFF8E7',
      linkText: '#18152E',
    },
    assets: {
      preview: null,
      ...frames('butter'),
      cover: '/skins/butter-cream/page-bg.svg',
      hero: '/skins/butter-cream/hero.svg',
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: true,
    },
  },
  'ink-noir': {
    id: 'ink-noir',
    name: 'Ink Noir',
    description: 'High-contrast black & white with pink spark',
    isDefault: false,
    tokens: {
      text: '#FFFFFF',
      accent: '#E72679',
      pageBg: '#0A0A0A',
      cardBg: '#111111',
      linkText: '#FFFFFF',
    },
    assets: {
      preview: null,
      ...frames('noir'),
      cover: '/skins/ink-noir/page-bg.svg',
      hero: '/skins/ink-noir/hero.svg',
    },
    flags: {
      allowsCustomHeroImage: true,
      allowsCustomPageColor: false,
      allowsCustomCardColor: false,
    },
  },
};

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
      hero: null,
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

/** Customer-facing catalog — only curated full packs. */
export function getAllSkins(): Skin[] {
  return Object.keys(SKIN_REGISTRY).map((id) => getSkinById(id));
}
