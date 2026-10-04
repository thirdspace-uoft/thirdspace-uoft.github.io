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
    <div className="mt-14 border-t border-border pt-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-mono text-[14px] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </h3>
        <Link
          href={ctaHref}
          className="group/cta inline-flex items-center gap-1.5 font-mono text-[14px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/70"
        >
          {ctaLabel}
          <ArrowRight className="size-3 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-x-0" />
        </Link>
      </div>

      <ul className="border-t border-border">
        {members.map((m, i) => {
          // Plain <a>, not next/link. Next's client router re-applies the
          // fragment on top of the one it already restored from history, so
          // arriving at /people, going back, and clicking the same row again
          // lands on `/people#a/b#a/b` — a fragment no element matches, and the
          // profile never opens. A native anchor hands the fragment to the
          // browser, which resolves it once. The trade-off is a full page load
          // instead of a client transition, which is the right cost here: the
          // destination is a different route that reads its own JSON anyway.
          const href = m.anchor ? `${ctaHref}#${m.anchor}` : ctaHref;

          return (
            <li key={`${m.name}-${i}`}>
              <a
                href={getAssetPath(href)}
                className="group/member flex items-center gap-7 border-b border-border py-7 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-9 sm:py-8"
              >
                <span className="relative block size-24 shrink-0 overflow-hidden rounded-full bg-muted">
                  {m.imagePath ? (
                    <Image
                      src={getImageUrl(m.imagePath)}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-[17px] uppercase tracking-[0.12em] text-muted-foreground">
                      {initialsOf(m.name)}
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[30px] font-semibold leading-tight tracking-[-0.025em] text-foreground transition-colors group-hover/member:text-primary">
                    {m.name}
                  </span>
                  <span className="mt-3 block font-mono text-[13px] uppercase tracking-[0.2em] text-primary">
                    {m.role}
                  </span>
                </span>

                <ArrowRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/member:opacity-100"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}