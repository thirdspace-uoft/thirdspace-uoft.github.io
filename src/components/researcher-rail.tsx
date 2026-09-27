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
const SECONDS_PER_MEMBER = 1.8; // one full loop ≈ 66s for a 37-person roster

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
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [engaged, setEngaged] = React.useState(false);

  const running = !engaged;

  const show = React.useCallback((member: RailMember, el: HTMLElement) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Measure against the wrapper so the offset is correct mid-animation,
    // when the tile's layout offset and its painted position differ.
    const wrapRect = wrap.getBoundingClientRect();
    const tileRect = el.getBoundingClientRect();
    const centre = tileRect.left - wrapRect.left + tileRect.width / 2;
    const max = Math.max(0, wrapRect.width - PREVIEW_WIDTH);
    setPreview({
      left: Math.max(0, Math.min(centre - PREVIEW_WIDTH / 2, max)),
      member,
    });
    // Placeholder-only members still freeze the track on hover, so the tile
    // under the cursor doesn't slide out from under it.
    setEngaged(true);
  }, []);

  const hide = React.useCallback(() => {
    setPreview(null);
    setEngaged(false);
  }, []);

  const track = (
    <ul
      className="rail-track flex w-max gap-4"
      style={{
        animationDuration: `${Math.max(20, members.length * SECONDS_PER_MEMBER)}s`,
        animationPlayState: running ? "running" : "paused",
      }}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hide();
      }}
    >
      {[...members, ...members].map((m, i) => {
        const duplicate = i >= members.length;
        return (
          <li
            key={`${m.name}-${i}`}
            className="shrink-0"
            aria-hidden={duplicate || undefined}
          >
            <Link
              href={ctaHref}
              tabIndex={duplicate ? -1 : undefined}
              onMouseEnter={(e) => show(m, e.currentTarget)}
              onMouseLeave={hide}
              onFocus={(e) => show(m, e.currentTarget)}
              className="flex w-[17rem] items-center gap-5 rounded-2xl border border-border bg-background p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-muted/30 focus-visible:border-primary/40 focus-visible:bg-muted/30 focus-visible:outline-none sm:w-[21rem] sm:gap-6 sm:p-6"
            >
              {m.imagePath ? (
                <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:h-24 sm:w-24">
                  <Image
                    src={getImageUrl(m.imagePath)}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted sm:h-24 sm:w-24">
                  <span className="font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">
                    {initialsOf(m.name)}
                  </span>
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-lg font-medium leading-snug text-foreground sm:text-xl">
                  {m.name}
                </span>
                <span className="mt-1.5 block font-mono text-[11px] uppercase leading-snug tracking-[0.14em] text-muted-foreground">
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

      <div
        ref={wrapRef}
        className="relative overflow-hidden"
        onMouseLeave={hide}
      >
        {track}

        {preview && hasRealBio(preview.member.bio) && (
          <div
            className="pointer-events-none absolute bottom-full z-40 hidden w-[21rem] pb-3 md:block"
            style={{ left: preview.left }}
            onMouseEnter={() => setEngaged(true)}
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
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                  {preview.member.websiteLabel}
                  <ArrowUpRight className="size-2.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
