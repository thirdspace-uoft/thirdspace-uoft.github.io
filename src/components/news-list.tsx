"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn, getImageUrl } from "@/lib/utils";
import { formatNewsMonth, type NewsItem } from "@/lib/news";

type NewsListProps = {
  items: NewsItem[];
  openLinkLabel?: string;
};

/** Hover card width in px — matches `w-80` below; used to centre it on the cursor. */
const CARD_WIDTH = 320;

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

function NewsDetail({ item, openLinkLabel }: { item: NewsItem; openLinkLabel?: string }) {
  const month = formatNewsMonth(item.date);
  return (
    <div>
      {/* Most items have no image; those get a text-only card. */}
      {item.imagePath && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg border-b border-border bg-muted">
          <Image
            src={getImageUrl(item.imagePath)}
            alt={item.imageAlt ?? ""}
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
      )}
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
 * One row and its hover card. The row spans the full list width, so a card
 * aligned to the row would always open at its left edge; instead the card is
 * centred on wherever the cursor entered/moved, then held there while open so
 * moving towards it to reach "Read more" doesn't make it slide away. Keyboard
 * focus has no cursor and falls back to the row's left edge.
 */
function NewsRow({ item, openLinkLabel }: { item: NewsItem; openLinkLabel?: string }) {
  const pointerX = useRef<number | null>(null);
  const [alignOffset, setAlignOffset] = useState(0);
  const [open, setOpen] = useState(false);

  const trackPointer = (e: React.PointerEvent<HTMLElement>) => {
    if (open) return;
    pointerX.current = e.clientX - e.currentTarget.getBoundingClientRect().left;
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setAlignOffset(pointerX.current === null ? 0 : Math.max(0, pointerX.current - CARD_WIDTH / 2));
    } else {
      pointerX.current = null;
    }
    setOpen(next);
  };

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
    <li>
      <HoverCard openDelay={150} closeDelay={80} open={open} onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          {item.url ? (
            <Link
              href={item.url}
              target={isExternal(item.url) ? "_blank" : undefined}
              rel={isExternal(item.url) ? "noreferrer" : undefined}
              onPointerMove={trackPointer}
              className={rowClass}
            >
              {row}
            </Link>
          ) : (
            <div tabIndex={0} onPointerMove={trackPointer} className={cn(rowClass, "cursor-default")}>
              {row}
            </div>
          )}
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="start"
          alignOffset={alignOffset}
          collisionPadding={16}
          className="w-80 p-0"
        >
          <NewsDetail item={item} openLinkLabel={openLinkLabel} />
        </HoverCardContent>
      </HoverCard>
    </li>
  );
}

/**
 * One line per item: month, title, and a chip when highlighted. Details open in
 * a hover card on pointer devices; touch has no hover, so a tap simply follows
 * the item's link (Radix's HoverCard ignores touch input).
 */
export function NewsList({ items, openLinkLabel }: NewsListProps) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item, i) => (
        <NewsRow key={item.id ?? `news-${i}`} item={item} openLinkLabel={openLinkLabel} />
      ))}
    </ul>
  );
}
