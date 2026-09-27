/**
 * Optional paper-link lookup for newly discovered publications.
 *
 * The source page carries no per-paper links, so a URL has to come from
 * somewhere else. That turns out to be the sharpest edge in this whole
 * pipeline, because scholarly search APIs answer confidently whether or not
 * they are right. Measured against the three real unpublished papers:
 *
 *   Crossref          "Epistemic Entitlement" → a 2020 philosophy book chapter
 *   Semantic Scholar  "…Diffused Surveillance" → a measles vaccination paper
 *   DBLP              unusable: returns an anti-bot HTML challenge with HTTP 200
 *   OpenAlex          both titles found — but as arXiv and Zenodo preprints
 *
 * So a "paste the top hit" approach puts wrong links on a live research site,
 * and even a correct title match can still be the wrong *version* of the paper.
 * Everything here is therefore built to refuse rather than to guess: a record is
 * only linked when a candidate clears every check in `confidenceGate`, and
 * anything short of that is reported for a human to resolve in /admin.
 *
 * Every failure mode is non-fatal. A sync that cannot reach the network should
 * still add the paper, just without a link.
 */

import { normaliseTitle } from "./publications-source.mjs";

const OPENALEX_ENDPOINT = "https://api.openalex.org/works";
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Hosts that serve a preprint rather than the version of record. A preprint is
 * a real and citable artefact, but it is not what a publications page means by
 * a paper, and it is very often superseded. These are surfaced to a human
 * instead of being auto-attached.
 */
const PREPRINT_HOSTS = [
  "arxiv.org",
  "zenodo.org",
  "osf.io",
  "biorxiv.org",
  "medrxiv.org",
  "ssrn.com",
  "researchsquare.com",
  "preprints.org",
  "chemrxiv.org",
  "psyarxiv.com",
  "techrxiv.org",
  "authorea.com",
];

/** DOI prefixes owned by preprint servers, for the same reason. */
const PREPRINT_DOI_PREFIXES = ["10.48550/", "10.5281/zenodo", "10.31234/", "10.1101/"];

function isPreprint(url, doi) {
  if (doi && PREPRINT_DOI_PREFIXES.some((prefix) => doi.startsWith(prefix))) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PREPRINT_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`));
  } catch {
    return true; // An unparseable URL is not something to publish.
  }
}

/** Last token of a comma-separated name — "Terry Jingchen Zhang" → "zhang". */
function surnameOf(author) {
  const parts = String(author ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  return (parts.at(-1) ?? "").toLowerCase();
}

function authorSurnames(authors) {
  return new Set(
    String(authors ?? "")
      .split(",")
      .map(surnameOf)
      .filter(Boolean),
  );
}

/**
 * Decides whether a search hit may be published as this paper's link.
 *
 * All four checks must pass. They are deliberately conjunctive: each one alone
 * would let a wrong link through, and the observed failure mode of these APIs
 * is a topically-similar paper by different authors, which a title-only check
 * would happily accept.
 */
export function confidenceGate(candidate, entry) {
  if (!candidate?.url) {
    return { accepted: false, reason: "No usable link on the candidate." };
  }

  if (normaliseTitle(candidate.title) !== normaliseTitle(entry.title)) {
    return {
      accepted: false,
      reason: "Title does not match exactly after normalisation.",
      candidate,
    };
  }

  const wanted = authorSurnames(entry.authors);
  const found = authorSurnames(candidate.authors);
  const shared = [...wanted].filter((s) => found.has(s));
  if (shared.length === 0) {
    return {
      accepted: false,
      reason: "No author surname in common — likely a different paper on a similar topic.",
      candidate,
    };
  }

  if (Number(candidate.year) !== Number(entry.year)) {
    return {
      accepted: false,
      reason: `Year differs (source ${entry.year}, found ${candidate.year}).`,
      candidate,
    };
  }

  if (isPreprint(candidate.url, candidate.doi)) {
    return {
      accepted: false,
      reason: "Match is a preprint, not the published version.",
      candidate,
    };
  }

  return { accepted: true, reason: null, candidate };
}

async function searchOpenAlex(entry, { mailto, timeoutMs }) {
  const url = new URL(OPENALEX_ENDPOINT);
  url.searchParams.set("search", entry.title);
  url.searchParams.set("per-page", "5");
  // OpenAlex gives faster, more reliable responses to requests that identify
  // themselves; it is the polite pool, not a paid tier.
  if (mailto) url.searchParams.set("mailto", mailto);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`OpenAlex returned HTTP ${response.status}`);

  const payload = await response.json();
  if (!Array.isArray(payload?.results)) throw new Error("OpenAlex response had no results array");

  return payload.results.map((work) => ({
    title: work.title ?? work.display_name ?? "",
    year: work.publication_year ?? null,
    doi: work.doi ? String(work.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null,
    url: work.doi
      ? String(work.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, "https://doi.org/")
      : work.primary_location?.landing_page_url ?? null,
    authors: (work.authorships ?? [])
      .map((a) => a.author?.display_name)
      .filter(Boolean)
      .join(", "),
  }));
}

/**
 * Looks for a link for one publication.
 *
 * Returns `{ url, doi, candidates, rejections }` and never throws. A network
 * error, a timeout, a rate limit, or a malformed body all yield a `null` url
 * with the reason recorded — the paper still gets added, just without a link.
 */
export async function findPaperUrl(entry, options = {}) {
  const {
    mailto = process.env.OPENALEX_MAILTO,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    log = () => {},
  } = options;

  let hits;
  try {
    hits = await searchOpenAlex(entry, { mailto, timeoutMs });
  } catch (error) {
    log(`  ! lookup failed for "${entry.title}": ${error.message}`);
    return { url: null, doi: null, candidates: [], rejections: [], error: error.message };
  }

  const rejections = [];
  for (const candidate of hits) {
    const verdict = confidenceGate(candidate, entry);
    if (verdict.accepted) {
      return { url: verdict.candidate.url, doi: verdict.candidate.doi, candidates: hits, rejections };
    }
    rejections.push({ title: candidate.title, year: candidate.year, reason: verdict.reason });
  }

  return { url: null, doi: null, candidates: hits, rejections };
}
