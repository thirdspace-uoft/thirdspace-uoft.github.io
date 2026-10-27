"use client";

import { useState } from "react";

import { PostCard } from "@/components/blog/post-card";
import { ResourceKinds } from "@/components/blog/resource-kinds";
import type { PostCardData } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * /blog's post list with a tag filter. Without JavaScript every post still
 * renders (the filter only narrows), so crawlers see the full list.
 */
export function BlogIndex({
  posts,
  tags,
  labels,
}: {
  posts: PostCardData[];
  tags: { tag: string; count: number }[];
  labels: { allPosts: string; latest: string; tags: string };
}) {
  const [tag, setTag] = useState<string | null>(null);
  const [featured, ...rest] = posts;
  const filtered = tag ? posts.filter((p) => p.tags.includes(tag)) : rest;

  const chip = (label: string, active: boolean, onClick: () => void, count?: number) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-primary bg-primary text-primary-foreground font-semibold"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && <span className={active ? "opacity-80" : "opacity-60"}>{count}</span>}
    </button>
  );

  return (
    <div className="space-y-12">
      {!tag && featured && (
        <section aria-label={labels.latest} className="border-b border-border pb-12">
          <PostCard post={featured} variant="featured" headingLevel="h2" kindsSlot={<ResourceKinds kinds={featured.kinds} />} />
        </section>
      )}

      <section aria-label={labels.allPosts} className="space-y-8">
        {tags.length > 0 && (
          <div role="group" aria-label={labels.tags} className="flex flex-wrap gap-2">
            {chip(labels.allPosts, tag === null, () => setTag(null))}
            {tags.map((t) => chip(t.tag, tag === t.tag, () => setTag(tag === t.tag ? null : t.tag), t.count))}
          </div>
        )}
        <ul className="divide-y divide-border">
          {filtered.map((post) => (
            <li key={post.slug} className="py-6 first:pt-0">
              <PostCard post={post} headingLevel="h2" kindsSlot={<ResourceKinds kinds={post.kinds} />} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
