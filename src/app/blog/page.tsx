import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/blog/blog-index";
import { JsonLd } from "@/components/json-ld";
import { RichText } from "@/components/research/rich-text";
import { blogLd } from "@/lib/structured-data";
import { getAllTags, getBlog, getBlogLabels, getPosts, toCardData } from "@/lib/blog";

const blog = getBlog();

const shareCard = { url: "/blog/og.png", width: 1200, height: 630, alt: blog.page?.title ?? "Blog" };

export const metadata: Metadata = {
  title: blog.page?.metaTitle ?? blog.page?.title,
  description: blog.page?.metaDescription,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { type: "website", url: "/blog", title: blog.page?.metaTitle ?? blog.page?.title, description: blog.page?.metaDescription, images: [shareCard] },
  twitter: { card: "summary_large_image", images: [shareCard] },
};

export default function BlogPage() {
  // Turned off in the admin: the page does not exist (and the nav link is hidden).
  if (!blog.enabled) notFound();

  const labels = getBlogLabels();
  const posts = getPosts().map(toCardData);

  return (
    <main className="bg-background">
      <JsonLd data={blogLd(getPosts())} />
      <section data-section="blog" data-section-label={blog.navLabel}>
        <div className="mx-auto w-full max-w-5xl px-5 pt-12 sm:px-8 sm:pt-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {blog.page?.title ?? blog.navLabel}
            </h1>
            <RichText
              text={blog.page?.intro}
              className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
            />
          </div>
        </div>
        <div className="mx-auto mt-12 w-full max-w-5xl px-5 pb-16 sm:px-8 sm:pb-24">
          {posts.length === 0 ? (
            <p className="text-muted-foreground">{labels.noPosts}</p>
          ) : (
            <BlogIndex
              posts={posts}
              tags={getAllTags().map(({ tag, count }) => ({ tag, count }))}
              labels={{ allPosts: labels.allPosts, latest: labels.latest, tags: labels.tags }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
