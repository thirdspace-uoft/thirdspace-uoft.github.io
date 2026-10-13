"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Globe, GraduationCap, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/utils";
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
  labels: {
    open: string;
    name?: string;
    bio: string;
    areas: string;
    research: string;
    website: string;
    close: string;
  };
  anchor?: string;
};

const HIGHLIGHT_MS = 1800;

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function AlumniCardClickable({ alumni, labels, anchor }: Props) {
  const [open, setOpen] = React.useState(false);
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
    if (!targeted) setOpen(false);
  }, [hash, targeted]);

  React.useEffect(() => {
    if (!targeted) return;

    setOpen(true);
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

  const hasProfileModal = Boolean(
    alumni.bio && alumni.bio !== "Information coming soon." ||
      (alumni.areasOfInterest && alumni.areasOfInterest.length > 0) ||
      alumni.researchInterests
  );

  const currentWork = [alumni.currentPosition, alumni.currentAffiliation, alumni.focus]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" · ");

  const websiteUrl = alumni.website || alumni.links?.find((l) => l.url)?.url;
  const hasImage = !!alumni.imagePath;

  const cardContent = (
    <div
      ref={cardRef}
      id={anchor}
      data-highlighted={highlighted || undefined}
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[highlighted]:ring-2 data-[highlighted]:ring-primary data-[highlighted]:bg-primary/5"
    >
      <div>
        {/* Top row: Name & Years */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {alumni.name}
          </h3>
          {alumni.years && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {alumni.years}
            </span>
          )}
        </div>

        {/* Former Role */}
        {(alumni.title || alumni.role) && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {alumni.title || alumni.role}
          </p>
        )}

        {/* Current Affiliation / Focus */}
        {currentWork && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-foreground/85">
            <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{currentWork}</span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        {hasProfileModal ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            {labels.open}
            <ArrowUpRight className="size-3" />
          </span>
        ) : websiteUrl ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            <Globe className="size-3" />
            Website
            <ArrowUpRight className="size-2.5" />
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">Alumnus</span>
        )}

        {websiteUrl && hasProfileModal && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            title="External Website"
          >
            <Globe className="size-3" />
          </a>
        )}
      </div>
    </div>
  );

  if (hasProfileModal) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild className="cursor-pointer text-left">
          <div role="button" tabIndex={0} aria-label={`${labels.open} — ${alumni.name}`}>
            {cardContent}
          </div>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-4xl gap-0 overflow-hidden border border-border bg-card p-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{alumni.name}</DialogTitle>

          <div className="relative max-h-[90vh] overflow-y-auto">
            <div className="relative flex flex-col items-center gap-6 px-6 pt-10 sm:flex-row sm:items-start sm:gap-8 sm:px-10 sm:pt-12">
              {hasImage ? (
                <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-sm sm:w-44">
                  <Image
                    src={getImageUrl(alumni.imagePath!)}
                    alt={alumni.name}
                    fill
                    sizes="(min-width: 640px) 176px, 144px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-36 shrink-0 items-center justify-center rounded-full border border-border bg-muted shadow-sm sm:w-44">
                  <span className="text-lg font-semibold text-muted-foreground sm:text-xl">
                    {initialsOf(alumni.name)}
                  </span>
                </div>
              )}

              <div className="flex w-full flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {alumni.profileDetailEyebrow || "Lab Alumni"}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {alumni.name}
                </h2>
                {(alumni.title || alumni.role) && (
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {alumni.title || alumni.role}
                  </p>
                )}
                {alumni.years && (
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {alumni.years}
                  </p>
                )}
                {currentWork && (
                  <p className="mt-1 text-xs text-foreground/80">
                    {currentWork}
                  </p>
                )}
              </div>

              <DialogClose
                aria-label={labels.close}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted sm:right-6 sm:top-6"
              >
                <X className="size-4" />
              </DialogClose>
            </div>

            <div className="space-y-6 p-6 pt-8 sm:p-10 sm:pt-8">
              {alumni.bio && alumni.bio !== "Information coming soon." && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.bio}
                  </h3>
                  <p className="type-body text-pretty text-foreground/90">
                    {alumni.bio}
                  </p>
                </div>
              )}

              {alumni.areasOfInterest && alumni.areasOfInterest.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.areas}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {alumni.areasOfInterest.map((area, i) => (
                      <li
                        key={`${area}-${i}`}
                        className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {alumni.researchInterests && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.research}
                  </h3>
                  <p className="type-body text-pretty text-foreground/90">
                    {alumni.researchInterests}
                  </p>
                </div>
              )}

              {websiteUrl && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.website}
                  </h3>
                  <Link
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1.5 type-body text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                  >
                    {websiteUrl.replace(/^https?:\/\//, "")}
                    <ArrowUpRight className="size-3.5 text-primary" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
