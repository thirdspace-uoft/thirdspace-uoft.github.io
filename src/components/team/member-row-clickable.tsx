"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/utils";
import { currentAnchor } from "@/lib/people";

type Profile = {
  eyebrow: string;
  bio?: string;
  areasOfInterest?: string[];
  researchInterests?: string;
  website?: string;
};

type DetailLabels = {
  open: string;
  name: string;
  bio: string;
  areas: string;
  research: string;
  website: string;
  close: string;
};

type Props = {
  index: number;
  member: {
    name: string;
    title?: string;
    imagePath?: string;
  };
  profile: Profile;
  labels: DetailLabels;
  bioGlance?: string;
  /** Fragment this row answers to — see `memberAnchor`. */
  anchor?: string;
};

/** How long the row stays lit after being jumped to via its anchor. */
const HIGHLIGHT_MS = 1800;

/**
 * Clickable editorial row that opens a full-profile dialog on click.
 * Mirrors the regular MemberRow but routes every interaction through
 * a single "View full profile" affordance that opens the dialog.
 *
 * Each row is also its own deep-link target: arriving on /people with this
 * member's anchor in the URL scrolls to the row, flashes it, and opens the
 * profile — so a link minted on the home rail lands on the full profile in
 * one click. Rows share nothing but the helper, so the page stays a server
 * component and only this file ships to the client.
 */
export function MemberRowClickable({ index, member, profile, labels, bioGlance, anchor }: Props) {
  const hasImage = !!member.imagePath;
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(false);
  const rowRef = React.useRef<HTMLElement>(null);

  // Re-runs on mount and on every hash change, so the row responds both to a
  // fresh load with a link in the URL and to a later jump to another person.
  const [hash, setHash] = React.useState(() => currentAnchor());

  React.useEffect(() => {
    const sync = () => setHash(currentAnchor());
    // `hashchange` alone misses the hash already present at mount, and
    // `location.hash` isn't reactive, so both are needed.
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const targeted = !!anchor && hash === anchor;

  // A dialog this row opened — by link or by click — must close when the hash
  // moves on to someone else, or the stale profile stays up over the new row.
  // Keyed on `hash` as well as `targeted` so a jump to another person closes
  // this one even when this row is not the new target.
  React.useEffect(() => {
    if (!targeted) setOpen(false);
  }, [hash, targeted]);

  React.useEffect(() => {
    if (!targeted) return;

    setOpen(true);
    setHighlighted(true);
    const hide = setTimeout(() => setHighlighted(false), HIGHLIGHT_MS);

    // Open first, scroll second. Radix locks body scroll while the dialog is
    // up, which repositions the page — a scrollIntoView issued beforehand
    // would be undone by that reflow. Doing it on the next frame lets the
    // lock settle first, so the row lands at the top of the viewport.
    const frame = requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <article
          ref={rowRef}
          id={anchor}
          data-highlighted={highlighted || undefined}
          role="button"
          tabIndex={0}
          aria-label={`${labels.open} — ${member.name}`}
          className="group/member -mx-4 grid cursor-pointer scroll-mt-24 grid-cols-12 items-center gap-x-6 gap-y-3 rounded-lg px-4 py-7 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 data-[highlighted]:bg-primary/8 sm:py-8"
        >
          <div className="col-span-12 flex justify-center sm:col-span-4 lg:col-span-3 sm:justify-start">
            {hasImage ? (
              <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:w-48">
                <Image
                  src={getImageUrl(member.imagePath!)}
                  alt={member.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-36 shrink-0 items-center justify-center rounded-full border border-border bg-muted sm:w-48">
                <span className="font-mono text-[17px] uppercase tracking-[0.12em] text-muted-foreground sm:text-lg">
                  {member.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
                </span>
              </div>
            )}
          </div>

          <div className="col-span-12 sm:col-span-8 lg:col-span-9">
            <p className="type-body font-medium text-foreground transition-colors group-hover/member:text-primary">
              {member.name}
            </p>
            {member.title && (
              <p className="mt-1 type-meta uppercase tracking-[0.22em] text-muted-foreground">
                {member.title}
              </p>
            )}
            {bioGlance && (
              <p className="mt-2 line-clamp-2 max-w-prose type-body text-muted-foreground">
                {bioGlance}
              </p>
            )}
            <p className="mt-3 inline-flex items-center gap-1.5 type-meta uppercase tracking-[0.22em] text-primary">
              {labels.open}
              <ArrowUpRight className="size-3" />
            </p>
          </div>
        </article>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-4xl gap-0 overflow-hidden border border-border bg-card p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{member.name}</DialogTitle>

        <div className="relative max-h-[90vh] overflow-y-auto">
          <div className="relative flex flex-col items-center gap-6 px-6 pt-10 sm:flex-row sm:items-start sm:gap-8 sm:px-10 sm:pt-12">
            {hasImage ? (
              <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-sm sm:w-52">
                <Image
                  src={getImageUrl(member.imagePath!)}
                  alt={member.name}
                  fill
                  sizes="(min-width: 640px) 192px, 160px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-44 shrink-0 items-center justify-center rounded-full border border-border bg-muted shadow-sm sm:w-52">
                <span className="font-mono text-lg uppercase tracking-[0.12em] text-muted-foreground sm:text-xl">
                  {member.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}
                </span>
              </div>
            )}

            <div className="flex w-full flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                {profile.eyebrow}
              </span>
              <h2 className="type-subhead text-foreground">
                {member.name}
              </h2>
              {member.title && (
                <p className="mt-1 type-meta uppercase tracking-[0.22em] text-muted-foreground">
                  {member.title}
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
            {profile.bio && (
              <ProfileSection label={labels.bio}>
                <p className="type-body text-pretty text-foreground/90">
                  {profile.bio}
                </p>
              </ProfileSection>
            )}

            {profile.areasOfInterest && profile.areasOfInterest.length > 0 && (
              <ProfileSection label={labels.areas}>
                <ul className="flex flex-wrap gap-2">
                  {profile.areasOfInterest.map((area, i) => (
                    <li
                      key={`${area}-${i}`}
                      className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 type-meta uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </ProfileSection>
            )}

            {profile.researchInterests && (
              <ProfileSection label={labels.research}>
                <p className="type-body text-pretty text-foreground/90">
                  {profile.researchInterests}
                </p>
              </ProfileSection>
            )}

            {profile.website && (
              <ProfileSection label={labels.website}>
                <Link
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 type-body text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
                >
                  {profile.website.replace(/^https?:\/\//, "")}
                  <ArrowUpRight className="size-3.5 text-primary" />
                </Link>
              </ProfileSection>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 type-meta uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}
