/** Curated profile fonts. Customers pick one. Skins stay in charge of color. */
export const PROFILE_FONTS = [
  { id: 'boop', name: 'Boop', family: 'var(--font-geist-sans), system-ui, sans-serif' },
  { id: 'clean', name: 'Clean', family: 'var(--font-outfit), system-ui, sans-serif' },
  { id: 'classic', name: 'Classic', family: 'var(--font-fraunces), Georgia, serif' },
  { id: 'marker', name: 'Marker', family: 'var(--font-caveat), cursive' },
  { id: 'condensed', name: 'Condensed', family: 'var(--font-oswald), system-ui, sans-serif' },
] as const;

export type ProfileFontId = (typeof PROFILE_FONTS)[number]['id'];

export function getProfileFont(id?: string | null) {
  return PROFILE_FONTS.find((f) => f.id === id) || PROFILE_FONTS[0];
}
