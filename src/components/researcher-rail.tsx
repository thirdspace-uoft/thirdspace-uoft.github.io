"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { getImageUrl } from "@/lib/utils";

export type RailMember = {
  name: string;
  role: string;
  imagePath?: string;
  bio?: string;
  areasOfInterest?: string[];
  website?: string;
  websiteLabel?: string;
};

type ResearcherRailProps = {
  members: RailMember[];
  label: string;
  ctaLabel: string;
  ctaHref: string;
};

const PREVIEW_WIDTH = 336; // 21rem
const PREVIEW_GAP = 20; // px of clear space between the card and the tile
const HIDE_DELAY_MS = 260; // grace period to move pointer from tile to card
const SECONDS_PER_MEMBER = 2.6; // one full loop ≈ 18s for a 7-person roster

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/** Placeholder bios ("Information coming soon.") carry no information, so a
 *  card built from one is just noise — those tiles get no preview. */
function hasRealBio(bio?: string) {
  return !!bio && !/coming soon/i.test(bio);
}

type Preview = { left: number; member: RailMember };

/**
 * Marquee roster of lab members. Tiles advance on their own; hovering or
 * focusing one freezes the track and raises a profile preview above it.
 *
 * The preview is a single shared element rendered as a sibling of the track
 * rather than nested in a tile: an ancestor with `overflow: hidden` clips on
 * both axes, so anything positioned above the track inside it is invisible.
 *
 * The roster is rendered twice to make the -50% translate loop seamlessly. The
 * duplicate is aria-hidden and removed from the tab order, so assistive tech
 * and keyboard users meet each person exactly once.
 */
export function ResearcherRail({
  members,
  label,
  ctaLabel,
  ctaHref,
}: ResearcherRailProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [engaged, setEngaged] = React.useState(false);

  const running = !engaged;

  const clearClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const show = React.useCallback(
    (member: RailMember, el: HTMLElement) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      // Measure against the wrapper so the offset is correct mid-animation,
      // when the tile's layout offset and its painted position differ.
      const wrapRect = wrap.getBoundingClientRect();
      const tileRect = el.getBoundingClientRect();
      const centre = tileRect.left - wrapRect.left + tileRect.width / 2;
      const max = Math.max(0, wrapRect.width - PREVIEW_WIDTH);
      clearClose();
      setPreview({
        left: Math.max(0, Math.min(centre - PREVIEW_WIDTH / 2, max)),
        member,
      });
      // Placeholder-only members still freeze the track on hover, so the tile
      // under the cursor doesn't slide out from under it.
      setEngaged(true);
    },
    [clearClose],
  );

  // The card floats above the tile with a gap, so the pointer has to cross
  // dead space to get from one to the other — without a grace period the
  // leave handler fires mid-crossing and the card vanishes before it can be
  // reached. Closing is deferred so the pointer can make the trip.
  const hide = React.useCallback(() => {
    clearClose();
    closeTimer.current = setTimeout(() => {
      setPreview(null);
      setEngaged(false);
    }, HIDE_DELAY_MS);
  }, [clearClose]);

  React.useEffect(() => () => clearClose(), [clearClose]);

  const track = (
    <ul
      className="rail-track flex w-max gap-6 sm:gap-8"
      style={{
        animationDuration: `${Math.max(20, members.length * SECONDS_PER_MEMBER)}s`,
        // The inline play-state is what pauses on hover/focus. Below `md` the
        // CSS rule sets `animation: none`, which wins because it also resets
        // animation-name rather than competing on play-state alone.
        animationPlayState: running ? "running" : "paused",
      }}
      onFocusCapture={() => {
        clearClose();
        setEngaged(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hide();
      }}
    >
      {[...members, ...members].map((m, i) => {
        const duplicate = i >= members.length;
        return (
          <li
            key={`${m.name}-${i}`}
            className={duplicate ? "shrink-0 rail-duplicate" : "shrink-0"}
            aria-hidden={duplicate || undefined}
          >
            <Link
              href={ctaHref}
              tabIndex={duplicate ? -1 : undefined}
              onMouseEnter={(e) => show(m, e.currentTarget)}
              onMouseLeave={hide}
              onFocus={(e) => show(m, e.currentTarget)}
              className="flex w-[21rem] items-center gap-6 rounded-2xl border border-border bg-background p-6 transition-colors duration-200 hover:border-primary/40 hover:bg-muted/30 focus-visible:border-primary/40 focus-visible:bg-muted/30 focus-visible:outline-none sm:w-[27rem] sm:gap-8 sm:p-8"
            >
              {m.imagePath ? (
                <span className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted sm:h-32 sm:w-32">
                  <Image
                    src={getImageUrl(m.imagePath)}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted sm:h-32 sm:w-32">
                  <span className="font-mono text-base uppercase tracking-[0.12em] text-muted-foreground">
                    {initialsOf(m.name)}
                  </span>
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-xl font-medium leading-snug text-foreground sm:text-2xl">
                  {m.name}
                </span>
                <span className="mt-2 block font-mono text-[12px] uppercase leading-snug tracking-[0.14em] text-muted-foreground">
                  {m.role}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mt-14 border-t border-border pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-mono text-[14px] uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </h3>
        <div className="flex items-center gap-5">
          <Link
            href={ctaHref}
            className="group/cta inline-flex items-center gap-1.5 font-mono text-[14px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-primary/70"
          >
            {ctaLabel}
            <ArrowRight className="size-3 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-x-0" />
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* The track scrolls, so it must clip its own overflow. The preview is
            a sibling of the clipping wrapper rather than a child of it —
            `overflow: hidden` would otherwise cut off the part of the card
            that rises above the rail, leaving a sliver that reads as a shadow
            fused to the tile. */}
        <div
          ref={wrapRef}
          className="rail-viewport relative"
          onMouseLeave={hide}
        >
          {track}
        </div>

        {preview && hasRealBio(preview.member.bio) && (
          <div
            // Sits a full tile-gap above the rail; the wrapper spans that gap so
            // the pointer can still cross from tile to card without the card
            // being treated as left.
            className="pointer-events-none absolute z-40 hidden w-[21rem] md:block"
            style={{ left: preview.left, bottom: "100%", paddingBottom: PREVIEW_GAP }}
            onMouseEnter={clearClose}
            onMouseLeave={hide}
          >
            <div
              role="dialog"
              aria-label={`${preview.member.name} profile preview`}
              className="pointer-events-auto rounded-2xl border border-border bg-card p-4 shadow-xl shadow-primary/10"
            >
              <div className="flex gap-3">
                {preview.member.imagePath ? (
                  <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={getImageUrl(preview.member.imagePath)}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
                    <span className="font-mono text-[13px] uppercase tracking-[0.12em] text-muted-foreground">
                      {initialsOf(preview.member.name)}
                    </span>
                  </span>
                )}
                <div className="min-w-0 pt-0.5">
                  <p className="text-[15px] font-semibold leading-snug text-foreground">
                    {preview.member.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                    {preview.member.role}
                  </p>
                </div>
              </div>

              {hasRealBio(preview.member.bio) && (
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground line-clamp-4">
                  {preview.member.bio}
                </p>
              )}

              {(preview.member.areasOfInterest?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {preview.member.areasOfInterest!.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {preview.member.website && (
                <a
                  href={preview.member.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary transition-colors hover:text-primary/70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onMouseEnter={clearClose}
                >
                  {preview.member.websiteLabel}
                  <ArrowUpRight className="size-2.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
