// lib/skins.ts
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

const classicRing = svgDataUrl(buildProfileRingSvg(FRAME_PRESETS.classic.ring));
const classicLink = svgDataUrl(buildLinkFrameSvg(FRAME_PRESETS.classic.link));
const jazzRing = svgDataUrl(buildProfileRingSvg(FRAME_PRESETS.jazz.ring));
const jazzLink = svgDataUrl(buildLinkFrameSvg(FRAME_PRESETS.jazz.link));
const nightRing = svgDataUrl(buildProfileRingSvg(FRAME_PRESETS.night.ring));
const nightLink = svgDataUrl(buildLinkFrameSvg(FRAME_PRESETS.night.link));

const SKIN_REGISTRY: Record<string, Partial<Skin>> = {
  'boop-classic': {
    id: 'boop-classic',
    name: 'Boop Classic',
    description: 'Bold 1930s BOOP baseline',
    isDefault: true,
    tokens: CLASSIC_TOKENS,
    assets: {
      preview: null,
      profileFrame: classicRing,
      linkFrame: classicLink,
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
    description: 'Sultry 1930s jazz club — gold chrome & black',
    isDefault: false,
    tokens: JAZZ_TOKENS,
    assets: {
      preview: null,
      profileFrame: jazzRing,
      linkFrame: jazzLink,
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
    description: 'Playful 1930s cartoon city at night — neon cyan',
    isDefault: false,
    tokens: NIGHT_TOKENS,
    assets: {
      preview: null,
      profileFrame: nightRing,
      linkFrame: nightLink,
      cover: '/skins/night-city/page-bg.svg',
      hero: '/skins/night-city/hero.svg',
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

export function getAllSkins(): Skin[] {
  const registeredIds = Object.keys(SKIN_REGISTRY);
  const registered = registeredIds.map((id) => getSkinById(id));
  const remaining = themes
    .filter((t) => !SKIN_REGISTRY[t.id])
    .map((t) => getSkinById(t.id));
  return [...registered, ...remaining];
}
