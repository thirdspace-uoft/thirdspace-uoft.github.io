import { getPost, getPosts } from "@/lib/blog";
import { postMarkdown } from "@/lib/feeds";

// /blog/<slug>/index.md: the post as plain Markdown, linked from the page
// with <link rel="alternate" type="text/markdown">.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = getPosts().map((p) => ({ slug: p.slug }));
  return slugs.length > 0 ? slugs : [{ slug: "_" }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return new Response(post ? postMarkdown(post) : "", { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
