/**
 * Adds publications from ishtiaque.net/writing to Firestore that are not
 * already there.
 *
 * The site is built from a single Firestore document, and `deploy.yml` polls
 * that document's `lastModified` on a cron — so writing here is enough to get a
 * change published; nothing else needs to be triggered.
 *
 * Two rules shape everything below:
 *
 *   Add-only. Existing records are never modified or removed. The source page
 *   is less accurate than the curated Firestore copy — it files 21 papers under
 *   the wrong year and carries at least one title broken across a soft wrap —
 *   so an overwrite pass would actively regress the site.
 *
 *   Never delete, never guess. A paper that disappears from the source is left
 *   alone; it is far more likely to be a markup change than a retraction.
 *
 * Usage:
 *   node scripts/sync-publications.mjs --dry-run     report only, writes nothing
 *   node scripts/sync-publications.mjs               add what is missing
 *   node scripts/sync-publications.mjs --from-file <path>   parse a saved page
 *   SKIP_ENRICHMENT=1 node scripts/sync-publications.mjs   skip link lookup
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import {
  assertSaneEntryCount,
  fetchWritingHtml,
  makeId,
  normaliseTitle,
  parseEntries,
} from "./lib/publications-source.mjs";
import { findPaperUrl } from "./lib/publications-enrich.mjs";

const BUCKETS = ["journalArticles", "conferenceProceedings", "extendedAbstracts", "researchArtifacts"];

/** Conferences this group publishes at, longest-first so "CHI" doesn't shadow "CSCW". */
const CONFERENCE_HINTS = [
  "ACL", "EMNLP", "NAACL", "CHI", "CSCW", "UIST", "AIES", "COMPASS", "ICWSM", "ICTD",
  "GROUP", "CSCW", "DEV", "IDC", "IUI", "HCI", "INTERACT", "AAMAS", "FLAIRS", "KR",
  "ICLR", "ICML", "NeurIPS", "USENIX", "SOUPS", "S&P", "CCS", "USENIX", "SEC", "WOOT",
  "MobileHCI", "Pervasive", "IUI", "ISS", "ICRA", "HRI", "FAccT", "FAT", "LAK",
];

/** Words that mark the shorter-form buckets. Checked before the conference list. */
const EXTENDED_HINTS = ["poster", "late-breaking", "companion", "workshop", "alt.", "doctoral consortium", "demo"];
const ARTIFACT_HINTS = ["thesis", "chapter", "monograph", "book", "dissertation"];
const JOURNAL_HINTS = ["journal", "transactions", "review", "magazine", "letters", "proceedings of the ieee"];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const SKIP_ENRICHMENT = args.has("--skip-enrichment") || process.env.SKIP_ENRICHMENT === "1";
const SOURCE_URL = process.env.PUBLICATIONS_SOURCE_URL ?? "https://www.ishtiaque.net/writing";

/** `--from-file` parses a saved copy of the page instead of fetching it. */
const fromFileIndex = process.argv.indexOf("--from-file");
const FROM_FILE = fromFileIndex >= 0 ? process.argv[fromFileIndex + 1] : null;

const ARTIFACT_PATH = join(process.cwd(), "artifacts", "publications-review.md");

const log = (line = "") => {
  console.log(line);
  appendSummary(`${line}\n`);
};

let summary = "";
function appendSummary(text) {
  summary += text;
}

/**
 * Firestore credentials, matching the convention the other scripts already use
 * so one secret works everywhere: a path to a key file, or the JSON inline.
 */
function loadServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH (path to the key JSON) or " +
        "FIREBASE_SERVICE_ACCOUNT_KEY (the JSON itself).",
    );
  }
  return raw.endsWith(".json")
    ? JSON.parse(readFileSync(join(process.cwd(), raw), "utf-8"))
    : JSON.parse(raw);
}

function initFirestore() {
  if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
  return getFirestore();
}

/** Every publication currently stored, across all years and buckets. */
function collectExisting(years) {
  const titles = new Set();
  const ids = new Set();
  for (const bucket of Object.values(years ?? {})) {
    for (const kind of BUCKETS) {
      for (const record of bucket[kind] ?? []) {
        if (record?.title) titles.add(normaliseTitle(record.title));
        if (record?.id) ids.add(record.id);
      }
    }
  }
  return { titles, ids };
}

/**
 * Picks which of the four buckets a paper belongs in.
 *
 * The source page has no categories at all, so this is a guess — recorded in
 * the review artifact so it is easy to correct in /admin. It leans on the venue
 * string, which is the only signal available. Posters and late-breaking work
 * are checked first because the site's own data files those under
 * `extendedAbstracts` with the distinction noted in the venue text.
 */
export function classifyBucket(venue) {
  const v = String(venue ?? "").toLowerCase();

  if (EXTENDED_HINTS.some((hint) => v.includes(hint))) return "extendedAbstracts";
  if (ARTIFACT_HINTS.some((hint) => v.includes(hint))) return "researchArtifacts";
  if (JOURNAL_HINTS.some((hint) => v.includes(hint))) return "journalArticles";
  if (CONFERENCE_HINTS.some((hint) => new RegExp(`\\b${hint}\\b`).test(v))) {
    return "conferenceProceedings";
  }
  return "conferenceProceedings";
}

async function main() {
  const summaryHeader = "# Publication sync\n\n";
  summary = summaryHeader;

  const db = initFirestore();
  const ref = db.collection("config").doc("site");
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Firestore document config/site not found.");
  const content = snap.data();
  const years = content.publications?.years ?? {};

  log(`Source: ${FROM_FILE ?? SOURCE_URL}`);
  log(`Mode:   ${DRY_RUN ? "DRY RUN — nothing will be written" : "live write"}`);
  log(`Enrichment: ${SKIP_ENRICHMENT ? "skipped" : "OpenAlex, strict gate"}`);
  log("");

  // ── Read the source ───────────────────────────────────────────────────────
  const html = FROM_FILE
    ? readFileSync(FROM_FILE, "utf-8")
    : await fetchWritingHtml({ url: SOURCE_URL });
  const entries = parseEntries(html);

  // The previous count guards against a redesign silently emptying the page.
  const previous = content.publicationsSync?.entryCount ?? null;
  assertSaneEntryCount(entries, previous);
  log(`Parsed ${entries.length} publications from the source page.`);
  log("");

  // ── Diff ──────────────────────────────────────────────────────────────────
  const { titles: known, ids: takenIds } = collectExisting(years);
  const newEntries = entries.filter((e) => !known.has(normaliseTitle(e.title)));

  log(`Already in Firestore: ${entries.length - newEntries.length}`);
  log(`New:                  ${newEntries.length}`);

  if (newEntries.length === 0) {
    log("");
    log("Nothing to add. Exiting without writing, so `lastModified` is left");
    log("untouched and no deploy is triggered.");
    finish([], 0);
    return;
  }
  log("");

  // ── Build the records ─────────────────────────────────────────────────────
  const additions = [];
  for (const entry of newEntries) {
    const id = makeId(entry.year, entry.title, takenIds);
    takenIds.add(id);

    const bucket = classifyBucket(entry.venue);
    const record = { id, title: entry.title, authors: entry.authors, venue: entry.venue, bucket, year: entry.year };

    if (entry.award) record.award = entry.award;

    if (!SKIP_ENRICHMENT) {
      const found = await findPaperUrl(entry, { log });
      if (found.url) {
        record.url = found.url;
        if (found.doi) record.doi = found.doi;
      }
      record.rejections = found.rejections;
      record.lookupError = found.error ?? null;
    }

    additions.push(record);
  }

  for (const a of additions) {
    const link = a.url ? a.url : "— no link —";
    log(`• [${a.bucket}] ${a.title}`);
    log(`    year ${a.year} · id ${a.id}`);
    log(`    venue: ${a.venue || "(none)"}`);
    if (a.award) log(`    award: ${a.award}`);
    log(`    link:  ${link}`);
    for (const r of a.rejections ?? []) {
      log(`    skipped candidate "${r.title}": ${r.reason}`);
    }
    if (a.lookupError) log(`    lookup error: ${a.lookupError}`);
    log("");
  }

  if (DRY_RUN) {
    log(`Dry run: ${additions.length} record(s) would be added. Nothing written.`);
    finish(additions, 0);
    return;
  }

  // ── Write ─────────────────────────────────────────────────────────────────
  // A transaction rather than a plain set(): both /admin and
  // upload-content.mjs overwrite the whole document, so a read-modify-write
  // without conflict detection could discard a publish made in the meantime.
  // Re-checking inside the transaction also means two runs racing each other
  // cannot both insert the same paper.
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ref);
    const data = fresh.data();
    const freshYears = data.publications?.years ?? {};
    const freshKnown = collectExisting(freshYears).titles;

    const toInsert = additions.filter((a) => !freshKnown.has(normaliseTitle(a.title)));
    if (toInsert.length === 0) return;

    for (const a of toInsert) {
      const yearKey = String(a.year);
      if (!freshYears[yearKey]) {
        freshYears[yearKey] = {
          label: yearKey,
          journalArticles: [],
          conferenceProceedings: [],
          extendedAbstracts: [],
          researchArtifacts: [],
        };
      }
      // Built field by field rather than by spreading `a` minus the extras:
      // only these six keys belong in Firestore. `bucket` decides placement,
      // `year` is already the key, and the rest is enrichment bookkeeping that
      // only ever belongs in the review artifact.
      freshYears[yearKey][a.bucket].push({
        id: a.id,
        title: a.title,
        authors: a.authors,
        venue: a.venue,
        ...(a.award ? { award: a.award } : {}),
        ...(a.url ? { url: a.url } : {}),
        ...(a.doi ? { doi: a.doi } : {}),
      });
    }

    tx.update(ref, {
      "publications.years": freshYears,
      // Bumping this is what the deploy cron watches, so it moves only when a
      // record was genuinely added.
      lastModified: new Date().toISOString(),
      "publicationsSync.lastRun": new Date().toISOString(),
      "publicationsSync.entryCount": entries.length,
      "publicationsSync.addedCount": toInsert.length,
    });
  });

  log(`Added ${additions.length} publication(s) to Firestore.`);
  log("The deploy cron will pick this up on its next run.");
  finish(additions, additions.length);
}

function finish(additions, added) {
  const needsReview = additions.filter((a) => !a.url);
  const lines = [
    "",
    "## Result",
    "",
    `- Added: **${added}**`,
    `- Needing a link entered by hand: **${needsReview.length}**`,
    "",
  ];

  if (needsReview.length) {
    lines.push("### Needs a URL entered in /admin", "");
    for (const a of needsReview) {
      lines.push(`- **${a.title}** (${a.year}, ${a.venue || "no venue"})`);
      for (const r of a.rejections ?? []) lines.push(`  - skipped "${r.title}": ${r.reason}`);
    }
    lines.push("");
  }

  mkdirSync(join(process.cwd(), "artifacts"), { recursive: true });
  writeFileSync(ARTIFACT_PATH, `# Publication sync — ${new Date().toISOString()}\n\n${lines.join("\n")}`, "utf-8");

  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

main().catch((error) => {
  console.error(`Publication sync failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
