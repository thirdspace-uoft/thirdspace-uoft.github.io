// Which posts still need sharing, and where. Pure, so the rules are tested
// without Firestore or the platforms (share-plan.test.mjs).

export const PLATFORMS = ["x", "linkedin"];
export const MAX_ATTEMPTS = 3;
/** Older posts are skipped, so the first run (or one after an outage) doesn't post a backlog. */
export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * One entry per post with at least one platform to share to:
 * `{ post, platforms }`. `configured` lists the platforms that have
 * credentials; the others are left untouched so posts are picked up once
 * that platform is set up.
 */
export function planShares(posts, { now = Date.now(), configured = PLATFORMS } = {}) {
  const plan = [];
  const skipped = [];
  for (const post of posts) {
    if (post.status !== "published" || !post.publishedAt) continue;
    const at = Date.parse(post.publishedAt);
    if (Number.isNaN(at) || at > now) continue;
    if (post.social?.autoShare === false) continue;

    const platforms = configured.filter((p) => {
      const state = post.shared?.[p];
      if (!state) return true;
      // "pending" means another run claimed it (or crashed mid-post); never risk a double post.
      if (state.status === "done" || state.status === "pending") return false;
      return state.status === "failed" && (state.attempts ?? 1) < MAX_ATTEMPTS;
    });
    if (platforms.length === 0) continue;

    if (now - at > WINDOW_MS && !post.social?.shareNow) {
      skipped.push({ post, reason: "published more than 7 days ago (use Share now in admin)" });
      continue;
    }
    plan.push({ post, platforms });
  }
  return { plan, skipped };
}

/**
 * Whether the deployed page is this post: it must exist and carry the post's
 * title as og:title. The deploy that triggered this run may not be the one
 * that contains the post, so anything else means "try next time".
 */
export function pageShowsPost(html, title) {
  const m = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i);
  if (!m) return false;
  const decoded = m[1]
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  return decoded === title;
}
