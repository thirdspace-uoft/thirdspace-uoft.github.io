"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn, getAssetPath, getImageUrl } from "@/lib/utils";
import { formatNewsMonth, type NewsItem } from "@/lib/news";

type NewsListProps = {
  items: NewsItem[];
  placeholderImagePath?: string;
  openLinkLabel?: string;
};

/** Same chip as a publication's award on the home page, so awards read the same everywhere. */
function HighlightChip({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/8 px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
      <svg viewBox="0 0 24 24" className="size-2.5 fill-accent" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {label}
    </span>
  );
}

function isExternal(url: string) {
  return !url.startsWith("/");
}

function NewsDetail({
  item,
  placeholderImagePath,
  openLinkLabel,
}: {
  item: NewsItem;
  placeholderImagePath?: string;
  openLinkLabel?: string;
}) {
  const month = formatNewsMonth(item.date);
  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg border-b border-border bg-muted">
        {item.imagePath ? (
          <Image
            src={getImageUrl(item.imagePath)}
            alt={item.imageAlt ?? ""}
            fill
            sizes="320px"
            className="object-cover"
          />
        ) : (
          placeholderImagePath && (
            <div className="flex h-full items-center justify-center">
              <Image
                src={getAssetPath(placeholderImagePath)}
                alt=""
                width={56}
                height={56}
                className="opacity-25 grayscale"
              />
            </div>
          )
        )}
      </div>
      <div className="space-y-2 p-4">
        {item.highlight && item.highlightLabel && <HighlightChip label={item.highlightLabel} />}
        <p className="text-sm font-semibold leading-snug text-foreground">{item.title}</p>
        {(month || item.tag) && (
          <p className="font-mono text-xs text-muted-foreground">
            {[month, item.tag].filter(Boolean).join(" · ")}
          </p>
        )}
        {item.excerpt && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{item.excerpt}</p>
        )}
        {/* A real link: the card is portalled outside the row's <a>, so a
            label here would look clickable without being one. */}
        {item.url && openLinkLabel && (
          <Link
            href={item.url}
            target={isExternal(item.url) ? "_blank" : undefined}
            rel={isExternal(item.url) ? "noreferrer" : undefined}
            className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            {openLinkLabel}
            <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * One line per item: month, title, and a chip when highlighted. Details open in
 * a hover card on pointer devices; touch has no hover, so a tap simply follows
 * the item's link (Radix's HoverCard ignores touch input).
 */
export function NewsList({ items, placeholderImagePath, openLinkLabel }: NewsListProps) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item, i) => {
        const rowClass =
          "group flex items-center gap-3 px-1 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 sm:gap-5 sm:px-2";
        const row = (
          <>
            <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground sm:w-16">
              {formatNewsMonth(item.date)}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm text-foreground sm:text-[15px]",
                item.url && "group-hover:text-primary",
              )}
            >
              {item.title}
            </span>
            {item.highlight && item.highlightLabel && <HighlightChip label={item.highlightLabel} />}
          </>
        );

        return (
          <li key={item.id ?? `news-${i}`}>
            <HoverCard openDelay={150} closeDelay={80}>
              <HoverCardTrigger asChild>
                {item.url ? (
                  <Link
                    href={item.url}
                    target={isExternal(item.url) ? "_blank" : undefined}
                    rel={isExternal(item.url) ? "noreferrer" : undefined}
                    className={rowClass}
                  >
                    {row}
                  </Link>
                ) : (
                  <div tabIndex={0} className={cn(rowClass, "cursor-default")}>
                    {row}
                  </div>
                )}
              </HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="w-80 p-0">
                <NewsDetail
                  item={item}
                  placeholderImagePath={placeholderImagePath}
                  openLinkLabel={openLinkLabel}
                />
              </HoverCardContent>
            </HoverCard>
          </li>
        );
      })}
    </ul>
  );
}
