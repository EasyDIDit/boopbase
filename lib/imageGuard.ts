/**
 * Server-side checks for photos saved from the editor (stored as data URLs on the profile).
 * - Size limits per slot.
 * - Only JPEG / PNG / WebP data URLs (SVG allowed for small link icons only), or our own site paths.
 * - Raster images are re-encoded with sharp, which drops EXIF/GPS (location) and other metadata.
 *   Orientation is applied first so photos don't turn sideways.
 * A value identical to what is already saved is accepted untouched (so older profiles keep saving).
 */
export type ImageSlot = 'profileImage' | 'backgroundImage' | 'LNKimg';

export const IMAGE_LIMITS: Record<ImageSlot, number> = {
  profileImage: 1_000_000, // editor sends ~400x400 JPEG (tens of KB)
  backgroundImage: 2_500_000, // editor sends up to 1200x1200 JPEG
  LNKimg: 300_000, // editor sends 128x128 PNG
};

const SITE_PATHS = ['/uploads/', '/skins/', '/brand/', '/mascots/'];
const RASTER = ['image/jpeg', 'image/png', 'image/webp'] as const;
type Raster = (typeof RASTER)[number];

export type ImageCheck = { ok: true; value: string } | { ok: false; error: string };

export function parseDataUrl(value: string): { mime: string; bytes: Buffer } | null {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!m) return null;
  return { mime: m[1].toLowerCase(), bytes: Buffer.from(m[2], 'base64') };
}

const MAX_B64 = (bytes: number) => Math.ceil(bytes / 3) * 4 + 64;

async function reencode(bytes: Buffer, mime: Raster): Promise<Buffer> {
  const { default: sharp } = await import('sharp');
  const img = sharp(bytes, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
  if (mime === 'image/png') return img.png().toBuffer();
  if (mime === 'image/webp') return img.webp({ quality: 85 }).toBuffer();
  return img.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
}

export async function cleanImageValue(slot: ImageSlot, raw: unknown, current: unknown): Promise<ImageCheck> {
  if (raw === null || raw === undefined || raw === '') return { ok: true, value: '' };
  if (typeof raw !== 'string') return { ok: false, error: 'That image could not be saved.' };
  if (typeof current === 'string' && current !== '' && raw === current) return { ok: true, value: raw };
  if (SITE_PATHS.some((p) => raw.startsWith(p)) && /^\/[A-Za-z0-9._\-/]+$/.test(raw) && !raw.includes('..')) {
    return { ok: true, value: raw };
  }
  const limit = IMAGE_LIMITS[slot];
  if (raw.length > MAX_B64(limit)) return { ok: false, error: `That image is too big (max ${Math.round(limit / 1000)} KB). Try a smaller photo.` };
  const parsed = parseDataUrl(raw);
  if (!parsed) return { ok: false, error: 'Images must be a JPG, PNG or WebP photo.' };
  if (parsed.bytes.length > limit) return { ok: false, error: `That image is too big (max ${Math.round(limit / 1000)} KB). Try a smaller photo.` };
  if (parsed.mime === 'image/svg+xml') {
    // Small link icons only; shown via <img>, where SVG scripts never run.
    return slot === 'LNKimg' ? { ok: true, value: raw } : { ok: false, error: 'Images must be a JPG, PNG or WebP photo.' };
  }
  if (!RASTER.includes(parsed.mime as Raster)) return { ok: false, error: 'Images must be a JPG, PNG or WebP photo.' };
  try {
    const out = await reencode(parsed.bytes, parsed.mime as Raster);
    if (out.length > limit) return { ok: false, error: `That image is too big (max ${Math.round(limit / 1000)} KB). Try a smaller photo.` };
    return { ok: true, value: `data:${parsed.mime};base64,${out.toString('base64')}` };
  } catch {
    return { ok: false, error: "That photo couldn't be read. Please pick a JPG or PNG." };
  }
}
