import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Writes the two files the build reads:
//   public/config/content.json — the config/site document (site settings)
//   src/generated/posts.json   — blog posts that are published and due
//
// Posts go under src/, not public/: everything in public/ is downloadable, and
// the filtered list here should be the only thing the build ever sees.
//
// BLOG_FIXTURES=1 swaps the posts for scripts/fixtures/posts.sample.json, and
// without Firebase credentials also uses a snapshot of the site settings, so
// `next build` runs on a machine with no access to Firestore.

const root = process.cwd();
const sitePath = join(root, "public", "config", "content.json");
const postsPath = join(root, "src", "generated", "posts.json");
const fixtures = process.env.BLOG_FIXTURES === "1";

function loadServiceAccount() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) return null;
  return key.endsWith(".json") ? JSON.parse(readFileSync(join(root, key), "utf-8")) : JSON.parse(key);
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function readFixture(name) {
  return JSON.parse(readFileSync(join(root, "scripts", "fixtures", name), "utf-8"));
}

/** Published, due, newest first. Scheduled posts stay out until their time comes. */
function livePosts(posts, now = Date.now()) {
  return posts
    .filter((p) => p.status === "published" && p.publishedAt && Date.parse(p.publishedAt) <= now)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/** Logged on every build, so the log says why a post didn't appear. */
function logCounts(posts, now = Date.now()) {
  const drafts = posts.filter((p) => p.status !== "published").length;
  const scheduled = posts.filter(
    (p) => p.status === "published" && (!p.publishedAt || Date.parse(p.publishedAt) > now),
  ).length;
  const published = posts.length - drafts - scheduled;
  console.log(`posts: ${published} published, ${scheduled} scheduled, ${drafts} draft`);
}

/** Fills in repo details, thumbnails and paper metadata. Added in the resources phase. */
async function enrich(posts) {
  return posts;
}

const serviceAccount = loadServiceAccount();
const db = serviceAccount
  ? (getApps().length || initializeApp({ credential: cert(serviceAccount) }), getFirestore())
  : null;

if (!db && !fixtures) {
  console.error(
    "No Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY(_PATH) in .env, " +
      "or run with BLOG_FIXTURES=1 to build from the sample data.",
  );
  process.exit(1);
}

// ── Site settings ──
if (db) {
  const snap = await db.collection("config").doc("site").get();
  if (!snap.exists) {
    console.error("Firestore document config/site not found!");
    process.exit(1);
  }
  writeJson(sitePath, snap.data());
  console.log("content.json regenerated from Firestore");
} else {
  // Keep a content.json someone already fetched; otherwise fall back to the snapshot.
  if (!existsSync(sitePath)) writeJson(sitePath, readFixture("site.sample.json"));
  console.log("content.json: using local copy (no Firebase credentials)");
}

// ── Posts ──
let allPosts;
if (fixtures) {
  allPosts = readFixture("posts.sample.json");
  console.log("posts: using scripts/fixtures/posts.sample.json (BLOG_FIXTURES=1)");
} else {
  const snap = await db.collection("posts").get();
  allPosts = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

logCounts(allPosts);
const posts = await enrich(livePosts(allPosts));
// The social-sharing bookkeeping is for the share workflow, not the pages.
writeJson(postsPath, posts.map((post) => ({ ...post, shared: undefined })));
console.log(`posts.json written (${posts.length} live)`);

// Fixture mode turns the blog on, so the sample posts are reachable without
// touching the real settings in Firestore.
if (fixtures) {
  const site = JSON.parse(readFileSync(sitePath, "utf-8"));
  if (!site.blog?.enabled) {
    site.blog = { ...readFixture("site.sample.json").blog, ...site.blog, enabled: true };
    writeJson(sitePath, site);
    console.log("content.json: blog enabled for fixtures");
  }
}
