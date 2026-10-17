/** Where "Get a Boop" sends people. Config-driven: set BOOP_SHOP_URL (http/https only); falls back to the store's Boop page. */
export const DEFAULT_BOOP_SHOP_URL = 'https://easy-did-it-platform.vercel.app/boop';

export function boopShopUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.BOOP_SHOP_URL?.trim();
  if (!raw) return DEFAULT_BOOP_SHOP_URL;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : DEFAULT_BOOP_SHOP_URL;
  } catch {
    return DEFAULT_BOOP_SHOP_URL;
  }
}
