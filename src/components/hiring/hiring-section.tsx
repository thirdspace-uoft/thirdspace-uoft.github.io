"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import { ModeChip, PositionFacts } from "@/components/hiring/position-meta";
import { PositionDialog } from "@/components/hiring/position-dialog";
import { RichText } from "@/components/research/rich-text";
import { openListings, type HiringContent } from "@/lib/hiring";

const HASH_PREFIX = "#position-";

/**
 * Open positions on /contact: one row per listing, each opening a dialog with
 * the description and the apply form. `/contact#position-<slug>` opens a
 * listing directly, so a position can be shared as a link.
 */
export function HiringSection({ hiring }: { hiring: HiringContent }) {
  const listings = openListings(hiring);
  const labels = hiring.labels ?? {};
  const steps = (hiring.process ?? []).filter((s) => s.title);
  const [openSlug, setOpenSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith(HASH_PREFIX)) return;
      const slug = decodeURIComponent(hash.slice(HASH_PREFIX.length));
      if (listings.some((l) => l.slug === slug)) setOpenSlug(slug);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // `listings` is static content; reading it once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setOpen = (slug: string | null) => {
    setOpenSlug(slug);
    const url = `${window.location.pathname}${window.location.search}${slug ? `${HASH_PREFIX}${slug}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  };

  const active = listings.find((l) => l.slug === openSlug);

  return (
    <section
      id="positions"
      data-section="hiring"
      data-section-label={hiring.heading}
      className="border-t border-border"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{hiring.heading}</h2>
          <RichText
            text={hiring.intro}
            className="mt-3 text-base leading-relaxed text-muted-foreground"
          />
        </div>

        {labels.positionsHeading && listings.length > 0 && (
          <h3 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {labels.positionsHeading}
          </h3>
        )}

        {listings.length > 0 ? (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {listings.map((listing) => (
              <li key={listing.id ?? listing.slug}>
                <button
                  type="button"
                  onClick={() => setOpen(listing.slug ?? null)}
                  aria-haspopup="dialog"
                  className="group flex w-full items-start gap-4 py-5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:items-center sm:px-3"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                        {listing.title}
                      </span>
                      <ModeChip mode={listing.mode} labels={labels} />
                    </div>
                    {(listing.type || listing.summary) && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {listing.type && <span className="font-medium text-foreground/80">{listing.type}</span>}
                        {listing.type && listing.summary && <span aria-hidden="true"> · </span>}
                        {listing.summary}
                      </p>
                    )}
                    <PositionFacts listing={listing} labels={labels} className="text-[13px]" />
                  </div>
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary sm:mt-0">
                    <span className="hidden sm:inline">{labels.viewDetails}</span>
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          hiring.emptyLabel && (
            <RichText
              text={hiring.emptyLabel}
              className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 px-5 py-6 text-sm leading-relaxed text-muted-foreground"
            />
          )
        )}

        {steps.length > 0 && (
          <div className="mt-14">
            <h3 className="text-lg font-bold tracking-tight text-foreground">{labels.processHeading}</h3>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <li key={i} className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                  <span className="font-mono text-xs font-semibold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 font-semibold text-foreground">{step.title}</p>
                  {step.body && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <PositionDialog
        listing={active}
        hiring={hiring}
        open={!!active}
        onOpenChange={(open) => !open && setOpen(null)}
      />
    </section>
  );
}
