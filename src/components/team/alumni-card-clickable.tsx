"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { currentAnchor } from "@/lib/people";

export type AlumniData = {
  name: string;
  role?: string;
  title?: string;
  years?: string;
  currentPosition?: string;
  currentAffiliation?: string;
  focus?: string;
  imagePath?: string;
  website?: string;
  bio?: string;
  areasOfInterest?: string[];
  researchInterests?: string;
  links?: { label: string; url: string }[];
  profileDetailEyebrow?: string;
};

type Props = {
  alumni: AlumniData;
  labels?: {
    open?: string;
    name?: string;
    bio?: string;
    areas?: string;
    research?: string;
    website?: string;
    close?: string;
  };
  anchor?: string;
};

const HIGHLIGHT_MS = 1800;

export function AlumniCardClickable({ alumni, anchor }: Props) {
  const [highlighted, setHighlighted] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const [hash, setHash] = React.useState(() => currentAnchor());

  React.useEffect(() => {
    const sync = () => setHash(currentAnchor());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const targeted = !!anchor && hash === anchor;

  React.useEffect(() => {
    if (!targeted) return;

    setHighlighted(true);
    const hide = setTimeout(() => setHighlighted(false), HIGHLIGHT_MS);

    const frame = requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });

    return () => {
      clearTimeout(hide);
      cancelAnimationFrame(frame);
    };
  }, [targeted]);

  const currentWork = [alumni.currentPosition, alumni.currentAffiliation, alumni.focus]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" · ");

  const websiteUrl = alumni.website || alumni.links?.find((l) => l.url)?.url;

  const cardContent = (
    <div
      ref={cardRef}
      id={anchor}
      data-highlighted={highlighted || undefined}
      className="group relative flex h-full flex-col justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[highlighted]:ring-2 data-[highlighted]:ring-primary data-[highlighted]:bg-primary/5"
    >
      <div className="space-y-2">
        {/* Name and Years */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {alumni.name}
          </h3>
          {alumni.years && (
            <span className="shrink-0 text-[11px] text-muted-foreground/80 tabular-nums">
              {alumni.years}
            </span>
          )}
        </div>

        {/* Role & Current Affiliation */}
        <div className="space-y-1 text-xs">
          {(alumni.title || alumni.role) && (
            <p className="font-medium text-muted-foreground">
              {alumni.title || alumni.role}
            </p>
          )}
          {currentWork && (
            <p className="line-clamp-2 text-foreground/80">
              {currentWork}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer - External Website only if present */}
      {websiteUrl && (
        <div className="mt-3.5 flex items-center justify-end border-t border-border/40 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium transition-colors group-hover:text-primary">
            Website
            <ArrowUpRight className="size-3" />
          </span>
        </div>
      )}
    </div>
  );

  if (websiteUrl) {
    return (
      <a
        href={websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="block h-full text-left"
      >
        {cardContent}
      </a>
    );
  }

  return <div className="h-full text-left">{cardContent}</div>;
}
