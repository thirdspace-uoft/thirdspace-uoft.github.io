/**
 * Tests for the paper-link confidence gate.
 *
 * Run with: npm run test:publications
 *
 * The gate is the only thing standing between a scholarly search API's
 * confident wrong answer and a live publications page, so each rejection reason
 * gets its own case. These are the exact failure modes observed against the
 * three real unpublished papers in this project.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { confidenceGate } from "./publications-enrich.mjs";

const entry = {
  title: "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement",
  authors: "Ramaravind Kommiya Mothilal, Terry Jingchen Zhang, Raiyan Ahmed, Syed Ishtiaque Ahmed",
  year: 2026,
};

const matching = {
  title: "Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement",
  authors: "Ramaravind Kommiya Mothilal, Terry Jingchen Zhang, Syed Ishtiaque Ahmed",
  year: 2026,
};

test("accepts an exact match at a real publisher DOI", () => {
  const verdict = confidenceGate(
    { ...matching, doi: "10.18653/v1/2026.acl-long.1565", url: "https://doi.org/10.18653/v1/2026.acl-long.1565" },
    entry,
  );
  assert.equal(verdict.accepted, true);
  assert.equal(verdict.candidate.url, "https://doi.org/10.18653/v1/2026.acl-long.1565");
});

test("accepts a title that differs only in typographic punctuation", () => {
  const verdict = confidenceGate(
    {
      ...matching,
      title: "“Evaluating Second-Order Bias of LLMs Through Epistemic Entitlement”",
      doi: "10.1145/1234",
      url: "https://doi.org/10.1145/1234",
    },
    entry,
  );
  assert.equal(verdict.accepted, true);
});

test("rejects a topically similar paper that shares no author", () => {
  // The real failure mode: Semantic Scholar answered a surveillance paper with
  // a measles vaccination study by a different team.
  const surveillance = {
    title: "Resilience amid Diffused Surveillance During a Political Movement in Bangladesh",
    authors: "Mashiyat Mahjabin Eshita, Ishmam Bin Rofi, Dipto Das",
    year: 2026,
  };
  const verdict = confidenceGate(
    {
      title: "Resilience amid Diffused Surveillance During a Political Movement in Bangladesh",
      authors: "Yan Wang, Andrea Peris, Linh Nguyen",
      year: 2026,
      doi: "10.1016/j.xxxx",
      url: "https://doi.org/10.1016/j.xxxx",
    },
    surveillance,
  );
  assert.equal(verdict.accepted, false);
  assert.match(verdict.reason, /author surname/i);
});

test("rejects a different paper whose title merely overlaps", () => {
  const verdict = confidenceGate(
    {
      title: "Measuring exposure of e-waste dismantlers in Dhaka Bangladesh",
      authors: "Yan Wang, Syed Ishtiaque Ahmed",
      year: 2026,
      doi: "10.1016/j.yyyy",
      url: "https://doi.org/10.1016/j.yyyy",
    },
    { ...entry, title: "Measuring e-waste exposure in Dhaka" },
  );
  assert.equal(verdict.accepted, false);
  assert.match(verdict.reason, /Title does not match/i);
});

test("rejects a right paper with no author in common", () => {
  const verdict = confidenceGate(
    {
      ...matching,
      authors: "Epistemic Entitlement, Some Book, A Third Person",
      doi: "10.1145/1234",
      url: "https://doi.org/10.1145/1234",
    },
    entry,
  );
  assert.equal(verdict.accepted, false);
  assert.match(verdict.reason, /author surname/i);
});

test("rejects a right paper from the wrong year", () => {
  const verdict = confidenceGate(
    { ...matching, year: 2020, doi: "10.1145/1234", url: "https://doi.org/10.1145/1234" },
    entry,
  );
  assert.equal(verdict.accepted, false);
  assert.match(verdict.reason, /Year differs/i);
});

test("rejects preprints, which are not the version of record", () => {
  // Observed for real: both matching titles exist on OpenAlex, but only as an
  // arXiv and a Zenodo deposit.
  for (const [url, doi] of [
    ["https://arxiv.org/abs/2606.17506", "10.48550/arxiv.2606.17506"],
    ["https://zenodo.org/records/20274806", "10.5281/zenodo.20274806"],
  ]) {
    const verdict = confidenceGate({ ...matching, url, doi }, entry);
    assert.equal(verdict.accepted, false, `expected ${url} to be rejected`);
    assert.match(verdict.reason, /preprint/i);
  }
});

test("rejects a candidate with no link at all", () => {
  const verdict = confidenceGate({ ...matching, url: null, doi: null }, entry);
  assert.equal(verdict.accepted, false);
  assert.match(verdict.reason, /No usable link/i);
});

test("rejects an unparseable url rather than publishing it", () => {
  const verdict = confidenceGate({ ...matching, url: "not a url", doi: null }, entry);
  assert.equal(verdict.accepted, false);
});

test("matches authors on surname only, tolerating reordered lists", () => {
  const verdict = confidenceGate(
    {
      ...matching,
      authors: "Zhijing Jin, Syed Ishtiaque Ahmed, Ramaravind Kommiya Mothilal",
      url: "https://doi.org/10.1145/1234",
      doi: "10.1145/1234",
    },
    entry,
  );
  assert.equal(verdict.accepted, true);
});
