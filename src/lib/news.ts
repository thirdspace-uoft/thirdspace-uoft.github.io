import { getContent } from "@/lib/content";

export type NewsItem = {
  id?: string;
  title?: string;
  /** "YYYY-MM" or "YYYY-MM-DD". Imported items only know their month. */
  date?: string;
  excerpt?: string;
  /** Source or category, shown as muted meta in the detail card. */
  tag?: string;
  url?: string;
  imagePath?: string;
  imageAlt?: string;
  highlight?: boolean;
  highlightLabel?: string;
};

export type NewsContent = {
  headline?: string;
  subhead?: string;
  maxToShow?: number;
  emptyLabel?: string;
  seeAllLabel?: string;
  openLinkLabel?: string;
  placeholderImagePath?: string;
  page?: {
    title?: string;
    subhead?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  filters?: NewsFilterLabels;
  items?: NewsItem[];
};

/** Copy for the /news filter bar. */
export type NewsFilterLabels = {
  searchPlaceholder?: string;
  allYearsLabel?: string;
  allSourcesLabel?: string;
  yearLabel?: string;
  sourceLabel?: string;
  filtersLabel?: string;
  highlightsLabel?: string;
  quickLabel?: string;
  /** Each chip filters titles containing that word ("Talk" also matches "Talks"). */
  quickKeywords?: string[];
  showingLabel?: string;
  ofLabel?: string;
  resetLabel?: string;
  noResultsTitle?: string;
  noResultsText?: string;
  resetAllLabel?: string;
};

/**
 * `content.json` is generated from Firestore, so its inferred type only has
 * the `news` fields the live document happens to contain right now.
 */
export function getNews(): NewsContent {
  return ((getContent() as { news?: NewsContent }).news ?? {}) as NewsContent;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Parsed by hand rather than with `new Date()`: "2026-04" parses as UTC
 * midnight, which renders as March in any timezone west of Greenwich.
 */
export function parseNewsDate(date?: string): { year: number; month: number } | null {
  const match = String(date ?? "").match(/^(\d{4})-(\d{1,2})/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(match[1]), month };
}

/** "2026-04" → "Apr '26". */
export function formatNewsMonth(date?: string): string {
  const parsed = parseNewsDate(date);
  if (!parsed) return "";
  return `${MONTHS[parsed.month - 1]} '${String(parsed.year).slice(-2)}`;
}

/** Newest first. Stable, so items sharing a month keep their stored order. */
export function sortNews(items: NewsItem[]): NewsItem[] {
  return items
    .map((item, index) => ({ item, index, key: String(item.date ?? "") }))
    .sort((a, b) => (a.key === b.key ? a.index - b.index : a.key < b.key ? 1 : -1))
    .map(({ item }) => item);
}

/** Sorted items grouped under their year, newest year first. Undated items are dropped. */
export function groupNewsByYear(items: NewsItem[]): [string, NewsItem[]][] {
  const groups = new Map<string, NewsItem[]>();
  for (const item of sortNews(items)) {
    const parsed = parseNewsDate(item.date);
    if (!parsed) continue;
    const year = String(parsed.year);
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return [...groups.entries()];
}
