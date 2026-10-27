import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Everyone may crawl everything but /admin. The AI crawlers are named
 * explicitly so the intent is clear: the lab wants to be found and cited by
 * AI search (ChatGPT, Claude, Perplexity, Google AI Overviews, Apple, Bing).
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: "/admin" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
