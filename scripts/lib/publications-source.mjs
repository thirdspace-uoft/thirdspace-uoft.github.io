/**
 * Parser for the publication list at ishtiaque.net/writing.
 *
 * The page is a Wix site, but the content is server-rendered into the static
 * HTML, so it can be read without executing anything. The shape is regular:
 * each entry is a bold `<li>` holding the title, followed by sibling
 * paragraphs for the authors, the venue, and sometimes an award.
 *
 * No HTML-parser dependency on purpose — this runs in CI on every deploy, and
 * `npm ci` is already the slowest part of the job. The extraction below is
 * deliberately narrow (it only ever looks at the two structural markers the
 * page uses) and is guarded by `assertSaneEntryCount`, so a markup change
 * fails loudly instead of quietly reporting zero new papers.
 */

const DEFAULT_SOURCE_URL = "https://www.ishtiaque.net/writing";

/** Wix pads many paragraphs with a zero-width space; it is never meaningful. */
const ZERO_WIDTH = /[\u200B\u200D\uFEFF]/g;

/**
 * A real browser UA. Wix serves a smaller, content-poor response to obvious
 * crawlers (a Googlebot UA loses entries that the default UA receives), so
 * identifying honestly as a browser is both accurate and necessary here.
 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0 Safari/537.36";

/**
 * The floor for "the page still looks like a publication list". The live page
 * has 192 entries. A Wix redesign, a bot-challenge interstitial, or a truncated
 * response would all drop this far lower — and acting on a partial parse would
 * mean marking real papers as deleted, so the caller must abort instead.
 */
const MIN_ENTRY_COUNT = 150;

/** Drop by more than this fraction versus the previous run and something is wrong. */
const MAX_DROP_RATIO = 0.2;

/**
 * Entries are introduced by one of three `<ul>` style strings depending on the
 * year band Wix rendered them under — the `font-weight` and `font-size`
 * declarations even appear in a different order between them. Matching the
 * stable prefix covers all three without enumerating them.
 */
const ENTRY_UL = /<ul class="font_8 wixui-rich-text__text" style="[^"]*forum,serif[^"]*"/g;

/** The bold list item that holds a title. */
const TITLE_LI = /<li class="wixui-rich-text__text">([\s\S]*?)<\/li>/g;

/** Award paragraphs are wrapped in this Wix theme colour token. */
const AWARD_MARKER = /class="color_41\b/;

/**
 * Decodes the HTML entities the page actually uses. Done before any
 * normalisation: `&nbsp;` would otherwise survive as the literal word "nbsp"
 * and break title matching.
 */
export function decodeEntities(input) {
  return input
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Strips tags and collapses whitespace — turns a fragment into plain text. */
function toText(fragment) {
  return decodeEntities(String(fragment).replace(/<[^>]+>/g, " "))
    .replace(ZERO_WIDTH, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Awards come in inconsistent forms — "…Award" and "…Award!" are the same award,
 * and splitting them would fragment the site into two near-identical badges.
 */
function normaliseAward(text) {
  return text.replace(/[!\s]+$/, "").trim();
}

const AWARD_PATTERN =
  /\b(best paper honorable mention|best paper award|honorable mention|diversity and inclusion)[\s\S]*$/i;

/**
 * Reads the fields that follow a title. They arrive in a fixed order — authors,
 * then venue, then an optional award — but the award is identified by its
 * colour marker rather than by position, because a venue line is occasionally
 * missing and the award then shifts up a slot.
 */
function readEntryFields(segment) {
  const paragraphs = [...segment.matchAll(/<p class="font_8 wixui-rich-text__text"[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => ({ text: toText(m[1]), isAward: AWARD_MARKER.test(m[0]) }))
    .filter((p) => p.text.length > 0);

  const awardParagraph = paragraphs.find((p) => p.isAward);
  let award = awardParagraph?.text ?? null;

  if (!award) {
    // Fall back to matching the award wording when the colour marker is absent.
    const match = paragraphs.find((p) => AWARD_PATTERN.test(p.text));
    if (match) {
      award = match.text;
      match.consumed = true;
    }
  }

  const remaining = paragraphs.filter((p) => p !== awardParagraph && !p.consumed);
  const authors = remaining[0]?.text ?? "";
  // The venue is whatever follows the authors and is not the award line.
  const venue = remaining[1]?.text ?? "";

  return { authors, venue, award: award ? normaliseAward(award) : null };
}

/**
 * The section heading groups entries by year, but it is not trustworthy: 21
 * entries sit under a heading that disagrees with the year in their own venue
 * string (2021 papers filed under a "2022" heading). The venue is corrected
 * curation, so it wins; the heading is only a fallback for the 14 entries whose
 * venue line carries no year at all.
 */
export function resolveYear(venue, headingYear) {
  const fromVenue = String(venue ?? "").match(/\b(19|20)\d{2}\b/);
  if (fromVenue) return Number(fromVenue[0]);
  return headingYear ? Number(headingYear) : null;
}

/** Strips the trailing "[ PDF ]" marker. It links a preprint, not the paper. */
function cleanTitle(text) {
  return text.replace(/\s*\[\s*PDF\s*\]\s*$/i, "").trim();
}

/**
 * Parses the writing page into publication entries.
 *
 * Entries come back in document order with a `year` resolved from the venue
 * where possible. Order is preserved because it reflects how the author groups
 * their own work, and new entries are appended to the end of their year bucket.
 */
export function parseEntries(html) {
  const entries = [];
  let headingYear = null;

  const chunks = html.split(ENTRY_UL);

  // The first chunk is everything before the first entry — its heading applies
  // to nothing, so it is skipped rather than parsed.
  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const nextHeading = chunk.match(/>\s*(19|20)\d{2}\s*</);
    if (nextHeading) headingYear = nextHeading[0].replace(/[<>]/g, "").trim();

    const titles = [...chunk.matchAll(TITLE_LI)];
    for (const titleMatch of titles) {
      const title = cleanTitle(toText(titleMatch[1]));
      if (!title) continue;

      const after = chunk.slice(titleMatch.index + titleMatch[0].length);
      const nextTitle = after.search(TITLE_LI);
      const segment = nextTitle >= 0 ? after.slice(0, nextTitle) : after;

      const { authors, venue, award } = readEntryFields(segment);
      const year = resolveYear(venue, headingYear);
      if (!year) continue;

      entries.push({ title, authors, venue, award, year });
    }
  }

  return entries;
}

/**
 * Guards against acting on a broken parse. A redesign, an interstitial, or a
 * truncated response all surface here rather than as a wave of false
 * "deleted" papers.
 */
export function assertSaneEntryCount(entries, previousCount) {
  const count = entries.length;
  if (count < MIN_ENTRY_COUNT) {
    throw new Error(
      `Refusing to continue: parsed only ${count} entries from the source page ` +
        `(minimum ${MIN_ENTRY_COUNT}). The page layout has probably changed.`,
    );
  }
  if (previousCount && count < previousCount * (1 - MAX_DROP_RATIO)) {
    throw new Error(
      `Refusing to continue: parsed ${count} entries, down from ${previousCount} ` +
        `last run (more than ${Math.round(MAX_DROP_RATIO * 100)}% drop).`,
    );
  }
  return count;
}

/**
 * Canonical form of a title, used only for matching — never for display.
 *
 * Curly and straight quotes collapse together and hyphens read as spaces, so a
 * paper titled with typographic punctuation on the source still matches the
 * plain-ASCII copy already in Firestore.
 *
 * Hyphens are deleted rather than treated as separators. The same paper appears
 * hyphenated on the source and unhyphenated in Firestore \u2014 "Open- StreetMap"
 * (itself broken across a soft wrap) against "OpenStreetMap" \u2014 and collapsing a
 * hyphen to a space would leave those two permanently unequal, so the paper
 * would read as new on every run and be inserted twice. Deleting it makes both
 * spellings converge on the same key.
 */
export function normaliseTitle(title) {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s\u2010-\u2015-]+/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Builds a record id that cannot collide with the existing ones.
 *
 * Every id in Firestore is `<year>-<slug>` and starts with its year bucket —
 * a convention with no exceptions across all 187 records. Matching it keeps the
 * auto-generated ids indistinguishable from hand-written ones.
 *
 * Deterministic: the same title always yields the same id, so re-running the
 * sync cannot create a second copy of a paper it already added.
 *
 * Slugging is deliberately separate from `normaliseTitle`. That function erases
 * hyphens and spaces so the same paper matches however it happens to be spelled;
 * reusing it here would produce run-together ids like
 * `2026-evaluatingsecondorderbiasofllms`. Ids want word boundaries preserved,
 * matching wants them removed — so this walks the words itself.
 */
export function makeId(year, title, existingIds = new Set()) {
  const words = String(title ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const base = `${year}-${words.slice(0, 6).join("-") || "publication"}`;

  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

/** Fetches the writing page. Throws on a non-200 or an empty body. */
export async function fetchWritingHtml({
  url = DEFAULT_SOURCE_URL,
  timeoutMs = 30_000,
  userAgent = BROWSER_UA,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": userAgent, Accept: "text/html" },
    });
    if (!response.ok) {
      throw new Error(`Source page returned HTTP ${response.status}`);
    }
    const html = await response.text();
    if (!html || html.length < 50_000) {
      throw new Error(
        `Source page returned only ${html?.length ?? 0} bytes — likely an error or challenge page.`,
      );
    }
    return html;
  } finally {
    clearTimeout(timer);
  }
}
