/**
 * Shared procedural SVG frame kit for Boop skins.
 * One generator → profile rings + link plates from parameters (Art Bible §2).
 */

export type RingParams = {
  outerStroke?: string;
  outerWidth?: number;
  midStroke?: string;
  midWidth?: number;
  accentStroke?: string;
  accentWidth?: number;
  showAccentArc?: boolean;
  accentArcStroke?: string;
  size?: number;
};

export type LinkFrameParams = {
  fill?: string;
  outerStroke?: string;
  outerWidth?: number;
  insetStroke?: string;
  insetWidth?: number;
  radius?: number;
  width?: number;
  height?: number;
};

/** Profile ring as inline SVG string (transparent center). */
export function buildProfileRingSvg(p: RingParams = {}): string {
  const size = p.size ?? 160;
  const c = size / 2;
  const outerW = p.outerWidth ?? 10;
  const midW = p.midWidth ?? 5;
  const accentW = p.accentWidth ?? 2.5;
  const outerR = c - outerW / 2 - 2;
  const midR = outerR - outerW / 2 - midW / 2 - 2;
  const accentR = midR - midW / 2 - accentW / 2 - 2;
  const outer = p.outerStroke ?? '#000000';
  const mid = p.midStroke ?? '#FFFFFF';
  const accent = p.accentStroke ?? '#E72679';
  const arcStroke = p.accentArcStroke ?? '#FCCC82';
  const showArc = p.showAccentArc !== false;

  const arc = showArc
    ? `<path d="M${c * 0.55} ${c - outerR + 6} A${outerR - 4} ${outerR - 4} 0 0 1 ${c + outerR - 10} ${c}" stroke="${arcStroke}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none">
  <circle cx="${c}" cy="${c}" r="${outerR}" stroke="${outer}" stroke-width="${outerW}"/>
  <circle cx="${c}" cy="${c}" r="${midR}" stroke="${mid}" stroke-width="${midW}"/>
  <circle cx="${c}" cy="${c}" r="${accentR}" stroke="${accent}" stroke-width="${accentW}" opacity="0.95"/>
  ${arc}
</svg>`;
}

/** Link plate as inline SVG string (clear center for title). */
export function buildLinkFrameSvg(p: LinkFrameParams = {}): string {
  const w = p.width ?? 320;
  const h = p.height ?? 56;
  const r = p.radius ?? 12;
  const ow = p.outerWidth ?? 5;
  const iw = p.insetWidth ?? 2;
  const fill = p.fill ?? '#FFFFFF';
  const outer = p.outerStroke ?? '#000000';
  const inset = p.insetStroke ?? '#E72679';
  const pad = ow + 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">
  <rect x="${ow / 2}" y="${ow / 2}" width="${w - ow}" height="${h - ow}" rx="${r}" ry="${r}" fill="${fill}" stroke="${outer}" stroke-width="${ow}"/>
  <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="${Math.max(6, r - 4)}" ry="${Math.max(6, r - 4)}" stroke="${inset}" stroke-width="${iw}" fill="none"/>
</svg>`;
}

/** Data-URL helpers for runtime use without static files. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const FRAME_PRESETS = {
  classic: {
    ring: { outerStroke: '#000000', midStroke: '#FFFFFF', accentStroke: '#E72679', accentArcStroke: '#FCCC82' } as RingParams,
    link: { fill: '#FFFFFF', outerStroke: '#000000', insetStroke: '#E72679' } as LinkFrameParams,
  },
  jazz: {
    ring: {
      outerStroke: '#FFD700',
      outerWidth: 8,
      midStroke: '#1A1A1A',
      midWidth: 6,
      accentStroke: '#FFD700',
      accentWidth: 2,
      accentArcStroke: '#FFD700',
      showAccentArc: true,
    } as RingParams,
    link: {
      fill: '#1A1A1A',
      outerStroke: '#FFD700',
      outerWidth: 4,
      insetStroke: '#FFD700',
      insetWidth: 1.5,
      radius: 10,
    } as LinkFrameParams,
  },
  night: {
    ring: {
      outerStroke: '#00F0FF',
      outerWidth: 8,
      midStroke: '#0A1525',
      midWidth: 6,
      accentStroke: '#A8DADC',
      accentWidth: 2,
      accentArcStroke: '#00F0FF',
      showAccentArc: true,
    } as RingParams,
    link: {
      fill: '#0A1525',
      outerStroke: '#00F0FF',
      outerWidth: 4,
      insetStroke: '#A8DADC',
      insetWidth: 1.5,
      radius: 10,
    } as LinkFrameParams,
  },
} as const;
