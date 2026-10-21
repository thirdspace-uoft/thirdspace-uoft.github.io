import Link from "next/link";

import { MediaView, ResearchPlaceholder } from "@/components/research/research-media";
import { cn } from "@/lib/utils";
import type { ResearchTopic } from "@/lib/research";

/**
 * The research topics as cards: a visual and a title each.
 *
 * - `layout="grid"` (the /research index): a roomy grid — 3 columns on
 *   desktop, 2 on tablets, 1 on phones — with each topic's summary.
 * - `layout="row"` (topic pages): one compact line, six columns on desktop and
 *   a sideways-scrolling line below that, with the current topic marked, so it
 *   doubles as the topic switcher.
 */
export function ResearchTopicRow({
  topics,
  activeSlug,
  label,
  layout = "row",
}: {
  topics: ResearchTopic[];
  activeSlug?: string;
  label?: string;
  layout?: "grid" | "row";
}) {
  const grid = layout === "grid";
  return (
    <nav aria-label={label} className={grid ? undefined : "-mx-5 sm:-mx-8 lg:mx-0"}>
      <ul
        className={
          grid
            ? "grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
            : "scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:gap-4 sm:px-8 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0"
        }
      >
        {topics.map((topic) => {
          const active = topic.slug === activeSlug;
          return (
            <li key={topic.slug} className={grid ? undefined : "w-[42%] shrink-0 snap-start sm:w-[30%] lg:w-auto"}>
              <Link
                href={`/research/${topic.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-full flex-col overflow-hidden border bg-card shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  grid ? "rounded-2xl" : "rounded-xl",
                  active ? "border-primary ring-1 ring-primary/30" : "border-border/70",
                )}
              >
                <div
                  className={cn(
                    "relative w-full overflow-hidden border-b border-border/70 bg-muted/40",
                    grid ? "aspect-[16/10]" : "aspect-[4/3]",
                  )}
                >
                  {topic.cover?.path ? (
                    <MediaView
                      media={topic.cover}
                      sizes={grid ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px" : "(max-width: 1024px) 45vw, 190px"}
                    />
                  ) : (
                    <ResearchPlaceholder />
                  )}
                </div>
                {grid ? (
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <span className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                      {topic.title}
                    </span>
                    {topic.summary && (
                      <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.summary}</span>
                    )}
                  </div>
                ) : (
                  <span
                    className={cn(
                      "flex flex-1 items-start px-3 py-2.5 text-[13px] font-semibold leading-snug transition-colors group-hover:text-primary sm:text-sm",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {topic.title}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
