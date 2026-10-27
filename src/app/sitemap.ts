import type { MetadataRoute } from "next";

import { getBlog, getPosts, getTagPages } from "@/lib/blog";
import { isVideo, videoMedia } from "@/lib/blog-resources";
import { getContent } from "@/lib/content";
import { xml } from "@/lib/feeds";
import { getResearch, getTopics } from "@/lib/research";
import { absoluteUrl } from "@/lib/site";
import { videoEmbedUrl } from "@/lib/structured-data";

export const dynamic = "force-static";

/**
 * Every public page. Posts carry their own last-modified date and their
 * embedded videos, which makes them eligible for Google's video results.
 * Values are escaped here because Next writes them into the XML as-is.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const { lastModified } = getContent() as { lastModified?: string };
  const site = lastModified ? new Date(lastModified) : undefined;
  const research = getResearch();
  const blog = getBlog();

  const pages: MetadataRoute.Sitemap = ["/", "/people", "/publications", "/news"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: site,
  }));

  if (research.enabled) {
    pages.push({ url: absoluteUrl("/research"), lastModified: site });
    for (const t of getTopics()) pages.push({ url: absoluteUrl(`/research/${t.slug}`), lastModified: site });
  }

  if (blog.enabled) {
    const posts = getPosts();
    pages.push({ url: absoluteUrl("/blog"), lastModified: posts[0] ? new Date(posts[0].updatedAt) : site });
    for (const t of getTagPages()) pages.push({ url: absoluteUrl(`/blog/tag/${t.slug}`) });
    for (const post of posts) {
      const videos = (post.resources ?? [])
        .filter(isVideo)
        .map((r) => ({ r, media: videoMedia(r) }))
        .filter(({ media }) => media.poster)
        .map(({ r, media }) => ({
          title: xml(media.title),
          thumbnail_loc: xml(media.poster),
          description: xml(r.description || post.summary),
          player_loc: videoEmbedUrl(r) ? xml(videoEmbedUrl(r)) : undefined,
          content_loc: media.videoSrc ? xml(media.videoSrc) : undefined,
          duration: r.durationSeconds ? Math.round(r.durationSeconds) : undefined,
          publication_date: r.recordedAt ?? post.publishedAt,
        }));
      pages.push({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: new Date(post.updatedAt),
        ...(videos.length ? { videos } : {}),
      });
    }
  }
  return pages;
}
