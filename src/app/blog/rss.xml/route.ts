import { rss } from "@/lib/feeds";

// Written to out/blog/rss.xml at build. Also what Buffer, Zapier or Make can
// watch if the lab ever prefers them to the share workflow.
export const dynamic = "force-static";

export function GET() {
  return new Response(rss(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
