/**
 * Tests for which posts get shared.
 *
 * Run with: npm test
 *
 * A social post can't be taken back, so the rules that prevent double posts
 * and backlog blasts each get a case.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { pageShowsPost, planShares } from "./share-plan.mjs";

const now = Date.parse("2026-10-27T12:00:00Z");
const day = 86_400_000;
const post = (extra = {}) => ({
  id: "p",
  slug: "p",
  title: "T",
  status: "published",
  publishedAt: new Date(now - day).toISOString(),
  social: { autoShare: true },
  ...extra,
});

test("shares a fresh post to every configured platform", () => {
  const { plan } = planShares([post()], { now });
  assert.deepEqual(plan[0].platforms, ["x", "linkedin"]);
});

test("never re-shares done or pending platforms", () => {
  const { plan } = planShares([post({ shared: { x: { status: "done" }, linkedin: { status: "pending" } } })], { now });
  assert.equal(plan.length, 0);
});

test("retries a failure until three attempts", () => {
  assert.equal(planShares([post({ shared: { x: { status: "failed", attempts: 2 } } })], { now, configured: ["x"] }).plan.length, 1);
  assert.equal(planShares([post({ shared: { x: { status: "failed", attempts: 3 } } })], { now, configured: ["x"] }).plan.length, 0);
});

test("skips drafts, scheduled posts and posts with auto-share off", () => {
  const { plan } = planShares(
    [
      post({ status: "draft" }),
      post({ publishedAt: new Date(now + day).toISOString() }),
      post({ social: { autoShare: false } }),
    ],
    { now },
  );
  assert.equal(plan.length, 0);
});

test("skips posts older than 7 days unless Share now was pressed", () => {
  const old = post({ publishedAt: new Date(now - 8 * day).toISOString() });
  const result = planShares([old], { now });
  assert.equal(result.plan.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(planShares([{ ...old, social: { autoShare: true, shareNow: true } }], { now }).plan.length, 1);
});

test("leaves unconfigured platforms alone", () => {
  const { plan } = planShares([post()], { now, configured: ["x"] });
  assert.deepEqual(plan[0].platforms, ["x"]);
  assert.equal(planShares([post()], { now, configured: [] }).plan.length, 0);
});

test("checks the live page by its og:title", () => {
  const html = '<meta property="og:title" content="Faith &amp; &quot;AI&quot;"/>';
  assert.equal(pageShowsPost(html, 'Faith & "AI"'), true);
  assert.equal(pageShowsPost(html, "Something else"), false);
  assert.equal(pageShowsPost("<html>404</html>", "T"), false);
});
