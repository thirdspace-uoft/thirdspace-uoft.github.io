import postsData from "../generated/posts.json";
import { getContent } from "@/lib/content";
export { getBlog, getBlogLabels, type BlogContent, type BlogLabels } from "@/lib/blog-settings";
import { memberAnchor, nameSlug } from "@/lib/people";
import { topicSlug } from "@/lib/research";
import { getImageUrl } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

export type PostStatus = "draft" | "published";

export type PostAuthor = {
  /** Name exactly as on the People page; resolved to that person at build. */
  name: string;
  /** For guests not on the People page. */
  url?: string;
};

/**
 * Everything a post links out to: papers, code, project pages, videos, data.
 * One list, ordered by the editor; the UI groups and styles by `kind`.
 */
export type ResourceKind =
  | "paper" // published paper or preprint
  | "code" // GitHub / GitLab / Hugging Face Space repo
  | "project" // project website
  | "demo" // live demo (web app) or demo video
  | "video" // talk, discussion, panel, interview, explainer
  | "dataset" // dataset (Hugging Face, Zenodo, OSF, Kaggle…)
  | "slides"
  | "poster"
  | "press" // media coverage of the work
  | "link"; // anything else

export type VideoProvider = "youtube" | "vimeo" | "imagekit" | "other";

export type PostResource = {
  id: string;
  kind: ResourceKind;
  title: string;
  url: string;
  /** One line shown under the title. */
  description?: string;
  /** Marks the one resource shown first and used for citation tags. Only one per kind. */
  primary?: boolean;

  // kind = "paper"
  /** "A. Author, B. Author" */
  authors?: string;
  venue?: string;
  year?: string;
  /** "10.1145/..." (no https://doi.org/) */
  doi?: string;
  pdfUrl?: string;
  arxivId?: string;
  /** Generated from the fields above at build time if empty. */
  bibtex?: string;

  // kind = "video" | "demo" (when it is a video)
  /** YouTube, Vimeo, or an ImageKit video path. Detected from `url` if unset. */
  provider?: VideoProvider;
  videoType?: "demo" | "talk" | "discussion" | "interview" | "explainer";
  durationSeconds?: number;
  /** ISO date, e.g. the talk date. */
  recordedAt?: string;
  /** "CHI 2026", "Schwartz Reisman Seminar" */
  event?: string;
  /** Names; resolved to People like authors. */
  speakers?: string[];
  /** ImageKit path or URL; else the provider's thumbnail. */
  thumbnail?: string;
  /** YouTube/Vimeo channel name, filled at build time. */
  channel?: string;
  transcriptUrl?: string;

  // kind = "code" (filled at build time; never typed in admin)
  repo?: {
    fullName: string;
    description?: string;
    stars?: number;
    language?: string;
    license?: string;
    updatedAt?: string;
  };

  // kind = "dataset"
  license?: string;
  /** "12k annotated posts" */
  size?: string;
};

export type ShareState = {
  status: "pending" | "done" | "failed";
  id?: string;
  at?: string;
  error?: string;
  attempts?: number;
};

export type Post = {
  id: string;
  /** URL: /blog/<slug>. Locked once first published. */
  slug: string;
  /** Old slugs that should forward to the current one. */
  previousSlugs?: string[];
  status: PostStatus;
  /** ISO. Future date = scheduled. */
  publishedAt?: string;
  /** ISO, set on every save. */
  updatedAt: string;
  title: string;
  /** 1–3 plain sentences: meta description, cards, the "In short" box. */
  summary: string;
  keyFindings?: string[];
  /** Markdown. */
  body: string;
  authors: PostAuthor[];
  tags?: string[];
  cover?: { path: string; alt: string };
  /** Optional override for the share card. */
  ogImage?: { path: string; alt: string };
  resources?: PostResource[];
  /** Links the post to a /research/<slug> page. */
  researchTopicSlug?: string;
  social?: {
    autoShare: boolean;
    xText?: string;
    linkedinText?: string;
  };
  shared?: {
    x?: ShareState;
    linkedin?: ShareState;
  };
};

// ── Posts ───────────────────────────────────────────────────────────────────

/**
 * `src/generated/posts.json` is written by scripts/fetch-content.mjs and holds
 * only posts that are published and due, newest first. Drafts never reach the
 * build, so nothing here needs to filter by status again.
 */
const POSTS = postsData as unknown as Post[];

export function getPosts(): Post[] {
  return POSTS;
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** The post an old slug used to address, so the old URL can forward to it. */
export function getPostByPreviousSlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.previousSlugs?.includes(slug));
}

/** "Faith & Culture" → "faith-culture". Same rules as research topic slugs. */
export function postSlug(title: string): string {
  return topicSlug(title);
}

export function tagSlug(tag: string): string {
  return topicSlug(tag);
}

/** Every tag with how many posts use it, most used first. */
export function getAllTags(): { tag: string; slug: string; count: number }[] {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of POSTS) {
    for (const tag of post.tags ?? []) {
      const slug = tagSlug(tag);
      if (!slug) continue;
      const entry = counts.get(slug) ?? { tag, count: 0 };
      entry.count += 1;
      counts.set(slug, entry);
    }
  }
  return [...counts.entries()]
    .map(([slug, { tag, count }]) => ({ tag, slug, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Tags with enough posts to deserve their own indexable page. */
export function getTagPages(): { tag: string; slug: string; count: number }[] {
  return getAllTags().filter((t) => t.count >= 2);
}

export function getPostsByTag(slug: string): Post[] {
  return POSTS.filter((p) => (p.tags ?? []).some((t) => tagSlug(t) === slug));
}

export function getPostsByAuthor(name: string): Post[] {
  const key = personKey(name);
  return POSTS.filter((p) => p.authors.some((a) => personKey(resolveAuthor(a).name) === key));
}

export function getPostsByTopic(topicSlug: string): Post[] {
  return POSTS.filter((p) => p.researchTopicSlug === topicSlug);
}

/** Up to `limit` other posts, ones sharing a tag first, then the newest. */
export function getRelatedPosts(post: Post, limit = 3): Post[] {
  const tags = new Set((post.tags ?? []).map(tagSlug));
  const others = POSTS.filter((p) => p.id !== post.id);
  const shared = others.filter((p) => (p.tags ?? []).some((t) => tags.has(tagSlug(t))));
  const rest = others.filter((p) => !shared.includes(p));
  return [...shared, ...rest].slice(0, limit);
}

/** Minutes to read the body at ~230 words a minute, never less than 1. */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

export function wordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/** True when the post was edited more than a day after it went live. */
export function wasUpdated(post: Post): boolean {
  if (!post.publishedAt) return false;
  const day = 24 * 60 * 60 * 1000;
  return Date.parse(post.updatedAt) - Date.parse(post.publishedAt) > day;
}

// ── Authors ─────────────────────────────────────────────────────────────────

export type ResolvedAuthor = {
  name: string;
  /** Job title, e.g. "PhD Candidate". Absent for guests. */
  title?: string;
  /** ImageKit path of the People-page photo. */
  photo?: string;
  /** The People-page anchor for lab members; the guest's own link otherwise. */
  href?: string;
  /** Profile links from the team data, for sameAs and author cards. */
  links: string[];
  isMember: boolean;
};

type PersonRecord = {
  name?: string;
  title?: string;
  imagePath?: string;
  website?: string;
  links?: { url?: string }[];
};

/**
 * Names are compared without honorifics or accents, so a post credited to
 * "Ishtiaque Ahmed" still finds "Prof. Ishtiaque Ahmed" on the People page.
 */
function personKey(name: string): string {
  return nameSlug(name.replace(/^\s*(prof(essor)?|dr)\.?\s+/i, ""));
}

type Directory = Map<string, { record: PersonRecord; role: string }>;

let directory: Directory | undefined;

/** Everyone on the People page, keyed by `personKey`, with the role their anchor uses. */
function peopleDirectory(): Directory {
  if (directory) return directory;
  const { team, professor } = getContent() as unknown as {
    team?: {
      principalInvestigatorRole?: string;
      sections?: { role: string; members?: PersonRecord[] }[];
      alumni?: { members?: PersonRecord[] };
    };
    professor?: PersonRecord;
  };
  const map: Directory = new Map();
  const add = (record: PersonRecord | undefined, role: string) => {
    if (!record?.name) return;
    const key = personKey(record.name);
    // Current members win over alumni with the same name.
    if (!map.has(key)) map.set(key, { record, role });
  };
  // Same roles people/page.tsx passes to memberAnchor, so the links land on the right row.
  add(professor, team?.principalInvestigatorRole ?? "Principal Investigator");
  for (const section of team?.sections ?? []) {
    for (const member of section.members ?? []) add(member, section.role);
  }
  for (const member of team?.alumni?.members ?? []) add(member, "alumni");
  directory = map;
  return map;
}

/**
 * Exact match first; then a full name that ends with a listed name of at least
 * two words, so a paper's "Syed Ishtiaque Ahmed" finds the People page's
 * "Ishtiaque Ahmed". One-word names never match this way ("Ahmed" is common).
 */
function findPerson(name: string) {
  const key = personKey(name);
  const dir = peopleDirectory();
  const exact = dir.get(key);
  if (exact) return exact;
  for (const [listed, person] of dir) {
    if (listed.includes("-") && key.endsWith(`-${listed}`)) return person;
  }
  return undefined;
}

export function resolveAuthor(author: PostAuthor): ResolvedAuthor {
  const found = findPerson(author.name);
  if (!found) {
    return { name: author.name, href: author.url, links: author.url ? [author.url] : [], isMember: false };
  }
  const { record, role } = found;
  const links = [record.website, ...(record.links ?? []).map((l) => l.url)].filter(
    (url, i, all): url is string => !!url && all.indexOf(url) === i,
  );
  return {
    name: record.name as string,
    title: record.title,
    photo: record.imagePath || undefined,
    href: `/people#${memberAnchor(role, record.name as string)}`,
    links,
    isMember: true,
  };
}

export function resolveAuthors(post: Post): ResolvedAuthor[] {
  return post.authors.map(resolveAuthor);
}

/** For speakers on videos, who are plain names rather than PostAuthor objects. */
export function resolvePerson(name: string): ResolvedAuthor {
  return resolveAuthor({ name });
}

// ── Formatting ──────────────────────────────────────────────────────────────

/** "March 12, 2026", in Toronto time so a post published late evening keeps its date. */
export function formatPostDate(iso?: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Toronto",
  }).format(new Date(iso));
}

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

// ── Card data ───────────────────────────────────────────────────────────────

/**
 * What a post card needs, already formatted. Client components (the index's
 * tag filter) get this instead of importing this module, which would pull
 * every post body into the browser bundle.
 */
export type PostCardData = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  dateTime?: string;
  authors: string[];
  tags: string[];
  kinds: ResourceKind[];
  cover?: { url: string; alt: string };
};

export function toCardData(post: Post): PostCardData {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    date: formatPostDate(post.publishedAt),
    dateTime: post.publishedAt,
    authors: post.authors.map((a) => resolveAuthor(a).name),
    tags: post.tags ?? [],
    kinds: [...new Set((post.resources ?? []).map((r) => r.kind))],
    cover: post.cover?.path ? { url: getImageUrl(post.cover.path), alt: post.cover.alt ?? "" } : undefined,
  };
}
