/**
 * Tests for the X and LinkedIn post text.
 *
 * Run with: npm test
 *
 * X rejects a post that is one character over, so the limit maths gets the
 * most cases: links count as 23, wide characters count as 2.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildLinkedinText,
  buildXText,
  defaultXText,
  hashtag,
  truncateForX,
  X_BUDGET,
  X_LIMIT,
  xLength,
} from "./share-text.mjs";

const url = "https://thirdspace-uoft.github.io/blog/a-rather-long-slug-that-is-much-longer-than-twenty-three-characters";

test("counts links as 23 and wide characters as 2", () => {
  assert.equal(xLength("abc"), 3);
  assert.equal(xLength(url), 23);
  assert.equal(xLength(`see ${url}`), 27);
  assert.equal(xLength("গবেষণা"), 6);
  assert.equal(xLength("研究"), 4);
  assert.equal(xLength("🙂"), 2);
});

test("hashtags drop punctuation and keep acronyms", () => {
  assert.equal(hashtag("Human-AI interaction"), "#HumanAIInteraction");
  assert.equal(hashtag("Café culture"), "#CafeCulture");
  assert.equal(hashtag("2026"), "");
  assert.equal(hashtag("—"), "");
});

test("appends the URL after a blank line and always fits", () => {
  const post = { title: "T".repeat(200), summary: "word ".repeat(100), tags: ["HCI"] };
  const text = buildXText(post, url);
  assert.ok(text.endsWith(`\n\n${url}`));
  assert.ok(xLength(text) <= X_LIMIT, `length ${xLength(text)}`);
});

test("uses the editor's copy, trimmed to fit", () => {
  const custom = { title: "Title", summary: "Summary", social: { autoShare: true, xText: "a ".repeat(200) } };
  const text = buildXText(custom, url);
  assert.ok(text.startsWith("a a"));
  assert.ok(xLength(text) <= X_LIMIT);
  assert.ok(text.includes("…"));
});

test("default text adds hashtags only when they fit", () => {
  const short = defaultXText({ title: "Short", summary: "One line.", tags: ["Human-AI interaction", "HCI", "Ethics"] });
  assert.equal(short, "Short\n\nOne line. #HumanAIInteraction #HCI");
  const long = defaultXText({ title: "x".repeat(X_BUDGET), summary: "", tags: ["HCI"] });
  assert.ok(!long.includes("#HCI"));
  assert.ok(xLength(long) <= X_BUDGET);
});

test("truncation prefers a word break", () => {
  assert.equal(truncateForX("alpha beta gamma delta", 12), "alpha beta…");
  assert.equal(truncateForX("short", 12), "short");
});

test("LinkedIn text ends with the link and stays under the limit", () => {
  const text = buildLinkedinText({ title: "Title", summary: "s".repeat(4000) }, url);
  assert.ok(text.endsWith(`\n\n${url}`));
  assert.ok(text.length <= 3000);
  assert.equal(buildLinkedinText({ title: "T", summary: "S", social: { autoShare: true, linkedinText: "Custom" } }, url), `Custom\n\n${url}`);
});

test("escapes LinkedIn markup but keeps hashtags", async () => {
  const { escapeLinkedin } = await import("./share-text.mjs");
  assert.equal(escapeLinkedin("Study (2026) @lab #HCI # x_y"), "Study \\(2026\\) \\@lab #HCI \\# x\\_y");
});
