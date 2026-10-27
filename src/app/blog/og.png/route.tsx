import { getBlog } from "@/lib/blog";
import { renderShareCard } from "@/lib/og-card";

// /blog/og.png: the share card for the blog's front page.
export const dynamic = "force-static";

export async function GET() {
  const blog = getBlog();
  return renderShareCard({
    title: blog.page?.title ?? "Blog",
    eyebrow: "Research blog · University of Toronto",
    footer: blog.page?.metaDescription,
  });
}
