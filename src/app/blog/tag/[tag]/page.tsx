import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/blog/post-card";
import { ResourceKinds } from "@/components/blog/resource-kinds";
import { fill, getBlog, getBlogLabels, getPostsByTag, getTagPages, toCardData } from "@/lib/blog";

/** Static export: only tags that exist at build time get a page. */
export const dynamicParams = false;

/** Placeholder param when no tag has a page — an empty list fails `output: "export"`. */
const NO_TAGS = "_";

/** Only tags with at least two posts: a one-post tag page is thin content for search engines. */
export function generateStaticParams() {
  const tags = getTagPages().map((t) => ({ tag: t.slug }));
  return tags.length > 0 ? tags : [{ tag: NO_TAGS }];
}

type Props = { params: Promise<{ tag: string }> };

function findTag(slug: string) {
  return getTagPages().find((t) => t.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = findTag(slug);
  if (!tag) return {};
  const blog = getBlog();
  const title = fill(getBlogLabels().taggedWith, { tag: tag.tag });
  return {
    title: [title, blog.page?.metaTitle].filter(Boolean).join(" — "),
    description: `${tag.count} posts about ${tag.tag} from the ThirdSpace blog.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag: slug } = await params;
  const blog = getBlog();
  const tag = findTag(slug);
  if (!blog.enabled || !tag) notFound();

  const labels = getBlogLabels();
  const posts = getPostsByTag(tag.slug).map(toCardData);

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-5xl px-5 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
        <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
          ← {blog.page?.title ?? blog.navLabel}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {fill(labels.taggedWith, { tag: tag.tag })}
        </h1>
        <ul className="mt-10 divide-y divide-border">
          {posts.map((post) => (
            <li key={post.slug} className="py-6 first:pt-0">
              <PostCard post={post} headingLevel="h2" kindsSlot={<ResourceKinds kinds={post.kinds} />} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
