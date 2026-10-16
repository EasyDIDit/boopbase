/**
 * Client-side photo prep for the dashboard: HEIC/HEIF -> JPEG (lazy heic2any),
 * then resize on a canvas and return a JPEG data URL.
 * Every failure path rejects with a user-facing message (no silent hangs).
 */

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif';

export const UNSUPPORTED_MESSAGE =
  "This photo couldn't be opened. Please pick a JPG or PNG (or take a screenshot of the photo and upload that).";

const DECODE_TIMEOUT_MS = 20000;

export class ImagePrepError extends Error {}

export function isHeic(file: { name?: string; type?: string }): boolean {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif' || type === 'image/heic-sequence' || type === 'image/heif-sequence') {
    return true;
  }
  return /\.(heic|heif)$/i.test(file.name || '');
}

/** Convert HEIC/HEIF to a JPEG blob. heic2any is loaded only when needed (browser-only, large). */
export async function heicToJpeg(file: Blob): Promise<Blob> {
  try {
    const { default: heic2any } = await import('heic2any');
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    return Array.isArray(out) ? out[0] : out;
  } catch {
    throw new ImagePrepError(
      "This iPhone photo (HEIC) couldn't be converted. Please pick a JPG or PNG, or take a screenshot of it and upload that.",
    );
  }
}

export function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function decodeToDataUrl(blob: Blob, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new ImagePrepError('That photo is taking too long to open. Please try a smaller JPG or PNG.'));
    }, DECODE_TIMEOUT_MS);
    function cleanup() {
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      URL.revokeObjectURL(url);
    }
    img.onload = () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) throw new Error('empty image');
        const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no canvas');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('encode failed');
        resolve(dataUrl);
      } catch {
        cleanup();
        reject(new ImagePrepError(UNSUPPORTED_MESSAGE));
      }
    };
    img.onerror = () => {
      cleanup();
      reject(new ImagePrepError(UNSUPPORTED_MESSAGE));
    };
    img.src = url;
  });
}

export async function prepareImage(file: File, maxWidth = 1200, maxHeight = 1200): Promise<string> {
  if (!file) throw new ImagePrepError('No photo selected.');
  const source = isHeic(file) ? await heicToJpeg(file) : file;
  try {
    return await decodeToDataUrl(source, maxWidth, maxHeight);
  } catch (err) {
    // Some browsers report HEIC with an empty/odd type; try converting once before giving up.
    if (source === file && !isHeic(file)) {
      try {
        const converted = await heicToJpeg(file);
        return await decodeToDataUrl(converted, maxWidth, maxHeight);
      } catch {
        /* fall through to original error */
      }
    }
    throw err instanceof ImagePrepError ? err : new ImagePrepError(UNSUPPORTED_MESSAGE);
  }
}
