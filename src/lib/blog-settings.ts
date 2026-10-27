import { getContent } from "@/lib/content";

// Blog settings live in config/site (content.json), apart from the posts, so
// client components such as the navbar can read them without pulling every
// post into the browser bundle. Server code can import them from "@/lib/blog".

export type BlogLabels = {
  inShort: string;
  keyFindings: string;
  updated: string;
  /** "{n}" is replaced with the number of minutes. */
  readingTime: string;
  by: string;
  tags: string;
  share: string;
  copyLink: string;
  linkCopied: string;
  authors: string;
  relatedResearch: string;
  relatedPosts: string;
  onThisPage: string;
  allPosts: string;
  latest: string;
  /** "{tag}" is replaced with the tag. */
  taggedWith: string;
  noPosts: string;
  moved: string;
  resources: string;
  fromTheBlog: string;
};

export type BlogContent = {
  /** Turns the whole blog (pages + nav link + home section) on or off. */
  enabled?: boolean;
  navLabel?: string;
  page?: {
    title?: string;
    intro?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  home?: {
    enabled?: boolean;
    headline?: string;
    seeAllLabel?: string;
  };
  labels?: Partial<BlogLabels>;
};

// ── Settings ────────────────────────────────────────────────────────────────

/** Used until someone edits the labels in admin, so a new blog still reads well. */
export const DEFAULT_BLOG_LABELS: BlogLabels = {
  inShort: "In short",
  keyFindings: "Key findings",
  updated: "Updated",
  readingTime: "{n} min read",
  by: "By",
  tags: "Tags",
  share: "Share",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  authors: "Authors",
  relatedResearch: "Related research",
  relatedPosts: "More from the blog",
  onThisPage: "On this page",
  allPosts: "All posts",
  latest: "Latest",
  taggedWith: "Posts tagged “{tag}”",
  noPosts: "No posts yet.",
  moved: "This post has moved.",
  resources: "Paper, code and videos",
  fromTheBlog: "From the blog",
};

/**
 * `content.json` is generated from Firestore, so its inferred type only has
 * the `blog` fields the live document happens to contain right now.
 */
export function getBlog(): BlogContent {
  return ((getContent() as { blog?: BlogContent }).blog ?? {}) as BlogContent;
}

export function getBlogLabels(): BlogLabels {
  const labels = getBlog().labels ?? {};
  // Blank strings in admin fall back to the default rather than rendering nothing.
  const filled = Object.fromEntries(Object.entries(labels).filter(([, v]) => typeof v === "string" && v.trim()));
  return { ...DEFAULT_BLOG_LABELS, ...filled };
}
