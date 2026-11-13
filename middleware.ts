import { NextResponse, type NextRequest } from "next/server";
import { isGonePath, isScannerPath } from "@/lib/gone-paths";
import { TempBan } from "@/lib/tempBan";

const gone = () =>
  new NextResponse("Gone", {
    status: 410,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

const banned = () =>
  new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });

// Per-instance memory (best effort). The Vercel Firewall stays the main scanner control.
const bans = new TempBan();

function ipOf(request: NextRequest) {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * WordPress / probe URLs return 410 in one request, including the trailing-slash twin.
 * Scanner paths (dotfiles, backups, dumps, probe targets) also count toward a temporary ban:
 * 5 scanner hits in 10 minutes => 403 on everything for 30 minutes from that IP.
 * Public profile slugs are not treated as gone. Requires skipTrailingSlashRedirect.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = ipOf(request);
  if (bans.isBanned(ip)) return banned();
  if (isScannerPath(pathname)) {
    bans.recordScannerHit(ip);
    return gone();
  }
  if (isGonePath(pathname)) return gone();
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const dest = new URL(request.url);
    dest.pathname = pathname.replace(/\/+$/, "") || "/";
    return NextResponse.redirect(dest, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Document routes (no file suffix). Static assets are not matched, so images/fonts never run middleware.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    // Probe files have a suffix, so they are matched explicitly.
    "/:path*\\.php",
    "/:path*\\.php/",
    "/.git",
    "/.git/:path*",
    // Dotfiles at any depth (/.env, /.aws/credentials, /x/.git/config), except /.well-known.
    "/((?!\\.well-known)\\.[^/]+.*)",
    "/(.*/\\..*)",
    // Backups, dumps, archives, keys, logs.
    "/(.*\\.(?:env|bak|backup|bkp|old|orig|save|swp|swo|tmp|sql|sqlite|db|dump|zip|tar|gz|tgz|rar|7z|log|ini|cfg|conf|pem|key|crt|p12|pfx))",
    "/(.*~)",
  ],
};
