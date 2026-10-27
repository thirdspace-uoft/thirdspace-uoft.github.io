// Build-time details for a post's resources: GitHub repo stats, video
// thumbnails and titles, paper metadata and BibTeX.
//
// Everything here is best effort. A failed lookup falls back to the last
// cached answer, or to the resource exactly as the editor typed it; it never
// fails the build. Results go into src/generated/posts.json only, never back
// to Firestore, so what the editor typed stays the source of truth.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const DAY = 24 * 60 * 60 * 1000;
const USER_AGENT = "thirdspace-site-build (https://thirdspace-uoft.github.io)";

// ── URL helpers ──────────────────────────────────────────────────────────────

const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
const GITHUB = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i;
const ARXIV = /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(?:v\d+)?/i;
const DOI = /(?:doi\.org\/|^)(10\.\d{4,9}\/[^\s?#]+)/i;

export const youtubeId = (url = "") => url.match(YOUTUBE)?.[1] ?? null;
export const vimeoId = (url = "") => url.match(VIMEO)?.[1] ?? null;
export const arxivIdFrom = (url = "") => url.match(ARXIV)?.[1] ?? null;
export const doiFrom = (value = "") => value.match(DOI)?.[1]?.replace(/[.,;]+$/, "") ?? null;

export function githubRepo(url = "") {
  const m = url.match(GITHUB);
  if (!m) return null;
  // Paths that look like owner/repo but aren't repositories.
  if (["orgs", "users", "topics", "sponsors", "settings", "features"].includes(m[1].toLowerCase())) return null;
  return { owner: m[1], repo: m[2] };
}

export function videoProvider(url = "") {
  if (youtubeId(url)) return "youtube";
  if (vimeoId(url)) return "vimeo";
  // Relative paths are ImageKit uploads, like every other media file on the site.
  if (!/^https?:\/\//i.test(url) || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "imagekit";
  return "other";
}

/** Best guess at a resource's kind from its URL; the editor can override it. */
export function detectKind(url = "") {
  const u = url.toLowerCase();
  if (/huggingface\.co\/spaces\//.test(u)) return "demo";
  if (/huggingface\.co\/datasets\/|zenodo\.org|osf\.io|kaggle\.com\/datasets|dataverse/.test(u)) return "dataset";
  if (/github\.com\/|gitlab\.com\/|huggingface\.co\//.test(u)) return "code";
  if (/doi\.org\/|arxiv\.org\/|aclanthology\.org\/|dl\.acm\.org\/|ieeexplore\.ieee\.org|openreview\.net/.test(u)) return "paper";
  if (YOUTUBE.test(url) || VIMEO.test(url) || /\.(mp4|webm|mov)(\?|$)/.test(u)) return "video";
  if (/\.pdf(\?|$)/.test(u)) return "paper";
  return "link";
}

// ── Paper metadata ───────────────────────────────────────────────────────────

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const squash = (s) => decodeXml(s).replace(/\s+/g, " ").trim();

/** The first entry of an arXiv API Atom response → paper fields. */
export function parseArxivAtom(xml) {
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) return null;
  const title = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
  // arXiv answers an unknown id with an entry titled "Error".
  if (!title || squash(title) === "Error") return null;
  const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((m) => squash(m[1]));
  const year = entry.match(/<published>(\d{4})/)?.[1];
  return { title: squash(title), authors: authors.join(", "), year };
}

/** A Crossref /works/<doi> response → paper fields. */
export function fromCrossref(json) {
  const w = json?.message;
  if (!w) return null;
  const authors = (w.author ?? [])
    .map((a) => [a.given, a.family].filter(Boolean).join(" ") || a.name)
    .filter(Boolean);
  const year = (w.issued ?? w.published ?? w["published-print"] ?? w["published-online"])?.["date-parts"]?.[0]?.[0];
  return {
    title: w.title?.[0] ? squash(w.title[0]) : undefined,
    authors: authors.length ? authors.join(", ") : undefined,
    venue: w["container-title"]?.[0] ?? w.event?.name,
    year: year ? String(year) : undefined,
  };
}

const CONFERENCE = /\b(chi|cscw|acl|emnlp|naacl|eacl|facct|dis|aaai|www|ictd|compass|ecir|icwsm|neurips|icml|iclr|conference|proceedings|symposium|workshop)\b/i;

/** "Cohabitant: The Design…" → "cohabitant" */
function firstWord(title = "") {
  const stop = new Set(["a", "an", "the", "on", "of", "in", "for", "and", "to"]);
  return (
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .find((w) => w && !stop.has(w)) ?? "paper"
  );
}

/** Braces and backslashes would break the entry; strip them rather than escape. */
const bib = (s = "") => String(s).replace(/[{}\\]/g, "").trim();

/** A BibTeX entry from a paper resource's fields. Empty fields are left out. */
export function bibtexFor(r) {
  const authorList = (r.authors ?? "").split(/,\s*/).filter(Boolean);
  const family = (authorList[0] ?? "anon").split(/\s+/).pop().normalize("NFKD").replace(/[^A-Za-z]/g, "").toLowerCase();
  const key = `${family || "anon"}${r.year ?? ""}${firstWord(r.title)}`;
  const arxivOnly = !r.doi && r.arxivId;
  const type = arxivOnly ? "misc" : CONFERENCE.test(r.venue ?? "") ? "inproceedings" : "article";
  const fields = [
    ["title", `{${bib(r.title)}}`],
    ["author", bib(authorList.join(" and "))],
    [type === "inproceedings" ? "booktitle" : "journal", type === "misc" ? "" : bib(r.venue)],
    ["year", bib(r.year)],
    ["doi", bib(r.doi)],
    ["eprint", arxivOnly ? bib(r.arxivId) : ""],
    ["archivePrefix", arxivOnly ? "arXiv" : ""],
    ["url", bib(r.doi ? `https://doi.org/${r.doi}` : r.url)],
  ].filter(([, v]) => v && v !== "{}");
  // The title gets double braces so BibTeX styles keep its capitalisation.
  return `@${type}{${key},\n${fields.map(([k, v]) => `  ${k} = {${v}}`).join(",\n")}\n}`;
}

// ── Cache ────────────────────────────────────────────────────────────────────

export function loadCache(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

export function saveCache(path, cache) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * Runs `load` for `key` unless a fresh (≤ 1 day) answer is cached. On failure,
 * or when the network is off, returns whatever is cached however old, else null.
 */
async function lookup(key, load, ctx) {
  const hit = ctx.cache[key];
  if (hit && (ctx.offline || ctx.now - hit.at < DAY)) return hit.data;
  if (ctx.offline) return null;
  try {
    const data = await load();
    if (data) ctx.cache[key] = { at: ctx.now, data };
    return data ?? hit?.data ?? null;
  } catch (err) {
    ctx.log(`  ${key}: ${err.message}${hit ? " (using cached copy)" : ""}`);
    return hit?.data ?? null;
  }
}

async function getJson(ctx, url, headers = {}) {
  const res = await ctx.fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getText(ctx, url) {
  const res = await ctx.fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── Per-kind enrichment ──────────────────────────────────────────────────────

async function enrichCode(r, ctx) {
  const gh = githubRepo(r.url);
  if (!gh) return r;
  const repo = await lookup(
    `github:${gh.owner}/${gh.repo}`.toLowerCase(),
    async () => {
      const auth = ctx.githubToken ? { Authorization: `Bearer ${ctx.githubToken}` } : {};
      const d = await getJson(ctx, `https://api.github.com/repos/${gh.owner}/${gh.repo}`, {
        Accept: "application/vnd.github+json",
        ...auth,
      });
      return {
        fullName: d.full_name,
        description: d.description ?? undefined,
        stars: d.stargazers_count,
        language: d.language ?? undefined,
        license: d.license && d.license.spdx_id !== "NOASSERTION" ? d.license.spdx_id : undefined,
        updatedAt: d.pushed_at ?? d.updated_at,
      };
    },
    ctx,
  );
  return {
    ...r,
    title: r.title || repo?.fullName || `${gh.owner}/${gh.repo}`,
    repo: repo ?? { fullName: `${gh.owner}/${gh.repo}` },
  };
}

async function enrichVideo(r, ctx) {
  const provider = r.provider ?? videoProvider(r.url);
  const out = { ...r, provider };
  if (provider === "youtube") {
    const id = youtubeId(r.url);
    out.thumbnail ||= `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    if (!r.title) {
      const o = await lookup(
        `youtube:${id}`,
        () => getJson(ctx, `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`),
        ctx,
      );
      out.title = o?.title ?? "";
      if (o?.author_name) out.channel = o.author_name;
    }
  } else if (provider === "vimeo") {
    const id = vimeoId(r.url);
    const o = await lookup(
      `vimeo:${id}`,
      () => getJson(ctx, `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${id}`)}`),
      ctx,
    );
    if (o) {
      out.title ||= o.title ?? "";
      out.thumbnail ||= o.thumbnail_url;
      out.durationSeconds ??= o.duration;
      if (o.author_name) out.channel = o.author_name;
    }
  }
  return out;
}

async function enrichPaper(r, ctx) {
  const out = { ...r };
  out.doi ||= doiFrom(r.url) ?? undefined;
  out.arxivId ||= arxivIdFrom(r.url) ?? arxivIdFrom(r.pdfUrl) ?? undefined;
  const missing = !out.title || !out.authors || !out.year || !out.venue;

  let meta = null;
  if (missing && out.doi) {
    meta = await lookup(`crossref:${out.doi.toLowerCase()}`, async () => fromCrossref(await getJson(ctx, `https://api.crossref.org/works/${encodeURIComponent(out.doi)}`)), ctx);
  } else if (missing && out.arxivId) {
    meta = await lookup(`arxiv:${out.arxivId}`, async () => parseArxivAtom(await getText(ctx, `https://export.arxiv.org/api/query?id_list=${out.arxivId}`)), ctx);
    if (meta) meta.venue = "arXiv";
  }
  if (meta) {
    for (const field of ["title", "authors", "venue", "year"]) {
      if (!out[field] && meta[field]) out[field] = meta[field];
    }
  }
  if (out.arxivId) out.pdfUrl ||= `https://arxiv.org/pdf/${out.arxivId}`;
  out.title ||= out.url;
  out.bibtex ||= bibtexFor(out);
  return out;
}

export async function enrichResource(r, ctx) {
  try {
    if (r.kind === "code") return await enrichCode(r, ctx);
    if (r.kind === "video" || (r.kind === "demo" && detectKind(r.url) === "video")) return await enrichVideo(r, ctx);
    if (r.kind === "paper") return await enrichPaper(r, ctx);
  } catch (err) {
    ctx.log(`  ${r.url}: ${err.message}`);
  }
  return r;
}

/**
 * Every post with its resources enriched. `offline` (SKIP_ENRICHMENT=1) still
 * derives what needs no network (YouTube thumbnails, BibTeX) and uses cached
 * answers, but makes no requests.
 */
export async function enrichPosts(posts, { cachePath, githubToken, offline = false, fetch = globalThis.fetch, log = console.log, now = Date.now() } = {}) {
  const ctx = { cache: cachePath ? loadCache(cachePath) : {}, githubToken, offline, fetch, log, now };
  const out = [];
  for (const post of posts) {
    const resources = [];
    for (const r of post.resources ?? []) resources.push(await enrichResource(r, ctx));
    out.push(post.resources ? { ...post, resources } : post);
  }
  if (cachePath) saveCache(cachePath, ctx.cache);
  return out;
}
