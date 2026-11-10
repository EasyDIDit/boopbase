import type { MetadataRoute } from "next";

const PRIVATE = ["/api/", "/dashboard", "/admin", "/owner", "/login", "/register", "/mint", "/claim", "/p/"];

const SEO_CRAWLERS = [
  "AhrefsBot",
  "AhrefsSiteAudit",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "Bytespider",
  "DataForSeoBot",
  "BLEXBot",
  "SeekportBot",
  "ZoominfoBot",
  "MegaIndex",
  "BUbiNG",
  "Scrapy",
];

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "meta-externalagent",
  "FacebookBot",
  "Applebot-Extended",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "YouBot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: SEO_CRAWLERS, disallow: "/" },
      { userAgent: AI_BOTS, disallow: "/" },
    ],
    host: "https://www.boopbase.com",
  };
}
