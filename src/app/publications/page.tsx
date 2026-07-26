import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, FileText } from "lucide-react";

import contentData from "../../../public/config/content.json";
import { getAssetPath } from "@/lib/utils";
import { pad2 } from "@/lib/section-numbering";

export const metadata: Metadata = {
  title: contentData.publications.pageTitle,
  description: contentData.publications.pageHeadline,
};

type Pub = {
  id?: string;
  authors?: string;
  title?: string;
  venue?: string;
  url?: string;
  doi?: string;
  pages?: string;
  articleNumber?: string;
  award?: string;
};

type YearBucket = {
  label?: string;
  journalArticles?: Pub[];
  conferenceProceedings?: Pub[];
  extendedAbstracts?: Pub[];
  researchArtifacts?: Pub[];
};

type Book = {
  title?: string;
  authors?: string;
  year?: string;
  description?: string;
  url?: string;
  coverImagePath?: string;
};

/* ─── Publication card ─── */
function PubCard({
  pub,
  index,
  awardBadgeLabel,
  doiPrefix,
  viewPaperLabel,
}: {
  pub: Pub;
  index: number;
  awardBadgeLabel: string;
  doiPrefix: string;
  viewPaperLabel: string;
}) {
  return (
    <article className="group relative grid gap-x-6 gap-y-2 border-b border-border/60 py-6 sm:grid-cols-[3rem_1fr_auto] sm:py-8">
      {/* Index number */}
      <span className="hidden font-mono text-[11px] tabular-nums tracking-[0.15em] text-muted-foreground/50 sm:block sm:pt-1">
        {pad2(index + 1)}
      </span>

      {/* Content */}
      <div className="min-w-0 space-y-2">
        {/* Title row */}
        {pub.title && (
          <h4 className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-foreground sm:text-base">
            {pub.url ? (
              <Link
                href={pub.url}
                target="_blank"
                rel="noreferrer"
                className="group/link inline decoration-primary/30 decoration-1 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary"
              >
                {pub.title}
                <ArrowUpRight className="ml-1 inline-block size-3.5 translate-y-[-1px] text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
              </Link>
            ) : (
              pub.title
            )}
          </h4>
        )}

        {/* Award badge — prominent, warm gold */}
        {pub.award && (
          <div className="flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
              <svg viewBox="0 0 24 24" className="size-3 fill-accent" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {awardBadgeLabel} · {pub.award}
            </span>
          </div>
        )}

        {/* Authors */}
        {pub.authors && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {pub.authors}
          </p>
        )}

        {/* Venue + meta chips */}
        <div className="flex flex-wrap items-center gap-2">
          {pub.venue && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              <FileText className="size-2.5" />
              {pub.venue}
            </span>
          )}
          {pub.pages && (
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground/60">
              pp. {pub.pages}
            </span>
          )}
        </div>
      </div>

      {/* Right column: DOI + link */}
      <div className="flex items-start gap-2 sm:flex-col sm:items-end sm:gap-1.5 sm:pt-1">
        {pub.doi && (
          <Link
            href={`https://doi.org/${pub.doi}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-primary transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {doiPrefix}{pub.doi}
          </Link>
        )}
        {pub.url && !pub.doi && (
          <Link
            href={pub.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {viewPaperLabel} <ArrowUpRight className="size-2.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

/* ─── Subsection (e.g. "Conference Proceedings") ─── */
function PubSubsection({
  title,
  entries,
  awardBadgeLabel,
  doiPrefix,
  entriesCountSingular,
  entriesCountPlural,
  startIndex,
  viewPaperLabel,
}: {
  title: string;
  entries?: Pub[];
  awardBadgeLabel: string;
  doiPrefix: string;
  entriesCountSingular: string;
  entriesCountPlural: string;
  startIndex: number;
  viewPaperLabel: string;
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <div className="mb-14 last:mb-0">
      {/* Subsection header with left accent */}
      <div className="mb-6 flex items-center justify-between gap-4 border-l-2 border-primary/25 pl-4">
        <h3 className="font-heading text-sm font-medium tracking-[-0.01em] text-foreground">
          {title}
        </h3>
        <span className="shrink-0 rounded-full bg-muted/80 px-2.5 py-0.5 font-mono text-[10px] tabular-nums tracking-[0.15em] text-muted-foreground">
          {entries.length} {entries.length === 1 ? entriesCountSingular : entriesCountPlural}
        </span>
      </div>

      {/* Publication cards */}
      <div>
        {entries.map((p, i) => (
          <PubCard
            key={p.id ?? `${title}-${i}`}
            pub={p}
            index={startIndex + i}
            awardBadgeLabel={awardBadgeLabel}
            doiPrefix={doiPrefix}
            viewPaperLabel={viewPaperLabel}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Book row ─── */
function BookRow({ book, index, bookCoverPlaceholder }: { book: Book; index: number; bookCoverPlaceholder: string }) {
  return (
    <article className="grid grid-cols-12 items-start gap-x-6 gap-y-3 border-t border-border py-7 sm:py-8">
      <span className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:col-span-1">
        {pad2(index + 1)}
      </span>

      {book.coverImagePath ? (
        <div className="col-span-10 sm:col-span-2">
          <div className="relative aspect-[3/4] w-20 overflow-hidden bg-muted sm:w-24">
            <Image
              src={getAssetPath(book.coverImagePath)}
              alt={book.title ?? "Book cover"}
              fill
              sizes="96px"
              className="object-cover grayscale transition-[filter] duration-500 hover:grayscale-0"
            />
          </div>
        </div>
      ) : (
        <div className="col-span-10 sm:col-span-2">
          <div className="flex aspect-[3/4] w-20 items-center justify-center bg-muted sm:w-24">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              {bookCoverPlaceholder}
            </span>
          </div>
        </div>
      )}

      <div className="col-span-12 sm:col-span-9">
        {book.title &&
          (book.url ? (
            <Link
              href={book.url}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-baseline gap-1.5 font-heading text-lg font-medium tracking-[-0.02em] text-foreground transition-colors hover:text-primary"
            >
              {book.title}
              <span aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100">
                ↗
              </span>
            </Link>
          ) : (
            <p className="font-heading text-lg font-medium tracking-[-0.02em] text-foreground">
              {book.title}
            </p>
          ))}
        {book.authors && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {book.authors}
            {book.year ? ` · ${book.year}` : ""}
          </p>
        )}
        {book.description && (
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            {book.description}
          </p>
        )}
      </div>
    </article>
  );
}

/* ─── Page ─── */
export default function PublicationsPage() {
  const { publications } = contentData;
  const books = (publications.books ?? []) as Book[];
  const years = (publications.years ?? {}) as Record<string, YearBucket>;
  const yearKeys = Object.keys(years).sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0,
  );

  // Compute total publications across all years
  const totalPubs = yearKeys.reduce((acc, y) => {
    const b = years[y];
    return (
      acc +
      (b.journalArticles?.length ?? 0) +
      (b.conferenceProceedings?.length ?? 0) +
      (b.extendedAbstracts?.length ?? 0) +
      (b.researchArtifacts?.length ?? 0)
    );
  }, 0);

  // Collect unique venues
  const venues = new Set<string>();
  yearKeys.forEach((y) => {
    const b = years[y];
    [b.journalArticles, b.conferenceProceedings, b.extendedAbstracts, b.researchArtifacts]
      .flat()
      .filter(Boolean)
      .forEach((p) => { if (p?.venue) venues.add(p.venue); });
  });

  return (
    <main className="bg-background">
      {/* ── Hero ── */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-24">
          {/* Meta strip */}
          <div className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4 sm:mb-16">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <BookOpen className="size-3 text-primary" />
              {publications.pageEyebrow}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {`${publications.indexWord} · ${yearKeys.length} ${yearKeys.length === 1 ? publications.yearSingular : publications.yearPlural}`}
            </span>
          </div>

          {/* Headline + subhead */}
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-8">
              <h1 className="font-heading text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.035em] text-foreground">
                {publications.pageHeadline}
              </h1>
            </div>
            <aside className="space-y-6 lg:col-span-4 lg:pt-3">
              <p className="max-w-prose text-pretty text-base leading-7 text-muted-foreground">
                {publications.pageSubhead}
              </p>
            </aside>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:mt-16 sm:grid-cols-3">
            <div className="flex flex-col gap-1 bg-background px-5 py-5">
              <span className="font-heading text-2xl font-medium tabular-nums tracking-[-0.03em] text-foreground sm:text-3xl">
                {totalPubs + books.length}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {totalPubs + books.length === 1 ? publications.entriesCountSingular : publications.entriesCountPlural}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-background px-5 py-5">
              <span className="font-heading text-2xl font-medium tabular-nums tracking-[-0.03em] text-foreground sm:text-3xl">
                {venues.size}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {publications.venuesLabel}
              </span>
            </div>
            <div className="col-span-2 flex flex-col gap-1 bg-background px-5 py-5 sm:col-span-1">
              <span className="font-heading text-2xl font-medium tabular-nums tracking-[-0.03em] text-foreground sm:text-3xl">
                {yearKeys.length}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {yearKeys.length === 1 ? publications.yearSingular : publications.yearPlural}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Books ── */}
      {books.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mb-6 flex items-baseline justify-between gap-6 border-b border-border pb-4">
              <div className="flex items-baseline gap-4">
                <h2 className="font-heading text-2xl font-medium tracking-[-0.025em] text-foreground sm:text-3xl">
                  {publications.sectionMonographTitle}
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-muted/80 px-2.5 py-0.5 font-mono text-[10px] tabular-nums tracking-[0.15em] text-muted-foreground">
                {`${books.length} ${books.length === 1 ? publications.titlesCountSingular : publications.titlesCountPlural}`}
              </span>
            </div>
            <div>
              {books.map((book, i) => (
                <BookRow
                  key={`${book.title}-${i}`}
                  book={book}
                  index={i}
                  bookCoverPlaceholder={publications.bookCoverPlaceholder}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Year-grouped publications ── */}
      {yearKeys.map((year) => {
        const bucket = years[year];
        const journalCount = bucket.journalArticles?.length ?? 0;
        const confCount = bucket.conferenceProceedings?.length ?? 0;
        const abstractCount = bucket.extendedAbstracts?.length ?? 0;
        const artifactCount = bucket.researchArtifacts?.length ?? 0;
        const total = journalCount + confCount + abstractCount + artifactCount;
        if (total === 0) return null;

        // Running index for continuous numbering within the year
        let runIdx = 0;
        const journalStart = runIdx; runIdx += journalCount;
        const confStart = runIdx; runIdx += confCount;
        const abstractStart = runIdx; runIdx += abstractCount;
        const artifactStart = runIdx;

        return (
          <section key={year} className="border-b border-border last:border-b-0">
            <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
              {/* Year header — big year number, count pill */}
              <div className="mb-12 flex items-end justify-between gap-6 border-b border-border pb-6">
                <div className="flex items-end gap-4">
                  <h2 className="font-heading text-4xl font-medium tabular-nums tracking-[-0.03em] text-foreground sm:text-6xl">
                    {bucket.label ?? year}
                  </h2>
                  <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:mb-2">
                    {publications.sectionTitleTemplate}
                  </span>
                </div>
                <span className="mb-1 shrink-0 rounded-full bg-primary/8 px-3 py-1 font-mono text-[10px] tabular-nums tracking-[0.15em] text-primary sm:mb-2">
                  {total} {total === 1 ? publications.entriesCountSingular : publications.entriesCountPlural}
                </span>
              </div>

              <PubSubsection
                title={publications.subsectionTitles.journalArticles}
                entries={bucket.journalArticles}
                awardBadgeLabel={publications.awardBadgeLabel}
                doiPrefix={publications.doiPrefix}
                entriesCountSingular={publications.entriesCountSingular}
                entriesCountPlural={publications.entriesCountPlural}
                startIndex={journalStart}
                viewPaperLabel={publications.viewPaperLabel}
              />
              <PubSubsection
                title={publications.subsectionTitles.conferenceProceedings}
                entries={bucket.conferenceProceedings}
                awardBadgeLabel={publications.awardBadgeLabel}
                doiPrefix={publications.doiPrefix}
                entriesCountSingular={publications.entriesCountSingular}
                entriesCountPlural={publications.entriesCountPlural}
                startIndex={confStart}
                viewPaperLabel={publications.viewPaperLabel}
              />
              <PubSubsection
                title={publications.subsectionTitles.extendedAbstracts}
                entries={bucket.extendedAbstracts}
                awardBadgeLabel={publications.awardBadgeLabel}
                doiPrefix={publications.doiPrefix}
                entriesCountSingular={publications.entriesCountSingular}
                entriesCountPlural={publications.entriesCountPlural}
                startIndex={abstractStart}
                viewPaperLabel={publications.viewPaperLabel}
              />
              <PubSubsection
                title={publications.subsectionTitles.researchArtifacts}
                entries={bucket.researchArtifacts}
                awardBadgeLabel={publications.awardBadgeLabel}
                doiPrefix={publications.doiPrefix}
                entriesCountSingular={publications.entriesCountSingular}
                entriesCountPlural={publications.entriesCountPlural}
                startIndex={artifactStart}
                viewPaperLabel={publications.viewPaperLabel}
              />
            </div>
          </section>
        );
      })}

      {/* ── Empty state ── */}
      {books.length === 0 && yearKeys.length === 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 pb-24 pt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {publications.emptyMessage}
          </p>
        </section>
      )}
    </main>
  );
}
