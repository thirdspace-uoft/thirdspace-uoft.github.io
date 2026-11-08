import { test } from "node:test";
import assert from "node:assert/strict";

import { deriveConferences, isSamePerson, nameTokens, slugify, venueKey } from "./conferences-source.mjs";

test("venueKey drops the track in parentheses", () => {
  assert.equal(venueKey("EMNLP 2026 (Findings)"), "EMNLP 2026");
  assert.equal(venueKey("  CHI  2026 "), "CHI 2026");
  assert.equal(venueKey(""), "");
});

test("names match on all of the member's words, ignoring titles and accents", () => {
  assert.deepEqual(nameTokens("Prof. Ishtiaque Ahmed"), ["ishtiaque", "ahmed"]);
  assert.ok(isSamePerson("Syed Ishtiaque Ahmed", "Prof. Ishtiaque Ahmed"));
  assert.ok(isSamePerson("Md. Arid Hasan", "Md Arid Hasan"));
  assert.ok(isSamePerson("Émilie Durand", "Emilie Durand"));
  assert.ok(!isSamePerson("Raiyan Ahmed", "Prof. Ishtiaque Ahmed"));
  assert.ok(!isSamePerson("Ahmed", "Ahmed")); // a lone surname never matches
});

test("slugify", () => {
  assert.equal(slugify("USENIX Security 2026"), "usenix-security-2026");
  assert.equal(slugify("Canadian AI 2026"), "canadian-ai-2026");
});

const people = [
  { key: "pi", name: "Prof. Ishtiaque Ahmed" },
  { key: "phd-students/sam-lee", name: "Sam Lee" },
];
const venues = {
  "CHI 2026": { fullName: "ACM CHI", startDate: "2026-04-13", endDate: "2026-04-17", location: "Barcelona, Spain", websiteUrl: "https://chi2026.acm.org/" },
  "ICWSM 2027": { fullName: "ICWSM", startDate: "", endDate: "", location: "Edinburgh, UK", note: "Dates to be announced (May 2027)." },
};

test("deriveConferences groups papers by venue, counts them and finds lab co-authors", () => {
  const years = {
    "2024": { conferenceProceedings: [{ venue: "CHI 2024", authors: "Syed Ishtiaque Ahmed" }] },
    "2026": {
      conferenceProceedings: [
        { venue: "CHI 2026", authors: "Sam Lee, Someone Else, Syed Ishtiaque Ahmed" },
        { venue: "CHI 2026 (Late-Breaking Work)", authors: "Someone Else and Syed Ishtiaque Ahmed" },
        { venue: "MYSTERY 2026", authors: "Sam Lee" },
      ],
      journalArticles: [{ venue: "CHI 2026", authors: "Not counted" }],
    },
    "2027": { conferenceProceedings: [{ venue: "ICWSM 2027", authors: "Syed Ishtiaque Ahmed" }] },
  };
  const { conferences, unknownVenues } = deriveConferences({ years, people, venues, fromYear: 2025 });

  assert.deepEqual(unknownVenues, ["MYSTERY 2026"]);
  assert.deepEqual(conferences.map((c) => c.name), ["ICWSM 2027", "CHI 2026"]); // undated first, then newest
  const chi = conferences.find((c) => c.name === "CHI 2026");
  assert.equal(chi.id, "pub-chi-2026");
  assert.equal(chi.note, "2 papers from the lab");
  assert.deepEqual(chi.attendees, ["pi", "phd-students/sam-lee"]); // PI first
  assert.equal(chi.location, "Barcelona, Spain");
  const icwsm = conferences.find((c) => c.name === "ICWSM 2027");
  assert.equal(icwsm.note, "1 paper from the lab · Dates to be announced (May 2027).");
  assert.equal(icwsm.startDate, "");
});
