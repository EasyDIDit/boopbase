import { NextResponse, type NextRequest } from "next/server";
import { isGonePath } from "@/lib/gone-paths";

const gone = () =>
  new NextResponse("Gone", {
    status: 410,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });

/**
 * WordPress / probe URLs return 410 in one request, including the trailing-slash twin.
 * Public profile slugs are not treated as gone. Requires skipTrailingSlashRedirect.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/:path*\\.php",
    "/:path*\\.php/",
    "/.git",
    "/.git/:path*",
  ],
};
