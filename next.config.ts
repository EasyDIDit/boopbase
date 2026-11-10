import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // Only the homepage goes to the Boop shop; profiles (/name) and the editor stay here.
  async redirects() {
    return [{ source: "/", destination: "https://easydidit.com/boop", permanent: false }];
  },
};

export default nextConfig;
