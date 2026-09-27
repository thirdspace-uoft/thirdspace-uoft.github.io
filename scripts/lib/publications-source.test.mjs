/**
 * Tests for the writing-page parser.
 *
 * Run with: npm run test:publications
 *
 * The assertions are the ones that actually broke during development, so they
 * are kept as executable facts rather than prose. The two hyphen cases in
 * particular are load-bearing: a regex that treated a hyphen as a separator
 * silently deleted every hyphen in every title, and one that mapped it to a
 * space made "OpenStreetMap" and "Open- StreetMap" permanently unequal — the
 * second of which would re-insert a 2012 paper on every single run.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  assertSaneEntryCount,
  makeId,
  normaliseTitle,
  parseEntries,
  resolveYear,
} from "./publications-source.mjs";

const FIXTURE = join(process.cwd(), "scripts", "fixtures", "writing.sample.html");
const html = readFileSync(FIXTURE, "utf-8");

/** Mirrors the Firestore fixture the sync diffs against. */
const existingTitles = JSON.parse(
  readFileSync(join(process.cwd(), "public", "config", "content.json"), "utf-8"),
);

function allFirestoreTitles() {
  const titles = [];
  for (const bucket of Object.values(existingTitles.publications.years)) {
    for (const records of Object.values(bucket)) {
      if (Array.isArray(records)) titles.push(...records.map((r) => r.title));
    }
  }
  return titles;
}

test("parses every entry on the page", () => {
  const entries = parseEntries(html);
  assert.equal(entries.length, 192);
  assert.doesNotThrow(() => assertSaneEntryCount(entries, 192));
});

test("decodes entities and strips markup from titles", () => {
  const entries = parseEntries(html);
  const acl = entries.find((e) => e.title.includes("Bangla Hate Speech"));
  assert.ok(acl, "expected to find the ACL 2026 paper");
  assert.equal(acl.title, "LLM-Based Multi-Task Bangla Hate Speech Detection: Type, Severity, and Target");
  assert.equal(acl.venue, "ACL 2026 (Main)");
  assert.equal(acl.year, 2026);
});

test("resolves year from the venue, not the section heading", () => {
  // The source files these CHI 2021 papers under a "2022" heading.
  const entries = parseEntries(html);
  const unmochon = entries.find((e) => e.title.startsWith("‘Unmochon’") || e.title.includes("Unmochon"));
  assert.ok(unmochon, "expected to find the Unmochon paper");
  assert.equal(unmochon.venue, "CHI 2021");
  assert.equal(unmochon.year, 2021);
});

test("resolveYear falls back to the heading when the venue has no year", () => {
  assert.equal(resolveYear("CHI 2020", 2019), 2020);
  assert.equal(resolveYear("Late-Breaking Work", 2019), 2019);
  assert.equal(resolveYear("", null), null);
});

test("normalises awards that differ only in punctuation", () => {
  const entries = parseEntries(html);
  const awards = entries.filter((e) => e.award).map((e) => e.award);
  assert.ok(awards.length > 0, "expected some awards");
  assert.ok(
    awards.every((a) => !a.endsWith("!")),
    "trailing '!' should be normalised away",
  );
  assert.ok(awards.includes("Best Paper Honorable Mention Award"));
});

test("title matching survives hyphens, spaces and typographic quotes", () => {
  // These pairs are the same paper spelled two ways across the two systems.
  assert.equal(
    normaliseTitle("The State of Open- StreetMap in Bangladesh"),
    normaliseTitle("The State of OpenStreetMap in Bangladesh"),
  );
  assert.equal(
    normaliseTitle("LLM-Based Multi-Task Bangla Hate Speech"),
    normaliseTitle("LLMBased MultiTask Bangla Hate Speech"),
  );
  assert.equal(
    normaliseTitle("“Everyone Has Some Personal Stuff”"),
    normaliseTitle('"Everyone Has Some Personal Stuff"'),
  );
});

test("title matching does not merge genuinely different papers", () => {
  // The two known duplicate-title pairs in Firestore are the same work
  // published twice; these two are unrelated and must never collide.
  assert.notEqual(
    normaliseTitle("Cutting a cornered convex polygon out of a circle"),
    normaliseTitle("Cutting a convex polyhedron out of a sphere"),
  );
});

test("finds exactly the three papers that were missing before the first sync", () => {
  // Pinned against a saved snapshot rather than the live content.json: the
  // sync has since run and Firestore now contains these three, so reading the
  // live file would assert "none missing" and quietly stop testing the diff.
  // The snapshot is the state immediately before the first write.
  const preSync = JSON.parse(
    readFileSync(join(process.cwd(), "scripts", "fixtures", "pre-sync-snapshot.json"), "utf-8"),
  );
  const known = new Set();
  for (const bucket of Object.values(preSync)) {
    for (const records of Object.values(bucket)) {
      if (Array.isArray(records)) records.forEach((r) => known.add(normaliseTitle(r.title)));
    }
  }

  const entries = parseEntries(html);
  const missing = entries.filter((e) => !known.has(normaliseTitle(e.title)));

  assert.deepEqual(
    missing.map((e) => e.title).sort(),
    [
      "Emotional and Informational Trajectories of Immigrants: A Longitudinal Study of Reddit Communities",
      "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement",
      "Resilience Amid Diffused Surveillance During a Political Movement in Bangladesh",
    ].sort(),
  );
});

test("the live content.json now contains the synced papers", () => {
  // Guards the write itself: if the three papers are ever removed by hand,
  // this is the test that notices the pipeline's output went missing.
  const known = new Set(allFirestoreTitles().map(normaliseTitle));
  for (const title of [
    "Emotional and Informational Trajectories of Immigrants: A Longitudinal Study of Reddit Communities",
    "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement",
    "Resilience Amid Diffused Surveillance During a Political Movement in Bangladesh",
  ]) {
    assert.ok(known.has(normaliseTitle(title)), `expected Firestore to contain "${title}"`);
  }
});

test("ids are year-prefixed, deterministic and collision-free", () => {
  const taken = new Set(["2026-evaluating-second-order-bias-of-llms"]);

  const first = makeId(2026, "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement");
  assert.equal(first, "2026-evaluating-second-order-bias-of-llms");

  // Deterministic: the same input yields the same id, so re-running the sync
  // cannot produce a second copy of a paper it already added.
  assert.equal(
    makeId(2026, "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement", new Set()),
    first,
  );

  // A taken id is stepped around rather than reused.
  assert.equal(
    makeId(2026, "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement", taken),
    "2026-evaluating-second-order-bias-of-llms-2",
  );
});

test("the sanity floor rejects a collapsed parse", () => {
  assert.throws(() => assertSaneEntryCount([], 192), /Refusing to continue/);
  assert.throws(() => assertSaneEntryCount(new Array(100).fill({}), 192), /Refusing to continue/);
  // A modest drop is tolerated; a collapse is not.
  assert.doesNotThrow(() => assertSaneEntryCount(new Array(170).fill({}), 192));
});
