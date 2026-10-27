import type { Post, PostResource } from "@/lib/blog";

export type PostState = "Draft" | "Scheduled" | "Published";

export function postState(post: Pick<Post, "status" | "publishedAt">, now = Date.now()): PostState {
  if (post.status !== "published") return "Draft";
  if (post.publishedAt && Date.parse(post.publishedAt) > now) return "Scheduled";
  return "Published";
}

/** ISO (UTC) → the value a `datetime-local` input shows, in the editor's own time zone. */
export function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A `datetime-local` value (local time) → ISO in UTC, which is what's stored. */
export function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** `![alt](path)` with an empty alt, anywhere in the body. */
function imagesMissingAlt(body: string): number {
  return [...body.matchAll(/!\[([^\]]*)\]\(/g)].filter((m) => !m[1].trim()).length;
}

/** `::resource{id="…"}` shortcodes that point at no resource. */
function unknownShortcodes(body: string, resources: PostResource[]): string[] {
  const ids = new Set(resources.map((r) => r.id));
  return [...body.matchAll(/::resource\{id="([^"]+)"\}/g)].map((m) => m[1]).filter((id) => !ids.has(id));
}

/** Things worth fixing before publishing. None of them block saving. */
export function postWarnings(post: Post): string[] {
  const w: string[] = [];
  if (!post.title.trim()) w.push("No title.");
  else if (post.title.length > 70) w.push(`Title is ${post.title.length} characters; search results cut off around 60–70.`);
  const summary = post.summary.trim().length;
  if (summary < 70) w.push(`Summary is ${summary} characters; aim for 70–300 so it reads well on its own.`);
  if (summary > 300) w.push(`Summary is ${summary} characters; search results show about 155.`);
  if (post.authors.length === 0) w.push("No authors.");
  if ((post.tags ?? []).length === 0) w.push("No tags.");
  if (post.cover?.path && !post.cover.alt?.trim()) w.push("Cover image has no alt text.");
  if (post.ogImage?.path && !post.ogImage.alt?.trim()) w.push("Share image has no alt text.");
  const missingAlt = imagesMissingAlt(post.body);
  if (missingAlt) w.push(`${missingAlt} image(s) in the body have no alt text.`);
  for (const id of unknownShortcodes(post.body, post.resources ?? [])) w.push(`Shortcode points at a missing resource: ${id}`);
  if ((post.resources ?? []).some((r) => !r.url.trim())) w.push("A resource has no URL.");
  return w;
}
