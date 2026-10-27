// The text posted to X and LinkedIn for a blog post. Shared by the admin
// editor (live character counter) and scripts/share-posts.mjs, so what the
// editor shows is exactly what gets posted.

export const X_LIMIT = 280;
/** X counts every link as 23 characters, whatever its real length. */
export const X_URL_LENGTH = 23;
/** Room left for the copy: the link plus the blank line before it. */
export const X_BUDGET = X_LIMIT - X_URL_LENGTH - 2;
export const LINKEDIN_LIMIT = 3000;

const URL_PATTERN = /https?:\/\/\S+/g;

/**
 * Characters X counts as 1 (Latin, most punctuation); everything else, such as
 * CJK, Bengali or emoji, counts as 2. Mirrors twitter-text's default weights.
 */
function weight(codePoint) {
  if (codePoint <= 4351) return 1;
  if (codePoint >= 8192 && codePoint <= 8205) return 1;
  if (codePoint >= 8208 && codePoint <= 8223) return 1;
  if (codePoint >= 8242 && codePoint <= 8247) return 1;
  return 2;
}

/** Length as X counts it. */
export function xLength(text) {
  const withoutUrls = text.replace(URL_PATTERN, "x".repeat(X_URL_LENGTH));
  let n = 0;
  for (const ch of withoutUrls) n += weight(ch.codePointAt(0));
  return n;
}

/** Cut to `max` (as X counts), at a word break when there is one, ending in "…". */
export function truncateForX(text, max) {
  if (xLength(text) <= max) return text;
  let out = "";
  for (const ch of text) {
    if (xLength(out + ch) > max - 1) break;
    out += ch;
  }
  const lastSpace = out.lastIndexOf(" ");
  if (lastSpace > out.length * 0.6) out = out.slice(0, lastSpace);
  return `${out.replace(/[\s.,;:–—-]+$/, "")}…`;
}

/** "Human-AI interaction" → "#HumanAIInteraction". Empty when nothing usable is left. */
export function hashtag(tag) {
  const words = String(tag)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const body = words.map((w) => (w === w.toUpperCase() ? w : w[0].toUpperCase() + w.slice(1))).join("");
  // A hashtag can't be only digits.
  return /^\d+$/.test(body) ? "" : `#${body}`;
}

/** Title and summary, with up to two tag hashtags if they fit. Shown as the editor's default. */
export function defaultXText(post) {
  const base = [post.title, post.summary].filter(Boolean).join("\n\n");
  let text = truncateForX(base, X_BUDGET);
  for (const tag of (post.tags ?? []).map(hashtag).filter(Boolean).slice(0, 2)) {
    if (xLength(`${text} ${tag}`) <= X_BUDGET) text = `${text} ${tag}`;
  }
  return text;
}

/** What gets posted to X: the editor's copy (or the default), trimmed to fit, then the link. */
export function buildXText(post, url) {
  const copy = (post.social?.xText ?? "").trim() || defaultXText(post);
  return `${truncateForX(copy, X_BUDGET)}\n\n${url}`;
}

export function defaultLinkedinText(post) {
  const tags = (post.tags ?? []).map(hashtag).filter(Boolean).slice(0, 3).join(" ");
  return [post.title, post.summary, tags].filter(Boolean).join("\n\n");
}

/** What gets posted to LinkedIn: the editor's copy (or the default), then the link. */
export function buildLinkedinText(post, url) {
  const copy = (post.social?.linkedinText ?? "").trim() || defaultLinkedinText(post);
  const room = LINKEDIN_LIMIT - url.length - 2;
  const fitted = copy.length > room ? `${copy.slice(0, room - 1).trimEnd()}…` : copy;
  return `${fitted}\n\n${url}`;
}
