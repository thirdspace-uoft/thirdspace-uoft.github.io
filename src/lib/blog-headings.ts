import GithubSlugger from "github-slugger";

export type PostHeading = { id: string; text: string };

/** "[a](b)", "**b**", "`c`" → plain text, close to what the rendered heading reads as. */
function plain(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .trim();
}

/**
 * The `##` headings of a post with the ids rehype-slug gives them, for the
 * table of contents. Every heading level goes through the same slugger in
 * document order, because a repeated title gets a `-1` suffix only on its
 * second appearance at any level, and the ids have to match what renders.
 */
export function postHeadings(body: string): PostHeading[] {
  const slugger = new GithubSlugger();
  const headings: PostHeading[] = [];
  let fence: string | null = null;
  for (const line of body.split("\n")) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      fence = fence === null ? fenceMatch[1] : fence === fenceMatch[1] ? null : fence;
      continue;
    }
    if (fence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = plain(m[2]);
    const id = slugger.slug(text);
    if (m[1].length === 2) headings.push({ id, text });
  }
  return headings;
}
