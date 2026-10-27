// Shares newly published blog posts to X and LinkedIn, then tells IndexNow.
// Run by .github/workflows/share-posts.yml after each deploy.
//
//   npm run share-posts       # for real
//   npm run share-posts:dry   # print what would be posted; no posts, no writes
//
// Safety, because a social post can't be taken back:
//   - only posts that are live on the site (the deployed page shows them)
//   - only posts published in the last 7 days, unless "Share now" was pressed
//   - each platform is claimed in a Firestore transaction before posting, so
//     two overlapping runs can't both post; a claim that never finished stays
//     "pending" and is never retried automatically
//   - failures are retried on later runs, at most 3 attempts in all

import { readFileSync, appendFileSync } from "fs";
import { join } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { TwitterApi } from "twitter-api-v2";

import { pingIndexNow } from "./lib/indexnow.mjs";
import { accessToken, createPost, linkedinConfig, uploadThumbnail } from "./lib/linkedin.mjs";
import { pageShowsPost, planShares, PLATFORMS } from "./lib/share-plan.mjs";
import { buildLinkedinText, buildXText, escapeLinkedin } from "./lib/share-text.mjs";

const SITE_URL = "https://thirdspace-uoft.github.io";
const dryRun = process.argv.includes("--dry-run");
const summary = [];
const log = (line) => {
  console.log(line);
  summary.push(line);
};

function loadServiceAccount() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_PATH");
  return key.endsWith(".json") ? JSON.parse(readFileSync(join(process.cwd(), key), "utf-8")) : JSON.parse(key);
}

if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();

// ── Platforms ──

const x =
  process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET
    ? new TwitterApi({
        appKey: process.env.X_API_KEY,
        appSecret: process.env.X_API_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET,
      }).readWrite
    : null;

const li = linkedinConfig();
const liTokens = db.doc("private/linkedin");
const liConfigured = li && (await liTokens.get()).exists;

if (!x) log("X not configured (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET); skipping X.");
if (!liConfigured) log("LinkedIn not configured (secrets or private/linkedin tokens missing); skipping LinkedIn.");

const configured = [x && "x", liConfigured && "linkedin"].filter(Boolean);

/** Shown in admin as a banner when LinkedIn needs a person to re-authorise. Not secret. */
async function setLinkedinStatus(ok, message) {
  if (dryRun) return;
  // A field update leaves lastModified alone, so this doesn't trigger a rebuild.
  await db.doc("config/site").update({ "socialStatus.linkedin": { ok, message: message ?? "", checkedAt: new Date().toISOString() } });
}

let liToken = null;
if (configured.includes("linkedin")) {
  try {
    const { token, warning } = await accessToken(li, liTokens);
    liToken = token;
    if (warning) log(warning);
    await setLinkedinStatus(!warning, warning);
  } catch (err) {
    log(`LinkedIn: ${err.message}`);
    await setLinkedinStatus(false, err.message);
    configured.splice(configured.indexOf("linkedin"), 1);
  }
}

// ── What to share ──

const snap = await db.collection("posts").where("status", "==", "published").get();
const posts = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
// A dry run previews both platforms even before their credentials exist.
const { plan, skipped } = planShares(posts, { configured: dryRun ? PLATFORMS : configured });
for (const { post, reason } of skipped) log(`Skipped "${post.title}": ${reason}.`);
if (plan.length === 0) log("Nothing to share.");

/** The share image the post page uses: the override, else the generated card. */
function shareImage(post) {
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "";
  if (post.ogImage?.path) {
    const path = post.ogImage.path;
    const url = /^https?:\/\//.test(path) ? path : `${endpoint}${path.startsWith("/") ? path : `/${path}`}`;
    return `${url}?tr=w-1200,h-630,fo-auto,f-jpg`;
  }
  return `${SITE_URL}/blog/${post.slug}/og.png`;
}

/** Marks a platform as being posted, unless someone else already has. */
async function claim(ref, platform) {
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const state = doc.data()?.shared?.[platform];
    if (state?.status === "done" || state?.status === "pending") return false;
    tx.update(ref, {
      [`shared.${platform}`]: { status: "pending", at: new Date().toISOString(), attempts: (state?.attempts ?? 0) + 1 },
    });
    return true;
  });
}

async function postTo(platform, post, url) {
  if (platform === "x") {
    const { data } = await x.v2.tweet(buildXText(post, url));
    return { id: data.id, link: `https://x.com/i/web/status/${data.id}` };
  }
  const thumbnail = await uploadThumbnail(li, liToken, shareImage(post), log);
  const urn = await createPost(li, liToken, {
    commentary: escapeLinkedin(buildLinkedinText(post, url)),
    url,
    title: post.title,
    description: post.summary,
    thumbnail,
  });
  return { id: urn, link: `https://www.linkedin.com/feed/update/${urn}` };
}

const shared = [];
for (const { post, platforms } of plan) {
  const url = `${SITE_URL}/blog/${post.slug}`;

  const page = await fetch(url).catch(() => null);
  const html = page?.ok ? await page.text() : "";
  if (!pageShowsPost(html, post.title)) {
    log(`Not live yet: "${post.title}" (${url}${page ? `, HTTP ${page.status}` : ""}); will try on the next run.`);
    continue;
  }

  if (dryRun) {
    for (const p of platforms) {
      const text = p === "x" ? buildXText(post, url) : buildLinkedinText(post, url);
      log(`[dry run] Would post to ${p === "x" ? "X" : "LinkedIn"}:\n${text.replace(/^/gm, "    ")}`);
    }
    continue;
  }

  const ref = db.collection("posts").doc(post.id);
  for (const platform of platforms) {
    if (!(await claim(ref, platform))) {
      log(`${platform}: "${post.title}" already claimed by another run; skipping.`);
      continue;
    }
    const attempts = ((post.shared?.[platform]?.attempts) ?? 0) + 1;
    try {
      const { id, link } = await postTo(platform, post, url);
      await ref.update({ [`shared.${platform}`]: { status: "done", id, at: new Date().toISOString(), attempts } });
      log(`${platform === "x" ? "X" : "LinkedIn"}: shared "${post.title}" → ${link}`);
      shared.push(url);
    } catch (err) {
      const message = String(err?.data?.detail ?? err?.message ?? err).slice(0, 500);
      await ref.update({ [`shared.${platform}`]: { status: "failed", error: message, at: new Date().toISOString(), attempts } });
      log(`${platform === "x" ? "X" : "LinkedIn"}: failed for "${post.title}" (attempt ${attempts}): ${message}`);
    }
  }
  // "Share now" is a one-off request; clear it once acted on.
  if (post.social?.shareNow) await ref.update({ "social.shareNow": FieldValue.delete() });
}

// ── IndexNow: newly shared posts plus any post edited since the last ping ──
if (!dryRun) {
  const state = db.doc("private/indexnow");
  const last = (await state.get()).data()?.lastPingAt ?? "";
  const updated = posts
    .filter((p) => p.publishedAt && Date.parse(p.publishedAt) <= Date.now() && (p.updatedAt ?? "") > last)
    .map((p) => `${SITE_URL}/blog/${p.slug}`);
  const urls = [...new Set([...shared, ...updated])];
  if (urls.length) {
    await pingIndexNow(SITE_URL, [...urls, `${SITE_URL}/blog`, `${SITE_URL}/sitemap.xml`], log);
    await state.set({ lastPingAt: new Date().toISOString() });
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Share posts${dryRun ? " (dry run)" : ""}\n\n${summary.map((l) => `- ${l.replace(/\n/g, "\n  ")}`).join("\n")}\n`);
}
