/**
 * Leftover WordPress / date-permalink / probe URLs. Do not treat public profile
 * usernames as gone — those live at /[username].
 */

const ALLOWED_EXACT = new Set([
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/admin",
  "/mint",
  "/robots.txt",
  "/favicon.ico",
]);

const ALLOWED_PREFIXES = [
  "/api/",
  "/_next/",
  "/login/",
  "/register/",
  "/dashboard/",
  "/admin/",
  "/mint/",
  "/owner/",
  "/claim/",
  "/p/",
];

export function normalizePath(pathname: string): string {
  let path = pathname.split("?")[0] || "/";
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

export function isAllowedPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (ALLOWED_EXACT.has(path) || path === "/owner") return true;
  return ALLOWED_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix));
}

/** Backup, dump, archive and editor-leftover endings that probes look for. */
const SCANNER_EXT = /\.(env|bak|backup|bkp|old|orig|save|swp|swo|tmp|sql|sqlite|db|dump|zip|tar|gz|tgz|rar|7z|log|ini|cfg|conf|pem|key|crt|p12|pfx|htpasswd|htaccess|ds_store)$/;
/** Well-known probe targets (no BOOPbase route uses these names). */
const SCANNER_PREFIXES = ['/phpmyadmin', '/pma', '/cgi-bin', '/server-status', '/vendor/phpunit', '/actuator', '/owa/', '/boaform', '/hnap1', '/solr/', '/console/', '/manager/html'];

/**
 * Scanner traffic: dotfiles anywhere in the path (/.env, /.git/config, /x/.aws/credentials),
 * backup/dump/archive files, editor leftovers (file~), and well-known probe targets.
 * /.well-known stays allowed (app links, TLS checks). Used for 410 + the temporary ban.
 */
export function isScannerPath(pathname: string): boolean {
  const path = normalizePath(pathname).toLowerCase();
  if (path === '/.well-known' || path.startsWith('/.well-known/')) return false;
  if (path.startsWith('/_next/')) return false;
  if (/(^|\/)\.[^/]/.test(path)) return true;
  if (path.endsWith('~')) return true;
  if (SCANNER_EXT.test(path)) return true;
  if (path.endsWith('.php') || path.includes('.php/')) return true;
  if (path.startsWith('/wp-') || path.startsWith('/wordpress') || path.startsWith('/xmlrpc')) return true;
  return SCANNER_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p.endsWith('/') ? p : `${p}/`) || path === p);
}

export function isGonePath(pathname: string): boolean {
  if (isScannerPath(pathname)) return true;
  if (isAllowedPath(pathname)) return false;
  const path = normalizePath(pathname).toLowerCase();
  if (path.endsWith(".php") || path.includes(".php/")) return true;
  if (path.startsWith("/wp-") || path.startsWith("/wordpress")) return true;
  if (path === "/xmlrpc" || path.startsWith("/xmlrpc.php")) return true;
  if (path === "/my-account" || path.startsWith("/my-account/")) return true;
  if (path === "/product-category" || path.startsWith("/product-category/")) return true;
  if (path === "/feed" || path.startsWith("/feed/")) return true;
  if (path.startsWith("/category/") || path.startsWith("/tag/") || path.startsWith("/author/")) return true;
  if (path === "/.git" || path.startsWith("/.git/")) return true;
  if (/^\/20\d{2}\/\d{2}\/\d{2}(\/|$)/.test(path)) return true;
  return false;
}
