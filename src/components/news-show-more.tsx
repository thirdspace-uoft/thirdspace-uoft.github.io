"use client";

import { useState } from "react";

import { NewsList } from "@/components/news-list";
import type { NewsItem } from "@/lib/news";

type NewsShowMoreProps = {
  /** Shown first. */
  initial: NewsItem[];
  /** Full list shown after "Show more"; must start with `initial`. */
  expanded: NewsItem[];
  openLinkLabel?: string;
  showMoreLabel?: string;
  showLessLabel?: string;
};

/** The home news list, with a button that reveals the rest of the eligible items. */
export function NewsShowMore({ initial, expanded, openLinkLabel, showMoreLabel, showLessLabel }: NewsShowMoreProps) {
  const [open, setOpen] = useState(false);
  const hasMore = expanded.length > initial.length;
  const toggleLabel = open ? showLessLabel : showMoreLabel;

  return (
    <>
      <NewsList items={open ? expanded : initial} openLinkLabel={openLinkLabel} />
      {hasMore && toggleLabel && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            {toggleLabel}
          </button>
        </div>
      )}
    </>
  );
}
