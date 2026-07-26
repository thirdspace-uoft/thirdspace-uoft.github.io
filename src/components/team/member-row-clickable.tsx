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
import { getAssetPath } from "@/lib/utils";
import { pad2 } from "@/lib/section-numbering";

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
};

/**
 * Clickable editorial row that opens a full-profile dialog on click.
 * Mirrors the regular MemberRow but routes every interaction through
 * a single "View full profile" affordance that opens the dialog.
 */
export function MemberRowClickable({ index, member, profile, labels, bioGlance }: Props) {
  const hasImage = !!member.imagePath;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <article
          role="button"
          tabIndex={0}
          aria-label={`${labels.open} — ${member.name}`}
          className="group/member grid cursor-pointer grid-cols-12 items-start gap-x-6 gap-y-3 py-7 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:py-8"
        >
          <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
            {pad2(index + 1)}
          </span>

          {hasImage && (
            <div className="col-span-10 flex justify-center sm:col-span-2 sm:justify-start">
              <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:w-40">
                <Image
                  src={getAssetPath(member.imagePath!)}
                  alt={member.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div
            className={
              "col-span-12 " + (hasImage ? "sm:col-span-7" : "sm:col-span-9")
            }
          >
            <p className="font-heading text-lg font-medium tracking-[-0.02em] text-foreground transition-colors group-hover/member:text-primary">
              {member.name}
            </p>
            {member.title && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {member.title}
              </p>
            )}
            {bioGlance && (
              <p className="mt-2 line-clamp-2 max-w-prose text-pretty text-sm leading-6 text-muted-foreground">
                {bioGlance}
              </p>
            )}
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
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
            {hasImage && (
              <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-sm sm:w-48">
                <Image
                  src={getAssetPath(member.imagePath!)}
                  alt={member.name}
                  fill
                  sizes="(min-width: 640px) 192px, 160px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex w-full flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                {profile.eyebrow}
              </span>
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">
                {member.name}
              </h2>
              {member.title && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
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
                <p className="text-pretty text-sm leading-7 text-foreground/90 sm:text-base">
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
                      className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </ProfileSection>
            )}

            {profile.researchInterests && (
              <ProfileSection label={labels.research}>
                <p className="text-pretty text-sm leading-7 text-foreground/90 sm:text-base">
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
                  className="group inline-flex items-center gap-1.5 font-mono text-sm text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
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
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </h3>
      {children}
    </div>
  );
}
