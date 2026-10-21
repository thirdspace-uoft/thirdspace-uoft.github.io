import { getContent } from "@/lib/content";
import { getImageUrl } from "@/lib/utils";

export type ResearchMediaType = "image" | "video" | "youtube";

/**
 * One visual. `image` covers PNG/JPG/WebP and GIF (GIFs animate on their own);
 * `video` is an ImageKit video file; `youtube` is a YouTube link.
 */
export type ResearchMedia = {
  type?: ResearchMediaType;
  path?: string;
  alt?: string;
};

export type ResearchFigure = {
  media?: ResearchMedia[];
  /** Supports [text](url) links. */
  caption?: string;
};

export type ResearchPaper = {
  title?: string;
  venue?: string;
  year?: string;
  url?: string;
};

export type ResearchSection = {
  id?: string;
  heading?: string;
  /** Paragraphs separated by blank lines; supports [text](url) links. */
  body?: string;
  figure?: ResearchFigure;
  papers?: ResearchPaper[];
};

export type ResearchTopic = {
  id?: string;
  /** URL segment: /research/<slug>. */
  slug?: string;
  title?: string;
  summary?: string;
  metaDescription?: string;
  /** Shown on the topic card. */
  cover?: ResearchMedia;
  intro?: string;
  hero?: ResearchFigure;
  sections?: ResearchSection[];
};

export type ResearchContent = {
  /** Turns the whole research section (pages + nav link) on or off. */
  enabled?: boolean;
  navLabel?: string;
  page?: {
    title?: string;
    intro?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  labels?: {
    previous?: string;
    next?: string;
    /** "{n}" is replaced with the slide number, e.g. "Show image {n}". */
    goToSlide?: string;
    relatedPapers?: string;
    /** Screen-reader name of the topic row. */
    topicsNav?: string;
  };
  topics?: ResearchTopic[];
};

/**
 * `content.json` is generated from Firestore, so its inferred type only has
 * the `research` fields the live document happens to contain right now.
 */
export function getResearch(): ResearchContent {
  return ((getContent() as { research?: ResearchContent }).research ?? {}) as ResearchContent;
}

/** "Faith, Culture & Knowledge" → "faith-culture-knowledge". */
export function topicSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTopics(): ResearchTopic[] {
  return (getResearch().topics ?? []).filter((t) => t.slug);
}

export function getTopic(slug: string): ResearchTopic | undefined {
  return getTopics().find((t) => t.slug === slug);
}

const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i;

/** Type from the path when the editor didn't set one. */
export function detectMediaType(path = ""): ResearchMediaType {
  if (YOUTUBE.test(path)) return "youtube";
  if (/\.(mp4|webm|mov)(\?|$)/i.test(path)) return "video";
  return "image";
}

export function mediaType(media: ResearchMedia): ResearchMediaType {
  return media.type ?? detectMediaType(media.path);
}

/** Privacy-enhanced embed URL, or null if the link isn't a YouTube video. */
export function youtubeEmbedUrl(url = ""): string | null {
  const id = url.match(YOUTUBE)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** ImageKit generates a poster frame for any video at `<video>/ik-thumbnail.jpg`. */
export function videoPoster(path: string): string {
  return `${getImageUrl(path)}/ik-thumbnail.jpg`;
}

/** Media entries that actually point at something. */
export function presentMedia(list?: ResearchMedia[]): ResearchMedia[] {
  return (list ?? []).filter((m) => m.path);
}
