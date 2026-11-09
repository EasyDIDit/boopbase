export type MascotStyle = '3d' | 'drawn';
export type MascotPose = '1-pointing' | '2-phone-card' | '3-waving' | '4-thumbs-up' | '5-peeking';

export function mascotStyle(search: string, previewAllowed: boolean): MascotStyle {
  return previewAllowed && new URLSearchParams(search).get('mascot') === 'drawn' ? 'drawn' : '3d';
}

export function mascotSrc(style: MascotStyle, pose: MascotPose): string {
  return `/mascots/poses/panther-${style}-${pose}.webp`;
}

export function allowMascotPreview(vercelEnv: string | undefined, nodeEnv: string | undefined): boolean {
  return vercelEnv !== 'production' && (vercelEnv === 'preview' || nodeEnv === 'development');
}
