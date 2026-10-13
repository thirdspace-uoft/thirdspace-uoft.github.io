"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Trophy,
  X,
} from "lucide-react";

import { getImageUrl } from "@/lib/utils";
import { pad2 } from "@/lib/section-numbering";

export type Pub = {
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

export type YearBucket = {
  label?: string;
  journalArticles?: Pub[];
  conferenceProceedings?: Pub[];
  extendedAbstracts?: Pub[];
  researchArtifacts?: Pub[];
};

export type Book = {
  title?: string;
  authors?: string;
  year?: string;
  description?: string;
  url?: string;
  coverImagePath?: string;
};

export type PublicationsContent = {
  pageHeadline?: string;
  pageSubhead?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sectionMonographTitle?: string;
  titlesCountSingular?: string;
  titlesCountPlural?: string;
  bookCoverPlaceholder?: string;
  entriesCountSingular?: string;
  entriesCountPlural?: string;
  emptyMessage?: string;
  awardBadgeLabel?: string;
  doiPrefix?: string;
  viewPaperLabel?: string;
  sectionTitleTemplate?: string;
  subsectionTitles?: {
    journalArticles?: string;
    conferenceProceedings?: string;
    extendedAbstracts?: string;
    researchArtifacts?: string;
  };
  books?: Book[];
  years?: Record<string, YearBucket>;
};

function awardEmoji(award: string): string {
  const lower = award.toLowerCase();
  if (lower.includes("best paper award") && !lower.includes("honorable")) return "🏆";
  if (lower.includes("best paper")) return "🏆";
  if (lower.includes("honorable") || lower.includes("honourable")) return "🎖️";
  if (lower.includes("diversity") || lower.includes("inclusion")) return "🌟";
  return "🏆";
}

// Extract canonical conference or venue series/short name (e.g., "CHI 2024 (LBW)" -> "CHI", "CSCW 2022" -> "CSCW")
function extractConferenceSeries(venue: string): string {
  const trimmed = venue.trim();
  const match = trimmed.match(/^([A-Za-z&]+(?:\s+[A-Za-z]+)?)\s+\d{4}/);
  if (match) return match[1].trim();
  // Strip trailing year if present
  const altMatch = trimmed.match(/^(.*?)[,\s]+\b(19|20)\d{2}\b/);
  if (altMatch && altMatch[1].length <= 25) return altMatch[1].trim();
  return trimmed;
}

// Clean and split authors into a distinct list
function parseAuthors(authorsStr?: string): string[] {
  if (!authorsStr) return [];
  const parts = authorsStr.split(/,\s*(?:and\s+)?|\s+and\s+/);
  return parts
    .map((p) => p.trim().replace(/^[\s,.]+|[\s,.]+$/g, ""))
    .filter((p) => p.length > 0);
}

function PublicationCard({
  pub,
  index,
  year,
  awardBadgeLabel,
  doiPrefix,
  viewPaperLabel,
}: {
  pub: Pub;
  index: number;
  year: string;
  awardBadgeLabel: string;
  doiPrefix: string;
  viewPaperLabel: string;
}) {
  return (
    <article className="group relative rounded-xl border border-border/80 bg-card p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Top meta row: index, award badge, venue pill */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold tabular-nums tracking-wider text-muted-foreground/60">
              #{pad2(index + 1)}
            </span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
              {year}
            </span>
            {pub.award && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground shadow-xs">
                <svg viewBox="0 0 24 24" className="size-3 fill-accent" aria-hidden>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{awardEmoji(pub.award)}</span>
                <span>{awardBadgeLabel ? `${awardBadgeLabel} · ` : ""}{pub.award}</span>
              </span>
            )}
          </div>

          {/* Quick links: DOI / Paper */}
          <div className="flex items-center gap-2">
            {pub.doi && (
              <a
                href={`https://doi.org/${pub.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 py-1 font-mono text-[11px] font-medium tracking-wider text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {doiPrefix}{pub.doi}
                <ExternalLink className="size-2.5" />
              </a>
            )}
            {pub.url && !pub.doi && (
              <a
                href={pub.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {viewPaperLabel}
                <ArrowUpRight className="size-3 text-muted-foreground" />
              </a>
            )}
          </div>
        </div>

        {/* Title */}
        {pub.title && (
          <h4 className="text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
            {pub.url ? (
              <a
                href={pub.url}
                target="_blank"
                rel="noreferrer"
                className="group/title inline underline decoration-primary/25 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
              >
                {pub.title}
                <ArrowUpRight className="ml-1 inline-block size-3.5 translate-y-[-1px] text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100" />
              </a>
            ) : (
              pub.title
            )}
          </h4>
        )}

        {/* Authors */}
        {pub.authors && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {pub.authors}
          </p>
        )}

        {/* Venue & Pages */}
        {(pub.venue || pub.pages) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            {pub.venue && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                <FileText className="size-3 text-primary" />
                {pub.venue}
              </span>
            )}
            {pub.pages && (
              <span className="font-mono text-xs text-muted-foreground">
                pp. {pub.pages}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function BookCard({
  book,
  index,
  placeholder,
}: {
  book: Book;
  index: number;
  placeholder: string;
}) {
  return (
    <article className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 transition-all hover:border-primary/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          {book.coverImagePath ? (
            <Image
              src={getImageUrl(book.coverImagePath)}
              alt={book.title ?? "Book cover"}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xs text-muted-foreground">
              {placeholder}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground/60">
              #{pad2(index + 1)}
            </span>
            {book.year && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                {book.year}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {book.url ? (
              <a
                href={book.url}
                target="_blank"
                rel="noreferrer"
                className="group/b inline underline decoration-primary/25 underline-offset-4 transition-colors hover:text-primary"
              >
                {book.title}
                <ArrowUpRight className="ml-1 inline size-4 text-muted-foreground opacity-0 transition-opacity group-hover/b:opacity-100" />
              </a>
            ) : (
              book.title
            )}
          </h3>

          {book.authors && (
            <p className="text-xs font-medium text-muted-foreground">
              {book.authors}
            </p>
          )}

          {book.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {book.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function PublicationsClient({
  publications,
}: {
  publications: PublicationsContent;
}) {
  const books = (publications.books ?? []) as Book[];
  const years = (publications.years ?? {}) as Record<string, YearBucket>;

  // Display years 2016 onward
  const FIRST_VISIBLE_YEAR = "2016";
  const allYearKeys = useMemo(
    () =>
      Object.keys(years)
        .filter((y) => y >= FIRST_VISIBLE_YEAR)
        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0)),
    [years]
  );

  // Flatten publication items for fast indexing and filtering
  const allItems = useMemo(() => {
    type FlatPub = Pub & {
      year: string;
      category: "journalArticles" | "conferenceProceedings" | "extendedAbstracts" | "researchArtifacts";
      categoryLabel: string;
      conferenceSeries: string;
      authorList: string[];
    };

    const subsectionTitles = publications.subsectionTitles ?? {
      journalArticles: "Journal Articles",
      conferenceProceedings: "Conference Proceedings",
      extendedAbstracts: "Extended Abstracts",
      researchArtifacts: "Research Artifacts",
    };

    const list: FlatPub[] = [];

    allYearKeys.forEach((year) => {
      const bucket = years[year];
      if (!bucket) return;

      const cats: Array<{
        key: "journalArticles" | "conferenceProceedings" | "extendedAbstracts" | "researchArtifacts";
        items?: Pub[];
      }> = [
        { key: "journalArticles", items: bucket.journalArticles },
        { key: "conferenceProceedings", items: bucket.conferenceProceedings },
        { key: "extendedAbstracts", items: bucket.extendedAbstracts },
        { key: "researchArtifacts", items: bucket.researchArtifacts },
      ];

      cats.forEach(({ key, items }) => {
        (items ?? []).forEach((p) => {
          list.push({
            ...p,
            year,
            category: key,
            categoryLabel: subsectionTitles[key] ?? key,
            conferenceSeries: p.venue ? extractConferenceSeries(p.venue) : "",
            authorList: parseAuthors(p.authors),
          });
        });
      });
    });

    return list;
  }, [allYearKeys, years, publications.subsectionTitles]);

  // Extract unique authors (sorted by publication count desc, then alphabetically)
  const authorOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((p) => {
      p.authorList.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allItems]);

  // Extract unique conferences / venues
  const conferenceOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((p) => {
      if (p.conferenceSeries) {
        counts[p.conferenceSeries] = (counts[p.conferenceSeries] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([conf, count]) => ({ conf, count }))
      .sort((a, b) => b.count - a.count || a.conf.localeCompare(b.conf));
  }, [allItems]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [selectedConference, setSelectedConference] = useState<string>("all");
  const [onlyAwards, setOnlyAwards] = useState<boolean>(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState<boolean>(false);

  const activeFilterCount =
    (selectedYear !== "all" ? 1 : 0) +
    (selectedAuthor !== "all" ? 1 : 0) +
    (selectedConference !== "all" ? 1 : 0) +
    (onlyAwards ? 1 : 0);

  const isFiltered =
    searchQuery.trim() !== "" ||
    activeFilterCount > 0;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
    setSelectedAuthor("all");
    setSelectedConference("all");
    setOnlyAwards(false);
  };

  // Filtered publications
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allItems.filter((item) => {
      // Year filter
      if (selectedYear !== "all" && item.year !== selectedYear) return false;

      // Author filter
      if (selectedAuthor !== "all") {
        const matchesAuthor = item.authorList.some(
          (a) => a.toLowerCase() === selectedAuthor.toLowerCase()
        );
        if (!matchesAuthor) return false;
      }

      // Conference filter
      if (selectedConference !== "all") {
        const matchesConf =
          item.conferenceSeries.toLowerCase() === selectedConference.toLowerCase() ||
          (item.venue && item.venue.toLowerCase().includes(selectedConference.toLowerCase()));
        if (!matchesConf) return false;
      }

      // Awards filter
      if (onlyAwards && !item.award) return false;

      // Free text search
      if (query) {
        const titleMatch = item.title?.toLowerCase().includes(query);
        const authorMatch = item.authors?.toLowerCase().includes(query);
        const venueMatch = item.venue?.toLowerCase().includes(query);
        const awardMatch = item.award?.toLowerCase().includes(query);
        if (!titleMatch && !authorMatch && !venueMatch && !awardMatch) return false;
      }

      return true;
    });
  }, [allItems, searchQuery, selectedYear, selectedAuthor, selectedConference, onlyAwards]);

  // Group filtered results by Year (so the side-bar year anchors work!)
  const groupedByYear = useMemo(() => {
    const map = new Map<string, typeof filteredItems>();
    filteredItems.forEach((item) => {
      const existing = map.get(item.year) ?? [];
      existing.push(item);
      map.set(item.year, existing);
    });

    // Sort descending by year
    return Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0
    );
  }, [filteredItems]);

  return (
    <main className="bg-background">
      {/* ── HERO ── styled with ThirdSpace homepage editorial aesthetics */}
      <section
        data-section="publications"
        data-section-label="Publications"
        className="border-b border-border"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Headline & Subheading */}
            <div className="min-w-0 lg:col-span-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.14]">
                {publications.pageHeadline}
              </h1>

              {publications.pageSubhead && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {publications.pageSubhead}
                </p>
              )}
            </div>

            {/* Right Column: Simple text-based CTA */}
            <aside className="space-y-6 lg:col-span-4 lg:pt-3">
              {publications.ctaUrl ? (
                <Link
                  href={publications.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group/cta inline-flex items-start gap-2 text-lg font-medium leading-snug tracking-[-0.02em] text-primary transition-colors hover:text-foreground"
                >
                  <span className="underline decoration-primary/30 decoration-1 underline-offset-[5px] transition-colors group-hover/cta:decoration-primary">
                    {publications.ctaLabel}
                  </span>
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/cta:opacity-100" />
                </Link>
              ) : (
                publications.pageSubhead && (
                  <p className="max-w-prose text-pretty text-base leading-7 text-muted-foreground">
                    {publications.pageSubhead}
                  </p>
                )
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ── FILTERING CONTROLS BAR ── sticky bar, ultra-compact on mobile with collapsible controls */}
      <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-md transition-shadow">
        <div className="mx-auto w-full max-w-6xl px-4 py-2.5 sm:px-8 sm:py-3.5">
          <div className="flex flex-col gap-2.5">
            {/* Primary Search & Mobile Filter Toggle Row */}
            <div className="flex items-center gap-2">
              {/* Search input (Always visible and responsive) */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search title, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search query"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all sm:hidden ${
                  mobileFiltersExpanded || activeFilterCount > 0
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-input bg-card text-muted-foreground hover:text-foreground"
                }`}
                aria-expanded={mobileFiltersExpanded}
                aria-label="Toggle filters"
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Desktop quick Year filter */}
              <div className="relative hidden w-32 shrink-0 sm:block lg:w-36">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Years</option>
                  {allYearKeys.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Desktop quick Author filter */}
              <div className="relative hidden w-44 shrink-0 sm:block lg:w-56">
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Authors</option>
                  {authorOptions.map(({ name, count }) => (
                    <option key={name} value={name}>
                      {name} ({count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Desktop quick Conference filter */}
              <div className="relative hidden w-44 shrink-0 sm:block lg:w-56">
                <select
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Conferences</option>
                  {conferenceOptions.map(({ conf, count }) => (
                    <option key={conf} value={conf}>
                      {conf} ({count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Mobile Collapsible Drawer: Year, Author, Conference, Award */}
            {mobileFiltersExpanded && (
              <div className="grid grid-cols-1 gap-2 border-t border-border/60 pt-2.5 sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {/* Mobile Year */}
                  <div className="relative">
                    <label className="mb-1 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="h-9 w-full appearance-none rounded-lg border border-input bg-card pl-2.5 pr-7 text-xs font-medium text-foreground"
                    >
                      <option value="all">All Years</option>
                      {allYearKeys.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 bottom-2.5 size-3 text-muted-foreground" />
                  </div>

                  {/* Mobile Conference */}
                  <div className="relative">
                    <label className="mb-1 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Venue
                    </label>
                    <select
                      value={selectedConference}
                      onChange={(e) => setSelectedConference(e.target.value)}
                      className="h-9 w-full appearance-none rounded-lg border border-input bg-card pl-2.5 pr-7 text-xs font-medium text-foreground"
                    >
                      <option value="all">All Venues</option>
                      {conferenceOptions.map(({ conf, count }) => (
                        <option key={conf} value={conf}>
                          {conf} ({count})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 bottom-2.5 size-3 text-muted-foreground" />
                  </div>
                </div>

                {/* Mobile Author */}
                <div className="relative">
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Author
                  </label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-card pl-2.5 pr-7 text-xs font-medium text-foreground"
                  >
                    <option value="all">All Authors</option>
                    {authorOptions.map(({ name, count }) => (
                      <option key={name} value={name}>
                        {name} ({count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 bottom-2.5 size-3 text-muted-foreground" />
                </div>

                {/* Mobile Award toggle */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setOnlyAwards(!onlyAwards)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      onlyAwards
                        ? "border-accent bg-accent/20 text-accent-foreground font-semibold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Trophy className="size-3 text-accent" />
                    <span>Award-winning</span>
                    {onlyAwards && <Check className="size-3 text-accent-foreground" />}
                  </button>

                  {isFiltered && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Desktop secondary row: Award toggle, Quick Chips, Counter, Reset */}
            <div className="hidden flex-wrap items-center justify-between gap-2 text-xs sm:flex">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyAwards(!onlyAwards)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                    onlyAwards
                      ? "border-accent bg-accent/20 text-accent-foreground shadow-xs font-semibold"
                      : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <Trophy className="size-3 text-accent" />
                  <span>Award-winning</span>
                  {onlyAwards && <Check className="size-3 text-accent-foreground" />}
                </button>

                <span className="text-muted-foreground/60">|</span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  Quick:
                </span>
                {["CHI", "CSCW", "ICTD", "COMPASS"].map((conf) => (
                  <button
                    key={conf}
                    onClick={() =>
                      setSelectedConference(selectedConference === conf ? "all" : conf)
                    }
                    className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
                      selectedConference === conf
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  Showing <strong className="text-foreground">{filteredItems.length}</strong> of{" "}
                  {allItems.length}
                </span>

                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Active Filter Bar (shows count + active chip badges when collapsed) */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground sm:hidden">
              <span>
                Showing <strong className="text-foreground">{filteredItems.length}</strong> of {allItems.length}
              </span>
              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="font-medium text-primary"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKS SECTION (shown when no specific filter active or matches) ── */}
      {books.length > 0 && selectedYear === "all" && selectedConference === "all" && !onlyAwards && (
        <section
          data-section="publications-books"
          data-section-label="Books"
          className="border-b border-border"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
            <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {publications.sectionMonographTitle || "Monographs & Books"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Long-form scholarly books, monographs, and volumes.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                {books.length} {books.length === 1 ? "book" : "books"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {books.map((book, i) => (
                <BookCard
                  key={`${book.title}-${i}`}
                  book={book}
                  index={i}
                  placeholder={publications.bookCoverPlaceholder || "Book"}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PUBLICATIONS LIST (Grouped by Year for Sidebar Nav & Visual Hierarchy) ── */}
      {groupedByYear.map(([year, items]) => {
        // Further segment by subsection if helpful
        const journals = items.filter((p) => p.category === "journalArticles");
        const proceedings = items.filter((p) => p.category === "conferenceProceedings");
        const abstracts = items.filter((p) => p.category === "extendedAbstracts");
        const artifacts = items.filter((p) => p.category === "researchArtifacts");

        let runIdx = 0;

        return (
          <section
            key={year}
            data-section={`pub-${year}`}
            data-section-label={year}
            className="border-b border-border last:border-b-0"
          >
            <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
              {/* Year header — consistent with homepage section headers */}
              <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    {year}
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground">
                    {publications.sectionTitleTemplate || "Publications"}
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold tabular-nums text-primary">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {/* Subsection: Journal Articles */}
              {journals.length > 0 && (
                <div className="mb-10 last:mb-0">
                  <div className="mb-4 flex items-center justify-between gap-3 border-l-2 border-primary pl-3">
                    <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                      {publications.subsectionTitles?.journalArticles || "Journal Articles"}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {journals.length}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {journals.map((pub) => {
                      const idx = runIdx++;
                      return (
                        <PublicationCard
                          key={pub.id ?? `journal-${idx}`}
                          pub={pub}
                          index={idx}
                          year={year}
                          awardBadgeLabel={publications.awardBadgeLabel ?? "Award"}
                          doiPrefix={publications.doiPrefix ?? "doi:"}
                          viewPaperLabel={publications.viewPaperLabel ?? "View paper"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subsection: Conference Proceedings */}
              {proceedings.length > 0 && (
                <div className="mb-10 last:mb-0">
                  <div className="mb-4 flex items-center justify-between gap-3 border-l-2 border-primary pl-3">
                    <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                      {publications.subsectionTitles?.conferenceProceedings || "Conference Proceedings"}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {proceedings.length}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {proceedings.map((pub) => {
                      const idx = runIdx++;
                      return (
                        <PublicationCard
                          key={pub.id ?? `conf-${idx}`}
                          pub={pub}
                          index={idx}
                          year={year}
                          awardBadgeLabel={publications.awardBadgeLabel ?? "Award"}
                          doiPrefix={publications.doiPrefix ?? "doi:"}
                          viewPaperLabel={publications.viewPaperLabel ?? "View paper"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subsection: Extended Abstracts */}
              {abstracts.length > 0 && (
                <div className="mb-10 last:mb-0">
                  <div className="mb-4 flex items-center justify-between gap-3 border-l-2 border-primary/50 pl-3">
                    <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                      {publications.subsectionTitles?.extendedAbstracts || "Extended Abstracts"}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {abstracts.length}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {abstracts.map((pub) => {
                      const idx = runIdx++;
                      return (
                        <PublicationCard
                          key={pub.id ?? `abstract-${idx}`}
                          pub={pub}
                          index={idx}
                          year={year}
                          awardBadgeLabel={publications.awardBadgeLabel ?? "Award"}
                          doiPrefix={publications.doiPrefix ?? "doi:"}
                          viewPaperLabel={publications.viewPaperLabel ?? "View paper"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subsection: Research Artifacts */}
              {artifacts.length > 0 && (
                <div className="mb-10 last:mb-0">
                  <div className="mb-4 flex items-center justify-between gap-3 border-l-2 border-primary/50 pl-3">
                    <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                      {publications.subsectionTitles?.researchArtifacts || "Research Artifacts"}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {artifacts.length}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {artifacts.map((pub) => {
                      const idx = runIdx++;
                      return (
                        <PublicationCard
                          key={pub.id ?? `artifact-${idx}`}
                          pub={pub}
                          index={idx}
                          year={year}
                          awardBadgeLabel={publications.awardBadgeLabel ?? "Award"}
                          doiPrefix={publications.doiPrefix ?? "doi:"}
                          viewPaperLabel={publications.viewPaperLabel ?? "View paper"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ── Empty state when filters return nothing ── */}
      {filteredItems.length === 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Filter className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No publications found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No papers matched your search criteria or filter combinations.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="size-3.5" />
            Reset all filters
          </button>
        </section>
      )}
    </main>
  );
}
