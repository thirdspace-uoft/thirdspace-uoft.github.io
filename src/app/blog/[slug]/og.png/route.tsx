import { formatPostDate, getPost, getPosts, resolveAuthors } from "@/lib/blog";
import { renderShareCard } from "@/lib/og-card";

// /blog/<slug>/og.png: the post's share card, generated once at build.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = getPosts().map((p) => ({ slug: p.slug }));
  // Placeholder so an empty blog still exports (same as the post route).
  return slugs.length > 0 ? slugs : [{ slug: "_" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return renderShareCard({ title: "Blog", eyebrow: "University of Toronto" });
  const authors = resolveAuthors(post).map((a) => a.name);
  const byline = authors.length > 2 ? `${authors[0]} and ${authors.length - 1} others` : authors.join(" and ");
  return renderShareCard({
    title: post.title,
    eyebrow: "Research blog · University of Toronto",
    footer: [byline, formatPostDate(post.publishedAt)].filter(Boolean).join(" · "),
  });
}
