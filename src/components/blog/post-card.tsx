import Link from "next/link";

import type { PostCardData } from "@/lib/blog";
import { cn } from "@/lib/utils";

/**
 * One post in a list. Pure markup with no data imports, so the client-side
 * tag filter can render it from plain props.
 *
 * `featured` is the large first post on /blog; `compact` drops the summary
 * for tight spaces (people dialogs, sidebars).
 */
export function PostCard({
  post,
  variant = "row",
  headingLevel = "h3",
  kindsSlot,
}: {
  post: PostCardData;
  variant?: "featured" | "row" | "compact";
  headingLevel?: "h2" | "h3";
  /** Small icons for the kinds of resources the post has (code, video…). */
  kindsSlot?: React.ReactNode;
}) {
  const Heading = headingLevel;
  const featured = variant === "featured";

  return (
    <article
      className={cn(
        "group relative",
        featured && post.cover && "grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-10",
      )}
    >
      {featured && post.cover && (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
        <img
          src={`${post.cover.url}?tr=w-1200,h-675,fo-auto`}
          alt={post.cover.alt}
          width={1200}
          height={675}
          fetchPriority="high"
          className="aspect-video w-full rounded-xl border border-border object-cover"
        />
      )}
      <div>
        <p className="text-sm text-muted-foreground">
          <time dateTime={post.dateTime}>{post.date}</time>
          {post.authors.length > 0 && <span> · {post.authors.join(", ")}</span>}
        </p>
        <Heading
          className={cn(
            "mt-1.5 font-bold tracking-tight text-foreground",
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
          )}
        >
          {/* The link covers the whole card, so the card is one tap target. */}
          <Link
            href={`/blog/${post.slug}`}
            className="rounded-sm transition-colors after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {post.title}
          </Link>
        </Heading>
        {variant !== "compact" && post.summary && (
          <p
            className={cn(
              "mt-2 leading-relaxed text-foreground/80",
              featured ? "text-base sm:text-lg" : "text-[0.95rem]",
            )}
          >
            {post.summary}
          </p>
        )}
        {kindsSlot && <div className="mt-3">{kindsSlot}</div>}
      </div>
    </article>
  );
}
