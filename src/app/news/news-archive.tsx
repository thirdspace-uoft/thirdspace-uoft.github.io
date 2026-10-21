"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Filter, RotateCcw, Search, Trophy, X } from "lucide-react";

import { NewsList } from "@/components/news-list";
import { groupNewsByYear, parseNewsDate, type NewsContent, type NewsItem } from "@/lib/news";

function matchesQuery(item: NewsItem, query: string) {
  return [item.title, item.excerpt, item.tag, item.highlightLabel].some((v) =>
    String(v ?? "").toLowerCase().includes(query),
  );
}

/**
 * The /news year list with the same sticky filter bar as /publications:
 * search, year, source, an award toggle (highlighted items) and quick keyword
 * chips. Years stay as `data-section` blocks so the side rail keeps working.
 */
export function NewsArchive({ news }: { news: NewsContent }) {
  const allItems = useMemo(() => news.items ?? [], [news.items]);
  const labels = news.filters ?? {};

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [onlyHighlights, setOnlyHighlights] = useState(false);
  const [quickKeyword, setQuickKeyword] = useState("");
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  const yearOptions = useMemo(() => groupNewsByYear(allItems).map(([year]) => year), [allItems]);

  const sourceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allItems) {
      if (item.tag) counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const keyword = quickKeyword.toLowerCase();
    return allItems.filter((item) => {
      if (query && !matchesQuery(item, query)) return false;
      if (selectedYear !== "all" && String(parseNewsDate(item.date)?.year) !== selectedYear) return false;
      if (selectedSource !== "all" && item.tag !== selectedSource) return false;
      if (onlyHighlights && !item.highlight) return false;
      if (keyword && !String(item.title ?? "").toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [allItems, searchQuery, selectedYear, selectedSource, onlyHighlights, quickKeyword]);

  const years = useMemo(() => groupNewsByYear(filteredItems), [filteredItems]);

  const activeFilterCount =
    (selectedYear !== "all" ? 1 : 0) +
    (selectedSource !== "all" ? 1 : 0) +
    (onlyHighlights ? 1 : 0) +
    (quickKeyword ? 1 : 0);
  const isFiltered = searchQuery.trim() !== "" || activeFilterCount > 0;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
    setSelectedSource("all");
    setOnlyHighlights(false);
    setQuickKeyword("");
  };

  const selectClass =
    "h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
  const mobileSelectClass =
    "h-9 w-full appearance-none rounded-lg border border-input bg-card pl-2.5 pr-7 text-xs font-medium text-foreground";

  const highlightToggle = (
    <button
      type="button"
      onClick={() => setOnlyHighlights(!onlyHighlights)}
      aria-pressed={onlyHighlights}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
        onlyHighlights
          ? "border-accent bg-accent/20 text-accent-foreground shadow-xs font-semibold"
          : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
      }`}
    >
      <Trophy className="size-3 text-accent" />
      <span>{labels.highlightsLabel}</span>
      {onlyHighlights && <Check className="size-3 text-accent-foreground" />}
    </button>
  );

  const quickChips = (labels.quickKeywords ?? []).map((word) => (
    <button
      key={word}
      type="button"
      onClick={() => setQuickKeyword(quickKeyword === word ? "" : word)}
      aria-pressed={quickKeyword === word}
      className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium transition-colors ${
        quickKeyword === word
          ? "bg-primary text-primary-foreground"
          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {word}
    </button>
  ));

  const counter = (
    <span>
      {labels.showingLabel} <strong className="text-foreground">{filteredItems.length}</strong>{" "}
      {labels.ofLabel} {allItems.length}
    </span>
  );

  return (
    <>
      {/* ── FILTER BAR ── mirrors /publications: sticky, collapsible on mobile.
          Off unless news.filters.show is set (admin → News → Filter Bar). */}
      {labels.show && (
        <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto w-full max-w-6xl px-4 py-2.5 sm:px-8 sm:py-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={labels.searchPlaceholder}
                    aria-label={labels.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={labels.resetLabel}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all sm:hidden ${
                    mobileFiltersExpanded || activeFilterCount > 0
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-input bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  aria-expanded={mobileFiltersExpanded}
                >
                  <Filter className="size-3.5" />
                  <span>{labels.filtersLabel}</span>
                  {activeFilterCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative hidden w-32 shrink-0 sm:block lg:w-36">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    aria-label={labels.yearLabel}
                    className={selectClass}
                  >
                    <option value="all">{labels.allYearsLabel}</option>
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>

                {sourceOptions.length > 0 && (
                  <div className="relative hidden w-44 shrink-0 sm:block lg:w-56">
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      aria-label={labels.sourceLabel}
                      className={selectClass}
                    >
                      <option value="all">{labels.allSourcesLabel}</option>
                      {sourceOptions.map(([source, count]) => (
                        <option key={source} value={source}>
                          {source} ({count})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                )}
              </div>

              {mobileFiltersExpanded && (
                <div className="grid grid-cols-1 gap-2 border-t border-border/60 pt-2.5 sm:hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.yearLabel}
                      </label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className={mobileSelectClass}>
                        <option value="all">{labels.allYearsLabel}</option>
                        {yearOptions.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute bottom-2.5 right-2 size-3 text-muted-foreground" />
                    </div>
                    {sourceOptions.length > 0 && (
                      <div className="relative">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {labels.sourceLabel}
                        </label>
                        <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className={mobileSelectClass}>
                          <option value="all">{labels.allSourcesLabel}</option>
                          {sourceOptions.map(([source, count]) => (
                            <option key={source} value={source}>
                              {source} ({count})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute bottom-2.5 right-2 size-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {highlightToggle}
                    {quickChips}
                  </div>
                </div>
              )}

              <div className="hidden flex-wrap items-center justify-between gap-2 text-xs sm:flex">
                <div className="flex flex-wrap items-center gap-2">
                  {highlightToggle}
                  {quickChips.length > 0 && (
                    <>
                      <span className="text-muted-foreground/60">|</span>
                      <span className="font-mono text-[11px] text-muted-foreground/70">{labels.quickLabel}</span>
                      {quickChips}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  {counter}
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <RotateCcw className="size-3" />
                      <span>{labels.resetLabel}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground sm:hidden">
                {counter}
                {isFiltered && (
                  <button type="button" onClick={resetFilters} className="font-medium text-primary">
                    {labels.resetLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {years.map(([year, items]) => (
        <section
          key={year}
          data-section={`news-${year}`}
          data-section-label={year}
          className="border-b border-border last:border-b-0"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{year}</h2>
            <NewsList
              items={items}
              openLinkLabel={news.openLinkLabel}
            />
          </div>
        </section>
      ))}

      {allItems.length > 0 && filteredItems.length === 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Filter className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{labels.noResultsTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{labels.noResultsText}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="size-3.5" />
            {labels.resetAllLabel}
          </button>
        </section>
      )}
    </>
  );
}
