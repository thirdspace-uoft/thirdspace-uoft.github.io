import {
  getBlog,
  resolveAuthors,
  resolvePerson,
  wordCount,
  type Post,
  type PostResource,
  type ResolvedAuthor,
} from "@/lib/blog";
import { isVideo, videoMedia, videoProvider, vimeoId, youtubeId } from "@/lib/blog-resources";
import { getContent } from "@/lib/content";
import { memberAnchor } from "@/lib/people";
import { getTopic } from "@/lib/research";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { getImageUrl } from "@/lib/utils";

// schema.org data for search engines and AI systems. Things refer to each
// other by @id (the lab, the site, the blog), so a post's publisher and its
// authors' affiliation resolve to the same organisation everywhere.

type Thing = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BLOG_ID = `${SITE_URL}/blog#blog`;

const UOFT = { "@type": "CollegeOrUniversity", name: "University of Toronto", url: "https://www.utoronto.ca" };

/** "Toronto, ON M5S 2E4, Canada" → its parts; anything else stays whole. */
function postalAddress(street?: string, cityCountry?: string): Thing | undefined {
  if (!street && !cityCountry) return undefined;
  const m = cityCountry?.match(/^(.*?),\s*([A-Z]{2})\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d),\s*(.+)$/);
  return {
    "@type": "PostalAddress",
    streetAddress: street,
    ...(m
      ? { addressLocality: m[1], addressRegion: m[2], postalCode: m[3], addressCountry: m[4] === "Canada" ? "CA" : m[4] }
      : { addressLocality: cityCountry }),
  };
}

/** The lab, described once in the root layout. */
export function organizationLd(): Thing {
  const { brand, location, socials, layout } = getContent();
  return {
    "@type": "ResearchOrganization",
    "@id": ORG_ID,
    name: brand?.name ?? "ThirdSpace",
    url: SITE_URL,
    logo: absoluteUrl("/square_logo.webp"),
    description: brand?.footerDescription ?? layout?.pageDescription,
    address: postalAddress(location?.street, location?.cityCountry),
    parentOrganization: UOFT,
    email: socials?.email,
    sameAs: [socials?.xUrl].filter(Boolean),
  };
}

export function websiteLd(): Thing {
  const { layout } = getContent();
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: layout?.pageTitle,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function personLd(a: ResolvedAuthor): Thing {
  return {
    "@type": "Person",
    name: a.name,
    url: a.href ? (a.isMember ? absoluteUrl(a.href) : a.href) : undefined,
    jobTitle: a.title,
    image: a.photo ? getImageUrl(a.photo) : undefined,
    ...(a.isMember ? { affiliation: { "@id": ORG_ID } } : {}),
    sameAs: a.links.length ? a.links : undefined,
  };
}

/** Every lab member on the People page, so AI systems can tie authors to the lab. */
export function peopleLd(): Thing {
  const { team, professor } = getContent() as unknown as {
    team: { principalInvestigatorRole: string; sections: { role: string; members?: { name: string }[] }[] };
    professor: { name: string };
  };
  const people = [
    { role: team.principalInvestigatorRole, name: professor.name },
    ...team.sections.flatMap((s) => (s.members ?? []).map((m) => ({ role: s.role, name: m.name }))),
  ];
  return {
    "@type": "ItemList",
    itemListElement: people.map((p, i) => {
      const resolved = resolvePerson(p.name);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: { ...personLd(resolved), "@id": absoluteUrl(`/people#${memberAnchor(p.role, p.name)}`) },
      };
    }),
  };
}

/** 3725 → "PT1H2M5S" */
export function isoDuration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s % 60 || (!h && !m) ? `${s % 60}S` : ""}`;
}

/** A player URL without autoplay, for embedUrl and the video sitemap. */
export function videoEmbedUrl(r: PostResource): string | undefined {
  const provider = videoProvider(r);
  if (provider === "youtube") return `https://www.youtube-nocookie.com/embed/${youtubeId(r.url)}`;
  if (provider === "vimeo") return `https://player.vimeo.com/video/${vimeoId(r.url)}`;
  return undefined;
}

/** Everything Google needs for a video result: name, description, thumbnail and upload date. */
export function videoLd(r: PostResource, post: Post): Thing | undefined {
  const media = videoMedia(r);
  if (!media.poster) return undefined;
  return {
    "@type": "VideoObject",
    name: media.title,
    description: r.description || [r.videoType, r.event].filter(Boolean).join(", ") || post.summary,
    thumbnailUrl: media.poster,
    uploadDate: r.recordedAt ?? post.publishedAt,
    duration: isoDuration(r.durationSeconds),
    embedUrl: videoEmbedUrl(r),
    contentUrl: media.videoSrc,
    url: r.url,
  };
}

function paperLd(r: PostResource): Thing {
  return {
    "@type": "ScholarlyArticle",
    headline: r.title,
    name: r.title,
    url: r.doi ? `https://doi.org/${r.doi}` : r.url,
    author: (r.authors ?? "").split(/,\s*/).filter(Boolean).map((name) => ({ "@type": "Person", name })),
    datePublished: r.year,
    isPartOf: r.venue ? { "@type": "CreativeWork", name: r.venue } : undefined,
    identifier: r.doi ? { "@type": "PropertyValue", propertyID: "DOI", value: r.doi } : undefined,
    sameAs: [r.doi && `https://doi.org/${r.doi}`, r.arxivId && `https://arxiv.org/abs/${r.arxivId}`].filter(Boolean),
  };
}

function resourceLd(r: PostResource): Thing | undefined {
  switch (r.kind) {
    case "code":
      return {
        "@type": "SoftwareSourceCode",
        name: r.repo?.fullName ?? r.title,
        description: r.description ?? r.repo?.description,
        codeRepository: r.url,
        programmingLanguage: r.repo?.language,
        license: r.repo?.license ? `https://spdx.org/licenses/${r.repo.license}` : undefined,
      };
    case "dataset":
      return {
        "@type": "Dataset",
        name: r.title,
        description: r.description ?? r.title,
        url: r.url,
        license: r.license,
        creator: { "@id": ORG_ID },
      };
    case "project":
    case "demo":
    case "slides":
    case "poster":
      return { "@type": "CreativeWork", name: r.title, url: r.url, description: r.description };
    default:
      return undefined;
  }
}

/**
 * The post, with its resources as linked entities: papers as citations,
 * videos as parts of the post, code, data and project pages as mentions.
 */
export function blogPostingLd(post: Post, shareImage: string): Thing {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const resources = post.resources ?? [];
  const videos = resources.filter(isVideo).map((r) => videoLd(r, post)).filter(Boolean);
  const papers = resources.filter((r) => r.kind === "paper").map(paperLd);
  const mentions = resources.filter((r) => !isVideo(r) && r.kind !== "paper").map(resourceLd).filter(Boolean);
  const topic = post.researchTopicSlug ? getTopic(post.researchTopicSlug) : undefined;
  return {
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: post.title,
    description: post.summary,
    url,
    mainEntityOfPage: url,
    image: [shareImage, post.cover?.path ? getImageUrl(post.cover.path) : null].filter(Boolean),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: resolveAuthors(post).map(personLd),
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": BLOG_ID },
    inLanguage: "en",
    keywords: post.tags?.join(", "),
    articleSection: topic?.title,
    wordCount: wordCount(post.body),
    citation: papers.length ? papers : undefined,
    hasPart: videos.length ? videos : undefined,
    mentions: mentions.length ? mentions : undefined,
  };
}

export function blogLd(posts: Post[]): Thing {
  const blog = getBlog();
  return {
    "@type": "Blog",
    "@id": BLOG_ID,
    name: blog.page?.title ?? "Blog",
    description: blog.page?.metaDescription,
    url: absoluteUrl("/blog"),
    publisher: { "@id": ORG_ID },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(`/blog/${p.slug}`)}#post`,
      headline: p.title,
      url: absoluteUrl(`/blog/${p.slug}`),
      datePublished: p.publishedAt,
      author: resolveAuthors(p).map((a) => ({ "@type": "Person", name: a.name })),
    })),
  };
}
