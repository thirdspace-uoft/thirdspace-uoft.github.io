/**
 * Fills the Find us section (Firestore `findUs.conferences`) from the lab's own
 * publications: one conference per venue where the lab has a paper since
 * --from-year (default 2025), with dates and place from
 * scripts/data/conference-venues.json and the lab members among the authors as
 * attendees.
 *
 *   node --env-file=.env scripts/import-conferences.mjs                    report only (default)
 *   node --env-file=.env scripts/import-conferences.mjs --apply            add what is missing
 *   node --env-file=.env scripts/import-conferences.mjs --from-year 2024   include older ones
 *
 * Add-only, like import-news: ids are derived from the venue ("pub-chi-2026"),
 * so re-running adds nothing twice, and a conference already in Firestore
 * (edited in /admin, or with photos) is never touched. Venues missing from
 * conference-venues.json are listed so their facts can be added by hand.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { deriveConferences } from "./lib/conferences-source.mjs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const fromIndex = args.indexOf("--from-year");
const FROM_YEAR = fromIndex >= 0 ? Number(args[fromIndex + 1]) : 2025;

function initDb() {
  const keyPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set (run with --env-file=.env)");
  const serviceAccount = keyPath.endsWith(".json")
    ? JSON.parse(readFileSync(join(process.cwd(), keyPath), "utf-8"))
    : JSON.parse(keyPath);
  if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
}

/** Same keys as peopleOptions() in src/lib/find-us.ts: "pi", then memberAnchor(role, name). */
async function peopleOf(site) {
  const { memberAnchor } = await import(pathToFileURL(join(process.cwd(), "src/lib/people.ts")).href);
  const people = [];
  if (site.professor?.name) people.push({ key: "pi", name: site.professor.name });
  for (const section of site.team?.sections ?? []) {
    for (const member of section.members ?? []) {
      if (section.role && member.name) people.push({ key: memberAnchor(section.role, member.name), name: member.name });
    }
  }
  return people;
}

async function main() {
  if (!Number.isInteger(FROM_YEAR)) throw new Error("--from-year needs a year, e.g. --from-year 2024");
  const db = initDb();
  const ref = db.collection("config").doc("site");
  const site = (await ref.get()).data() ?? {};
  const venues = JSON.parse(readFileSync(join(process.cwd(), "scripts/data/conference-venues.json"), "utf-8")).venues;
  const people = await peopleOf(site);
  const names = new Map(people.map((p) => [p.key, p.name]));

  const { conferences, unknownVenues } = deriveConferences({
    years: site.publications?.years ?? {},
    people,
    venues,
    fromYear: FROM_YEAR,
  });
  const existing = new Set((site.findUs?.conferences ?? []).map((c) => c.id));
  const toAdd = conferences.filter((c) => !existing.has(c.id));

  console.log(`Conferences from publications since ${FROM_YEAR}: ${conferences.length} (${toAdd.length} new)\n`);
  for (const c of conferences) {
    const mark = existing.has(c.id) ? "  exists" : "+ add   ";
    const when = c.startDate ? `${c.startDate}..${c.endDate}` : "dates TBA            ";
    console.log(`${mark} ${c.name.padEnd(22)} ${when}  ${c.location.padEnd(26)} ${c.note}`);
    console.log(`           attendees: ${c.attendees.map((k) => names.get(k)).join(", ") || "—"}`);
  }
  if (unknownVenues.length) {
    console.log(`\nSkipped (add them to scripts/data/conference-venues.json): ${unknownVenues.join(", ")}`);
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }
  if (toAdd.length === 0) {
    console.log("\nNothing to add.");
    return;
  }

  // Scoped to findUs.conferences; re-checked inside the transaction so a
  // concurrent /admin publish is never overwritten.
  let added = 0;
  await db.runTransaction(async (tx) => {
    const fresh = (await tx.get(ref)).data() ?? {};
    const current = fresh.findUs?.conferences ?? [];
    const ids = new Set(current.map((c) => c.id));
    const insert = toAdd.filter((c) => !ids.has(c.id));
    added = insert.length;
    if (added) tx.update(ref, { "findUs.conferences": [...current, ...insert], lastModified: new Date().toISOString() });
  });
  console.log(`\nAdded ${added} conference(s). Run \`npm run fetch-content\` to see them locally.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
