"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Globe, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageUrl } from "@/lib/utils";
import { currentAnchor } from "@/lib/people";

export type MemberProfile = {
  eyebrow?: string;
  bio?: string;
  areasOfInterest?: string[];
  researchInterests?: string;
  website?: string;
  awards?: string[];
};

export type MemberDetails = {
  name: string;
  title?: string;
  role?: string;
  focus?: string;
  imagePath?: string;
  links?: { label: string; url: string }[];
  bioGlance?: string;
};

export type MemberCardLabels = {
  open: string;
  name?: string;
  bio: string;
  areas: string;
  research: string;
  website: string;
  close: string;
};

type Props = {
  member: MemberDetails;
  profile?: MemberProfile;
  labels: MemberCardLabels;
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

export function MemberCardClickable({
  member,
  profile,
  labels,
  anchor,
}: Props) {
  const hasImage = !!member.imagePath;
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
    profile?.bio ||
      (profile?.areasOfInterest && profile.areasOfInterest.length > 0) ||
      profile?.researchInterests
  );

  const websiteUrl =
    profile?.website ||
    member.links?.find((l) => l.url)?.url;

  // Render card inner content
  const cardBody = (
    <div
      ref={cardRef}
      id={anchor}
      data-highlighted={highlighted || undefined}
      className="group relative flex h-full flex-col items-center justify-between rounded-2xl border border-border/70 bg-card p-4 sm:p-5 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[highlighted]:ring-2 data-[highlighted]:ring-primary data-[highlighted]:bg-primary/5"
    >
      <div className="flex w-full flex-col items-center">
        {/* Avatar */}
        <div className="relative mb-3 size-20 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/50 transition-all group-hover:ring-primary/40 sm:mb-3.5 sm:size-28">
          {hasImage ? (
            <Image
              src={getImageUrl(member.imagePath!)}
              alt={member.name}
              fill
              sizes="(max-width: 640px) 80px, 112px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-base font-bold text-muted-foreground sm:text-lg">
              {initialsOf(member.name)}
            </span>
          )}
        </div>

        {/* Member Name */}
        <h3 className="w-full text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base break-words">
          {member.name}
        </h3>

        {/* Title or Role */}
        {(member.title || member.role) && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {member.title || member.role}
          </p>
        )}

        {/* Focus / Department */}
        {member.focus && (
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/75">
            {member.focus}
          </p>
        )}
      </div>

      {/* Footer / Indicator */}
      <div className="mt-3 flex items-center justify-center">
        {hasProfileModal ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity">
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
          <div className="h-4" />
        )}
      </div>
    </div>
  );

  // If has profile modal, wrap in Dialog
  if (hasProfileModal) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild className="cursor-pointer text-left">
          <div role="button" tabIndex={0} aria-label={`${labels.open} — ${member.name}`}>
            {cardBody}
          </div>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-4xl gap-0 overflow-hidden border border-border bg-card p-0 sm:max-w-4xl"
        >
          <DialogTitle className="sr-only">{member.name}</DialogTitle>

          <div className="relative max-h-[90vh] overflow-y-auto">
            <div className="relative flex flex-col items-center gap-6 px-6 pt-10 sm:flex-row sm:items-start sm:gap-8 sm:px-10 sm:pt-12">
              {hasImage ? (
                <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-sm sm:w-44">
                  <Image
                    src={getImageUrl(member.imagePath!)}
                    alt={member.name}
                    fill
                    sizes="(min-width: 640px) 176px, 144px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-36 shrink-0 items-center justify-center rounded-full border border-border bg-muted shadow-sm sm:w-44">
                  <span className="text-lg font-semibold text-muted-foreground sm:text-xl">
                    {initialsOf(member.name)}
                  </span>
                </div>
              )}

              <div className="flex w-full flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                {profile?.eyebrow && (
                  <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                    {profile.eyebrow}
                  </span>
                )}
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {member.name}
                </h2>
                {(member.title || member.role) && (
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {member.title || member.role}
                  </p>
                )}
                {member.focus && (
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {member.focus}
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
              {profile?.bio && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.bio}
                  </h3>
                  <p className="type-body text-pretty text-foreground/90">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile?.areasOfInterest && profile.areasOfInterest.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.areas}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {profile.areasOfInterest.map((area, i) => (
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

              {profile?.researchInterests && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                    {labels.research}
                  </h3>
                  <p className="type-body text-pretty text-foreground/90">
                    {profile.researchInterests}
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

  // If has website link but no dialog bio, wrap in an external anchor
  if (websiteUrl) {
    return (
      <a
        href={websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="block h-full text-left"
      >
        {cardBody}
      </a>
    );
  }

  // Otherwise plain card
  return <div className="h-full text-left">{cardBody}</div>;
}
