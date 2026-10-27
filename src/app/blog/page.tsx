import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex } from "@/components/blog/blog-index";
import { RichText } from "@/components/research/rich-text";
import { getAllTags, getBlog, getBlogLabels, getPosts, toCardData } from "@/lib/blog";

const blog = getBlog();

export const metadata: Metadata = {
  title: blog.page?.metaTitle ?? blog.page?.title,
  description: blog.page?.metaDescription,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  // Turned off in the admin: the page does not exist (and the nav link is hidden).
  if (!blog.enabled) notFound();

  const labels = getBlogLabels();
  const posts = getPosts().map(toCardData);

  return (
    <main className="bg-background">
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
