import type { PostResource, ResourceKind, VideoProvider } from "@/lib/blog";
import { videoPoster } from "@/lib/research";
import { getImageUrl } from "@/lib/utils";

// Helpers for showing a post's resources. The build script has its own copies
// of the URL parsing (scripts/lib/resources-enrich.mjs) since it can't import
// TypeScript; keep the patterns in step.

const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
const GITHUB = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/i;
const ARXIV = /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(?:v\d+)?/i;

export const youtubeId = (url = "") => url.match(YOUTUBE)?.[1] ?? null;
export const vimeoId = (url = "") => url.match(VIMEO)?.[1] ?? null;

export function videoProvider(r: Pick<PostResource, "provider" | "url">): VideoProvider {
  if (r.provider) return r.provider;
  if (youtubeId(r.url)) return "youtube";
  if (vimeoId(r.url)) return "vimeo";
  if (!/^https?:\/\//i.test(r.url) || /\.(mp4|webm|mov)(\?|$)/i.test(r.url)) return "imagekit";
  return "other";
}

/** Videos, plus demos that are videos rather than web apps. */
export function isVideo(r: PostResource): boolean {
  if (r.kind === "video") return true;
  return r.kind === "demo" && videoProvider(r) !== "other";
}

/** A resource built from a bare URL, for links pasted into the body that aren't in the list. */
export function resourceFromUrl(url: string): PostResource {
  const gh = url.match(GITHUB);
  if (gh) return { id: url, kind: "code", url, title: `${gh[1]}/${gh[2]}`, repo: { fullName: `${gh[1]}/${gh[2]}` } };
  const arxiv = url.match(ARXIV)?.[1];
  if (arxiv) return { id: url, kind: "paper", url, title: `arXiv:${arxiv}`, arxivId: arxiv, pdfUrl: `https://arxiv.org/pdf/${arxiv}` };
  const yt = youtubeId(url);
  if (yt) return { id: url, kind: "video", url, title: "", provider: "youtube", thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` };
  if (vimeoId(url)) return { id: url, kind: "video", url, title: "", provider: "vimeo" };
  return { id: url, kind: "link", url, title: url };
}

/** The resource marked primary for a kind, else the first of that kind. */
export function primaryOf(resources: PostResource[], kind: ResourceKind): PostResource | undefined {
  const ofKind = resources.filter((r) => r.kind === kind);
  return ofKind.find((r) => r.primary) ?? ofKind[0];
}

/** The video shown above the body: the primary video, else the primary demo if it's a video. */
export function featuredVideo(resources: PostResource[]): PostResource | undefined {
  return resources.find((r) => r.primary && r.kind === "video") ?? resources.find((r) => r.primary && r.kind === "demo" && isVideo(r));
}

/** Everything a player needs, resolved on the server so the client gets plain URLs. */
export type VideoMedia = {
  title: string;
  url: string;
  /** Iframe URL, loaded only after the reader presses play. */
  embedSrc?: string;
  /** ImageKit video file for a native <video>. */
  videoSrc?: string;
  poster?: string;
  duration?: string;
};

export function videoMedia(r: PostResource): VideoMedia {
  const provider = videoProvider(r);
  const poster = r.thumbnail ? getImageUrl(r.thumbnail) : undefined;
  const base = { title: r.title || "Video", url: r.url, duration: formatDuration(r.durationSeconds) };
  if (provider === "youtube") {
    const id = youtubeId(r.url);
    return {
      ...base,
      // youtube-nocookie: no YouTube cookies until the reader plays the video.
      embedSrc: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      poster: poster ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  if (provider === "vimeo") {
    return { ...base, embedSrc: `https://player.vimeo.com/video/${vimeoId(r.url)}?autoplay=1&dnt=1`, poster };
  }
  if (provider === "imagekit") {
    return { ...base, videoSrc: getImageUrl(r.url), poster: poster ?? videoPoster(r.url) };
  }
  return { ...base, poster };
}

/** 3725 → "1:02:05", 90 → "1:30". */
export function formatDuration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "https://www.example.org/x" → "example.org" */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** "March 2026" */
export function formatMonth(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

/** An APA-style reference: "Rifat, M. R., & Ahmed, S. I. (2024). Title. Venue. https://doi.org/…" */
export function apaFor(r: PostResource): string {
  const names = (r.authors ?? "").split(/,\s*/).filter(Boolean).map((full) => {
    const parts = full.trim().split(/\s+/);
    const family = parts.pop() ?? "";
    const initials = parts.map((p) => `${p.charAt(0)}.`).join(" ");
    return initials ? `${family}, ${initials}` : family;
  });
  const authors =
    names.length <= 1 ? names.join("") : names.length === 2 ? `${names[0]}, & ${names[1]}` : `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}`;
  const link = r.doi ? `https://doi.org/${r.doi}` : r.url;
  return [authors && `${authors} (${r.year || "n.d."}).`, `${r.title}.`, r.venue && `${r.venue}.`, link]
    .filter(Boolean)
    .join(" ");
}

/** GitHub's colours for the languages a lab repo is likely to use. */
export const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  R: "#198CE7",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89E051",
};
