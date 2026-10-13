"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe, User, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/utils";
import { currentAnchor } from "@/lib/people";

type PiCardClickableProps = {
  professor: {
    name: string;
    title: string;
    role?: string;
    department?: string;
    institution?: string;
    imagePath?: string;
    website?: string;
    bio?: string;
    areasOfInterest?: string[];
    researchInterests?: string;
    profileDetailEyebrow?: string;
  };
  labels: {
    open: string;
    name: string;
    bio: string;
    areas: string;
    research: string;
    website: string;
    close: string;
  };
  eyebrowBadge?: string;
  anchor?: string;
};

const HIGHLIGHT_MS = 1800;

export function PiCardClickable({
  professor,
  labels,
  eyebrowBadge = "Principal Investigator",
  anchor,
}: PiCardClickableProps) {
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

  const hasImage = !!professor.imagePath;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        ref={cardRef}
        id={anchor}
        data-highlighted={highlighted || undefined}
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 data-[highlighted]:ring-2 data-[highlighted]:ring-primary data-[highlighted]:bg-primary/5 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-10">
          {/* Avatar */}
          <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-xs sm:size-36 lg:size-40">
            {hasImage ? (
              <Image
                src={getImageUrl(professor.imagePath!)}
                alt={professor.name}
                fill
                sizes="(max-width: 640px) 112px, 160px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                {professor.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {eyebrowBadge}
              </span>
              {professor.institution && (
                <span className="text-xs text-muted-foreground">
                  {professor.institution}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                {professor.name}
              </h3>
            </div>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm sm:font-medium sm:text-foreground/85">
              {professor.title}
              {professor.department ? `, ${professor.department}` : ""}
            </p>
            {professor.role && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {professor.role}
              </p>
            )}

            {professor.bio && (
              <p className="mt-3.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {professor.bio}
              </p>
            )}

            {professor.areasOfInterest && professor.areasOfInterest.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
                {professor.areasOfInterest.map((area: string) => (
                  <span
                    key={area}
                    className="rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                >
                  <User className="size-3.5" />
                  {labels.open}
                  <ArrowUpRight className="size-3" />
                </button>
              </DialogTrigger>

              {professor.website && (
                <a
                  href={professor.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-xs transition-all hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-sm"
                >
                  <Globe className="size-3.5 text-muted-foreground" />
                  {labels.website}
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dialog Modal */}
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-4xl gap-0 overflow-hidden border border-border bg-card p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{professor.name}</DialogTitle>

        <div className="relative max-h-[90vh] overflow-y-auto">
          <div className="relative flex flex-col items-center gap-6 px-6 pt-10 sm:flex-row sm:items-start sm:gap-8 sm:px-10 sm:pt-12">
            {hasImage ? (
              <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:w-48">
                <Image
                  src={getImageUrl(professor.imagePath!)}
                  alt={professor.name}
                  fill
                  sizes="(min-width: 640px) 192px, 160px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-40 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted shadow-sm sm:w-48">
                <span className="text-xl font-semibold text-muted-foreground sm:text-2xl">
                  {professor.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </span>
              </div>
            )}

            <div className="flex w-full flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                {professor.profileDetailEyebrow || eyebrowBadge}
              </span>
              <h2 className="type-subhead text-foreground">{professor.name}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {professor.title}
                {professor.department ? `, ${professor.department}` : ""}
              </p>
              {professor.institution && (
                <p className="text-xs text-muted-foreground">
                  {professor.institution}
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
            {professor.bio && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                  {labels.bio}
                </h3>
                <p className="type-body text-pretty text-foreground/90">
                  {professor.bio}
                </p>
              </div>
            )}

            {professor.areasOfInterest && professor.areasOfInterest.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                  {labels.areas}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {professor.areasOfInterest.map((area, i) => (
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

            {professor.researchInterests && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                  {labels.research}
                </h3>
                <p className="type-body text-pretty text-foreground/90">
                  {professor.researchInterests}
                </p>
              </div>
            )}

            {professor.website && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                  {labels.website}
                </h3>
                <Link
                  href={professor.website}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 type-body text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                >
                  {professor.website.replace(/^https?:\/\//, "")}
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
