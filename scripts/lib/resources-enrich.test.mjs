/**
 * Tests for build-time resource enrichment.
 *
 * Run with: npm test
 *
 * The network is faked throughout. What matters most is the failure path:
 * a down API must never fail the build or wipe details a previous build found.
 */

import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { test } from "node:test";

import {
  arxivIdFrom,
  bibtexFor,
  detectKind,
  doiFrom,
  enrichPosts,
  fromCrossref,
  githubRepo,
  parseArxivAtom,
  youtubeId,
} from "./resources-enrich.mjs";

/** A fetch that answers from a URL → body map and records what was asked. */
function fakeFetch(routes) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const hit = Object.entries(routes).find(([prefix]) => url.startsWith(prefix));
    if (!hit) return { ok: false, status: 404 };
    const body = hit[1];
    if (body instanceof Error) throw body;
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    };
  };
  fn.calls = calls;
  return fn;
}

const quiet = () => {};

test("detects resource kinds from URLs", () => {
  assert.equal(detectKind("https://github.com/a/b"), "code");
  assert.equal(detectKind("https://huggingface.co/spaces/a/b"), "demo");
  assert.equal(detectKind("https://huggingface.co/datasets/a/b"), "dataset");
  assert.equal(detectKind("https://zenodo.org/records/1"), "dataset");
  assert.equal(detectKind("https://doi.org/10.1145/1"), "paper");
  assert.equal(detectKind("https://arxiv.org/abs/2608.30084"), "paper");
  assert.equal(detectKind("https://youtu.be/jLpOB2Q9KzI"), "video");
  assert.equal(detectKind("https://vimeo.com/123456"), "video");
  assert.equal(detectKind("https://example.org/talk.pdf"), "paper");
  assert.equal(detectKind("https://example.org/"), "link");
});

test("pulls ids out of URLs", () => {
  assert.equal(youtubeId("https://www.youtube.com/watch?v=-bNtAoLtV3U&ab_channel=CHIWORK"), "-bNtAoLtV3U");
  assert.equal(youtubeId("https://www.youtube.com/watch?feature=share&v=jLpOB2Q9KzI"), "jLpOB2Q9KzI");
  assert.equal(youtubeId("https://youtu.be/qiKDrBb3IXw"), "qiKDrBb3IXw");
  assert.deepEqual(githubRepo("https://github.com/thirdspace-uoft/site.git"), { owner: "thirdspace-uoft", repo: "site" });
  assert.deepEqual(githubRepo("https://github.com/a/b/tree/main/src"), { owner: "a", repo: "b" });
  assert.equal(githubRepo("https://github.com/orgs/a"), null);
  assert.equal(arxivIdFrom("https://arxiv.org/pdf/2606.17506v2"), "2606.17506");
  assert.equal(doiFrom("https://doi.org/10.1145/3613904.3642821"), "10.1145/3613904.3642821");
  assert.equal(doiFrom("10.1145/3613904.3642821."), "10.1145/3613904.3642821");
});

test("parses an arXiv Atom entry and rejects the error entry", () => {
  const xml = `<feed><entry><title>A  Study of
    Things &amp; Stuff</title><published>2026-08-30T00:00:00Z</published>
    <author><name>Ada Lovelace</name></author><author><name>Alan Turing</name></author></entry></feed>`;
  assert.deepEqual(parseArxivAtom(xml), { title: "A Study of Things & Stuff", authors: "Ada Lovelace, Alan Turing", year: "2026" });
  assert.equal(parseArxivAtom("<feed><entry><title>Error</title></entry></feed>"), null);
});

test("maps a Crossref record", () => {
  const paper = fromCrossref({
    message: {
      title: ["Cohabitant"],
      author: [{ given: "Mohammad Rashidujjaman", family: "Rifat" }, { given: "Syed Ishtiaque", family: "Ahmed" }],
      "container-title": ["Proceedings of the CHI Conference on Human Factors in Computing Systems"],
      issued: { "date-parts": [[2024, 5, 11]] },
    },
  });
  assert.equal(paper.authors, "Mohammad Rashidujjaman Rifat, Syed Ishtiaque Ahmed");
  assert.equal(paper.year, "2024");
  assert.match(paper.venue, /CHI Conference/);
});

test("builds BibTeX: conference papers are inproceedings, arXiv-only is misc", () => {
  const conf = bibtexFor({
    title: "Cohabitant: A {VR} App",
    authors: "Mohammad Rifat, Syed Ahmed",
    venue: "CHI 2024",
    year: "2024",
    doi: "10.1145/3613904.3642821",
  });
  assert.match(conf, /^@inproceedings\{rifat2024cohabitant,/);
  assert.match(conf, /title = \{\{Cohabitant: A VR App\}\}/);
  assert.match(conf, /author = \{Mohammad Rifat and Syed Ahmed\}/);
  assert.match(conf, /booktitle = \{CHI 2024\}/);
  assert.equal((conf.match(/\{/g) ?? []).length, (conf.match(/\}/g) ?? []).length);

  const pre = bibtexFor({ title: "The Preprint", authors: "Ada Lovelace", year: "2026", arxivId: "2608.30084", url: "https://arxiv.org/abs/2608.30084" });
  assert.match(pre, /^@misc\{lovelace2026preprint,/);
  assert.match(pre, /eprint = \{2608.30084\}/);
  assert.doesNotMatch(pre, /journal/);
});

test("fills GitHub details and YouTube thumbnails", async () => {
  const fetch = fakeFetch({
    "https://api.github.com/repos/a/b": { full_name: "a/b", description: "Code", stargazers_count: 214, language: "Python", license: { spdx_id: "MIT" }, pushed_at: "2026-09-01T00:00:00Z" },
    "https://www.youtube.com/oembed": { title: "A talk", author_name: "Channel" },
  });
  const [post] = await enrichPosts(
    [{ id: "p", resources: [
      { id: "c", kind: "code", title: "", url: "https://github.com/a/b" },
      { id: "v", kind: "video", title: "", url: "https://youtu.be/jLpOB2Q9KzI" },
    ] }],
    { fetch, log: quiet, githubToken: "t" },
  );
  const [code, video] = post.resources;
  assert.equal(code.repo.stars, 214);
  assert.equal(code.repo.license, "MIT");
  assert.equal(code.title, "a/b");
  assert.equal(video.provider, "youtube");
  assert.equal(video.thumbnail, "https://i.ytimg.com/vi/jLpOB2Q9KzI/hqdefault.jpg");
  assert.equal(video.title, "A talk");
});

test("only fills paper fields the editor left empty, and adds BibTeX", async () => {
  const fetch = fakeFetch({
    "https://api.crossref.org/works/": { message: { title: ["Crossref Title"], author: [{ given: "A", family: "B" }], "container-title": ["Venue"], issued: { "date-parts": [[2024]] } } },
  });
  const [post] = await enrichPosts(
    [{ id: "p", resources: [{ id: "x", kind: "paper", title: "Editor Title", url: "https://doi.org/10.1145/1.2" }] }],
    { fetch, log: quiet },
  );
  const paper = post.resources[0];
  assert.equal(paper.title, "Editor Title");
  assert.equal(paper.authors, "A B");
  assert.equal(paper.doi, "10.1145/1.2");
  assert.match(paper.bibtex, /@article\{b2024editor,/);
});

test("a failing API never throws and falls back to the cached copy", async () => {
  const now = Date.parse("2026-10-27T00:00:00Z");
  const cachePath = `${process.env.TMPDIR ?? "/tmp"}/resources-enrich-test-${process.pid}.json`;
  const ok = fakeFetch({ "https://api.github.com/": { full_name: "a/b", stargazers_count: 5 } });
  await enrichPosts([{ id: "p", resources: [{ id: "c", kind: "code", title: "", url: "https://github.com/a/b" }] }], { fetch: ok, log: quiet, cachePath, now });

  // Two days later the API is down: the stale cached answer is still used.
  const down = fakeFetch({ "https://api.github.com/": new Error("network down") });
  const [post] = await enrichPosts(
    [{ id: "p", resources: [{ id: "c", kind: "code", title: "", url: "https://github.com/a/b" }] }],
    { fetch: down, log: quiet, cachePath, now: now + 2 * 86_400_000 },
  );
  assert.equal(down.calls.length, 1);
  assert.equal(post.resources[0].repo.stars, 5);

  // With nothing cached, the card falls back to the bare repo name.
  const [bare] = await enrichPosts(
    [{ id: "p", resources: [{ id: "c", kind: "code", title: "", url: "https://github.com/x/y" }] }],
    { fetch: down, log: quiet },
  );
  assert.deepEqual(bare.resources[0].repo, { fullName: "x/y" });
  rmSync(cachePath, { force: true });
});

test("offline mode makes no requests but still derives thumbnails", async () => {
  const fetch = fakeFetch({});
  const [post] = await enrichPosts(
    [{ id: "p", resources: [{ id: "v", kind: "video", title: "T", url: "https://youtu.be/jLpOB2Q9KzI" }] }],
    { fetch, log: quiet, offline: true },
  );
  assert.equal(fetch.calls.length, 0);
  assert.equal(post.resources[0].thumbnail, "https://i.ytimg.com/vi/jLpOB2Q9KzI/hqdefault.jpg");
});
