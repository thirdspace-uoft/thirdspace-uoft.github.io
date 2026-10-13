import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAssetPath, getImageUrl } from "@/lib/utils";

export type RailMember = {
  name: string;
  role: string;
  /** Fragment on /people addressing this person — see `memberAnchor`. */
  anchor?: string;
  imagePath?: string;
};

type ResearcherRailProps = {
  members: RailMember[];
  label: string;
  ctaLabel: string;
  ctaHref: string;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/**
 * Editorial roster of lab members — every researcher on one static list.
 *
 * This replaced a self-advancing marquee that duplicated the roster to fake a
 * seamless loop. Two things were wrong with that: it moved while you were
 * trying to read or tap a tile, and it showed a 6-person roster at 21rem wide
 * in a track that had to scroll. With a static list the whole roster is
 * visible at once and stays put, which is what a directory is for.
 *
 * Each row is a hairline-divided line rather than a card, matching the masthead
 * treatment on /people: portrait, name, role, and a link to the full profile.
 */
export function ResearcherRail({
  members,
  label,
  ctaLabel,
  ctaHref,
}: ResearcherRailProps) {
  return (
    <div className="mt-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {label}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Doctoral researchers and scholars in the ThirdSpace group.
          </p>
        </div>
        <Link
          href={ctaHref}
          className="group/cta inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {ctaLabel}
          <ArrowRight className="size-3.5 transition-transform group-hover/cta:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
        {members.map((m, i) => {
          const href = m.anchor ? `${ctaHref}#${m.anchor}` : ctaHref;

          return (
            <a
              key={`${m.name}-${i}`}
              href={getAssetPath(href)}
              className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-4 sm:p-5 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="relative mb-3 size-20 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-border/50 transition-all group-hover:ring-primary/40 sm:mb-3.5 sm:size-28">
                {m.imagePath ? (
                  <Image
                    src={getImageUrl(m.imagePath)}
                    alt={m.name}
                    fill
                    sizes="(max-width: 640px) 80px, 112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-base font-bold text-muted-foreground sm:text-lg">
                    {initialsOf(m.name)}
                  </span>
                )}
              </div>

              <h4 className="w-full text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-base break-words">
                {m.name}
              </h4>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {m.role}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}