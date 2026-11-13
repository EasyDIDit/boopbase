import type { NextConfig } from "next";

/**
 * Security headers. Same approach as the easydidit.com platform:
 * the enforced CSP only carries directives that cannot break the site (no framing by other sites,
 * no <base>/<object> tricks, forms post only here). The full CSP ships as Report-Only first, so
 * profile photos (data:), YouTube/Vimeo link videos, direct video files, the Vercel preview toolbar
 * and future GIFs (GIPHY over https) keep working while reports are reviewed.
 */
const CSP_ENFORCED = ["frame-ancestors 'self'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"].join("; ");

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vercel.live",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vercel.live",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // No includeSubDomains/preload: only this host is pinned to HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera/mic/location/payment off. Web NFC (card writing), clipboard and share are left alone.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: CSP_ENFORCED },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  // Only the homepage goes to the Boop shop; profiles (/name) and the editor stay here.
  async redirects() {
    return [{ source: "/", destination: "https://easydidit.com/boop", permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [...noIndex, { key: "Cache-Control", value: "no-store" }] },
      ...["/dashboard", "/admin", "/owner", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/claim"].flatMap((p) => [
        { source: p, headers: noIndex },
        { source: `${p}/:path*`, headers: noIndex },
      ]),
    ];
  },
};

export default nextConfig;
