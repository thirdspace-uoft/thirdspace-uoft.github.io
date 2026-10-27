import { getBlog, getPosts, resolveAuthors, type Post } from "@/lib/blog";
import { getContent } from "@/lib/content";
import { absoluteUrl, shareImageUrl, SITE_URL } from "@/lib/site";
import { getImageUrl } from "@/lib/utils";

/** Escape text for XML. Next's sitemap writer doesn't, so this is used there too. */
export function xml(text: string | undefined | null): string {
  return (text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Posts shown in feeds: none while the blog is switched off. */
export function feedPosts(): Post[] {
  return getBlog().enabled ? getPosts() : [];
}

export const postUrl = (post: Post) => absoluteUrl(`/blog/${post.slug}`);

export function rss(): string {
  const blog = getBlog();
  const { brand } = getContent();
  const posts = feedPosts();
  const self = absoluteUrl("/blog/rss.xml");
  const items = posts.map((post) => {
    const authors = resolveAuthors(post).map((a) => a.name);
    const cover = post.cover?.path ? shareImageUrl(getImageUrl(post.cover.path)) : undefined;
    return [
      "    <item>",
      `      <title>${xml(post.title)}</title>`,
      `      <link>${postUrl(post)}</link>`,
      `      <guid isPermaLink="true">${postUrl(post)}</guid>`,
      post.publishedAt ? `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : "",
      `      <description>${xml(post.summary)}</description>`,
      ...authors.map((a) => `      <dc:creator>${xml(a)}</dc:creator>`),
      ...(post.tags ?? []).map((t) => `      <category>${xml(t)}</category>`),
      // RSS requires a length; the real size isn't known at build, and 0 is the accepted placeholder.
      cover ? `      <enclosure url="${xml(cover)}" length="0" type="image/jpeg" />` : "",
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xml(blog.page?.metaTitle ?? `${brand?.name ?? "ThirdSpace"} blog`)}</title>`,
    `    <link>${absoluteUrl("/blog")}</link>`,
    `    <description>${xml(blog.page?.metaDescription ?? blog.page?.intro ?? "")}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${self}" rel="self" type="application/rss+xml" />`,
    posts[0] ? `    <lastBuildDate>${new Date(posts[0].updatedAt).toUTCString()}</lastBuildDate>` : "",
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** JSON Feed 1.1 (jsonfeed.org). */
export function jsonFeed() {
  const blog = getBlog();
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: blog.page?.metaTitle ?? "ThirdSpace blog",
    home_page_url: absoluteUrl("/blog"),
    feed_url: absoluteUrl("/blog/feed.json"),
    description: blog.page?.metaDescription,
    language: "en",
    items: feedPosts().map((post) => ({
      id: postUrl(post),
      url: postUrl(post),
      title: post.title,
      summary: post.summary,
      content_text: post.body,
      image: post.cover?.path ? shareImageUrl(getImageUrl(post.cover.path)) : undefined,
      date_published: post.publishedAt,
      date_modified: post.updatedAt,
      authors: resolveAuthors(post).map((a) => ({ name: a.name, url: a.href && (a.isMember ? absoluteUrl(a.href) : a.href) })),
      tags: post.tags,
    })),
  };
}

/** A post as plain Markdown: what AI tools that prefer text over HTML can read. */
export function postMarkdown(post: Post): string {
  const authors = resolveAuthors(post).map((a) => (a.title ? `${a.name} (${a.title})` : a.name));
  const lines = [
    `# ${post.title}`,
    "",
    `> ${post.summary}`,
    "",
    [authors.join(", "), post.publishedAt?.slice(0, 10), postUrl(post)].filter(Boolean).join(" · "),
    "",
  ];
  if ((post.keyFindings ?? []).filter(Boolean).length) {
    lines.push("## Key findings", "", ...(post.keyFindings ?? []).filter(Boolean).map((f) => `- ${f}`), "");
  }
  // Site-relative links and images would mean nothing once the text is copied elsewhere.
  lines.push(post.body.trim().replace(/\]\(\/(?!\/)/g, `](${SITE_URL}/`), "");
  if ((post.resources ?? []).length) {
    lines.push("## Paper, code and videos", "");
    for (const r of post.resources ?? []) {
      lines.push(`- ${r.kind}: [${r.title || r.url}](${r.doi ? `https://doi.org/${r.doi}` : r.url})${r.description ? ` — ${r.description}` : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
