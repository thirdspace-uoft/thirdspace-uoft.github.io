/**
 * Anchors that address one person inside /people.
 *
 * A person's anchor is `<section-slug>/<name-slug>` — e.g.
 * `phd-students/yasaman-rohanifar`. Two things depend on this format and both
 * derive it from the same functions, so a link minted on one page and the row
 * it points at on the other can't drift apart.
 *
 * The `/` is deliberate. It keeps the role visible in the URL bar while the
 * name stays unique on its own, and it lets `getElementById` address the row
 * directly — no CSS selector, so the diacritics and digits in member names
 * never have to be escaped.
 */

/** Role heading → section slug. "PhD Students" → "phd-students". */
export function sectionSlug(role: string): string {
  return role
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[̀-ͯ]/g, "");
}

/** Member name → slug. "Md. Arid Hasan" → "md-arid-hasan". */
export function nameSlug(name: string): string {
  return name
    .normalize("NFKD")
    // Strip the combining marks NFKD splits accented letters into, so "Émilie"
    // slugs as "emilie" rather than "e-milie".
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The fragment that addresses one member, without the leading `#`. */
export function memberAnchor(role: string, name: string): string {
  return `${sectionSlug(role)}/${nameSlug(name)}`;
}

/**
 * The anchor the address bar currently names, percent-decoded and without its
 * leading `#`.
 *
 * Two normalisations, because the raw fragment isn't always what it looks like:
 *
 * - Slashes are legal in a fragment, but some encoders emit `%2F`, so the value
 *   is decoded before it is compared against a plain-slug anchor. A malformed
 *   escape yields the raw string rather than throwing — a bad fragment should
 *   match nothing, not crash the page.
 * - Everything from the *second* `#` onward is discarded. A client-side
 *   navigation can leave a doubled fragment (`#a/b#a/b`) behind; only the last
 *   segment names a real target, and taking it keeps the profile reachable
 *   instead of silently failing to match.
 */
export function currentAnchor(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const lastSegment = raw.split("#").pop() ?? "";
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}
