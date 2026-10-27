import { getBlog } from "@/lib/blog";
import { getContent } from "@/lib/content";
import { feedPosts } from "@/lib/feeds";
import { getResearch, getTopics } from "@/lib/research";
import { absoluteUrl } from "@/lib/site";

// /llms.txt (llmstxt.org): a Markdown map of the site for AI tools. Uptake is
// uneven, so it's a cheap extra rather than the plan; the sitemap and
// structured data do the real work.
export const dynamic = "force-static";

export function GET() {
  const { brand, layout, team } = getContent();
  const research = getResearch();
  const blog = getBlog();
  const lines = [
    `# ${brand?.name ?? "ThirdSpace"}`,
    "",
    `> ${brand?.footerDescription ?? layout?.pageDescription ?? ""}`,
    "",
    "## Pages",
    "",
    research.enabled ? `- [Research](${absoluteUrl("/research")}): ${research.page?.metaDescription ?? "Research areas."}` : "",
    `- [People](${absoluteUrl("/people")}): ${team?.pageBody ?? "Lab members."}`,
    `- [Publications](${absoluteUrl("/publications")}): Papers, book chapters and research artifacts.`,
    `- [News](${absoluteUrl("/news")}): Awards, talks and press.`,
    blog.enabled ? `- [Blog](${absoluteUrl("/blog")}): ${blog.page?.metaDescription ?? "Research notes."}` : "",
    "",
  ];
  if (research.enabled && getTopics().length) {
    lines.push("## Research topics", "");
    for (const t of getTopics()) lines.push(`- [${t.title}](${absoluteUrl(`/research/${t.slug}`)}): ${t.summary ?? ""}`.trimEnd());
    lines.push("");
  }
  const posts = feedPosts();
  if (posts.length) {
    lines.push("## Blog posts", "");
    // Each post also exists as plain Markdown at <url>/index.md.
    for (const p of posts) lines.push(`- [${p.title}](${absoluteUrl(`/blog/${p.slug}/index.md`)}): ${p.summary}`);
    lines.push("");
  }
  return new Response(lines.filter((l, i, all) => l !== "" || all[i - 1] !== "").join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
