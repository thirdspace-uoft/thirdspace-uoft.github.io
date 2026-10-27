import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";

import { AuthorCards } from "@/components/blog/author-cards";
import { AuthorNames } from "@/components/blog/byline";
import { Markdown } from "@/components/blog/markdown";
import { PostCard } from "@/components/blog/post-card";
import { ResourceBar } from "@/components/blog/resources/resource-bar";
import { ResourcesSection } from "@/components/blog/resources/resources-section";
import { VideoTile } from "@/components/blog/resources/video-tile";
import { ShareLinks } from "@/components/blog/share-links";
import { TableOfContents } from "@/components/blog/table-of-contents";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  fill,
  formatPostDate,
  getBlog,
  getBlogLabels,
  getPost,
  getPostByPreviousSlug,
  getPosts,
  getRelatedPosts,
  getTagPages,
  readingTime,
  resolveAuthors,
  tagSlug,
  toCardData,
  wasUpdated,
  type Post,
} from "@/lib/blog";
import { postHeadings } from "@/lib/blog-headings";
import { featuredVideo, primaryOf } from "@/lib/blog-resources";
import { blogPostingLd, breadcrumbLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { getContent } from "@/lib/content";
import { getResearch, getTopic } from "@/lib/research";
import { absoluteUrl, shareImageUrl } from "@/lib/site";
import { getImageUrl } from "@/lib/utils";

/** Static export: only posts that exist at build time get a page. */
export const dynamicParams = false;

/** Placeholder param when there are no posts — an empty list fails `output: "export"`. */
const NO_POSTS = "_";

/**
 * Every current slug, plus every old one. GitHub Pages can't redirect, so an
 * old slug gets a small page that forwards to the new address instead.
 */
export function generateStaticParams() {
  const posts = getPosts();
  const slugs = [...posts.map((p) => p.slug), ...posts.flatMap((p) => p.previousSlugs ?? [])];
  // A slug can't be both current and old; if it is, the current post wins (getPost runs first).
  const unique = [...new Set(slugs)];
  return unique.length > 0 ? unique.map((slug) => ({ slug })) : [{ slug: NO_POSTS }];
}

type Props = { params: Promise<{ slug: string }> };

/**
 * The share card: the editor's share image if there is one (cropped by
 * ImageKit to 1200×630 JPEG), else the title card generated at build.
 */
function shareImage(post: Post) {
  if (post.ogImage?.path) {
    return { url: shareImageUrl(getImageUrl(post.ogImage.path)), width: 1200, height: 630, alt: post.ogImage.alt ?? "" };
  }
  return { url: absoluteUrl(`/blog/${post.slug}/og.png`), width: 1200, height: 630, alt: post.title };
}

/**
 * Google Scholar's tags, from the post's primary paper. They describe the
 * paper the post is about, so Scholar can link the two.
 */
function citationTags(post: Post): Record<string, string | string[]> {
  const paper = primaryOf(post.resources ?? [], "paper");
  if (!paper?.title) return {};
  const conference = /\b(conference|proceedings|symposium|workshop|chi|cscw|acl|emnlp|naacl|facct|aaai|www|ictd)\b/i.test(paper.venue ?? "");
  const tags: Record<string, string | string[]> = { citation_title: paper.title };
  const authors = (paper.authors ?? "").split(/,\s*/).filter(Boolean);
  if (authors.length) tags.citation_author = authors;
  if (paper.year) tags.citation_publication_date = paper.year;
  if (paper.venue) tags[conference ? "citation_conference_title" : "citation_journal_title"] = paper.venue;
  if (paper.doi) tags.citation_doi = paper.doi;
  if (paper.pdfUrl) tags.citation_pdf_url = paper.pdfUrl;
  if (paper.arxivId) tags.citation_arxiv_id = paper.arxivId;
  return tags;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    const moved = getPostByPreviousSlug(slug);
    if (!moved) return {};
    // The old address forwards; search engines should index only the new one.
    return {
      title: moved.title,
      robots: { index: false, follow: true },
      alternates: { canonical: `/blog/${moved.slug}` },
    };
  }

  const { socials } = getContent();
  const image = shareImage(post);
  const authors = resolveAuthors(post);
  const topic = post.researchTopicSlug ? getTopic(post.researchTopicSlug) : undefined;
  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `/blog/${post.slug}`,
      types: {
        // The same post as plain Markdown, for tools that read text rather than HTML.
        "text/markdown": `/blog/${post.slug}/index.md`,
        "application/rss+xml": "/blog/rss.xml",
      },
    },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: authors.map((a) => a.name),
      tags: post.tags,
      section: topic?.title,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      site: socials?.xHandle,
      title: post.title,
      description: post.summary,
      images: [image],
    },
    other: citationTags(post),
  };
}

/** What an old slug renders: an instant forward plus a link for anyone it doesn't reach. */
function MovedPage({ post, message }: { post: Post; message: string }) {
  const href = `/blog/${post.slug}`;
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
      <meta httpEquiv="refresh" content={`0; url=${href}`} />
      <p className="text-lg text-foreground">
        {message}{" "}
        <Link href={href} className="font-semibold text-primary underline underline-offset-2">
          {post.title}
        </Link>
      </p>
    </main>
  );
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const blog = getBlog();
  if (!blog.enabled) notFound();

  const labels = getBlogLabels();
  const post = getPost(slug);
  if (!post) {
    const moved = getPostByPreviousSlug(slug);
    if (!moved) notFound();
    return <MovedPage post={moved} message={labels.moved} />;
  }

  const { socials } = getContent();
  const authors = resolveAuthors(post);
  const resources = post.resources ?? [];
  const featured = featuredVideo(resources);
  // The featured video already plays above the body; listing it again below would repeat it.
  const listed = resources.filter((r) => r !== featured);
  // The resources section is part of the page outline, so it's in the table of contents too.
  const headings = [...postHeadings(post.body), ...(listed.length > 0 ? [{ id: "resources", text: labels.resources }] : [])];
  const tagPages = new Set(getTagPages().map((t) => t.slug));
  const research = getResearch();
  const topic = research.enabled && post.researchTopicSlug ? getTopic(post.researchTopicSlug) : undefined;
  const related = getRelatedPosts(post).map(toCardData);
  const url = absoluteUrl(`/blog/${post.slug}`);
  const blogTitle = blog.page?.title ?? blog.navLabel ?? "Blog";

  return (
    <main className="bg-background">
      <JsonLd
        data={[
          blogPostingLd(post, shareImage(post).url),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: blogTitle, path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <article className="mx-auto w-full max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-10 sm:pb-24">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/blog">{blogTitle}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mt-8 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.1]">
            {post.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {authors.length > 0 && (
              <>
                {labels.by} <AuthorNames authors={authors} />
                <span aria-hidden> · </span>
              </>
            )}
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
            {wasUpdated(post) && (
              <>
                <span aria-hidden> · </span>
                {labels.updated} <time dateTime={post.updatedAt}>{formatPostDate(post.updatedAt)}</time>
              </>
            )}
            <span aria-hidden> · </span>
            {fill(labels.readingTime, { n: readingTime(post.body) })}
          </p>
          <ResourceBar resources={resources} />
        </header>

        {post.cover?.path && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
          <img
            src={`${getImageUrl(post.cover.path)}?tr=w-1600,h-900,fo-auto`}
            alt={post.cover.alt ?? ""}
            width={1600}
            height={900}
            fetchPriority="high"
            className="mt-8 aspect-video w-full max-w-4xl rounded-xl border border-border object-cover"
          />
        )}

        {/* The summary up top, readable on its own: what search snippets and AI answers quote. */}
        <section aria-labelledby="in-short" className="mt-8 max-w-3xl rounded-xl border border-border bg-muted/40 p-5 sm:p-6">
          <h2 id="in-short" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {labels.inShort}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-foreground sm:text-lg">{post.summary}</p>
          {(post.keyFindings ?? []).filter(Boolean).length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{labels.keyFindings}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-foreground/90 marker:text-primary">
                {(post.keyFindings ?? []).filter(Boolean).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {featured && (
          <div className="mt-8 max-w-4xl">
            <VideoTile resource={featured} featured />
          </div>
        )}

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,48rem)_14rem] lg:justify-between lg:gap-12">
          <Markdown body={post.body} resources={post.resources} />
          {headings.length >= 3 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} label={labels.onThisPage} />
              </div>
            </aside>
          )}
        </div>

        <ResourcesSection resources={listed} label={labels.resources} />

        <footer className="mt-16 max-w-3xl space-y-10 border-t border-border pt-10">
          {(post.tags ?? []).length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">{labels.tags}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(post.tags ?? []).map((tag) => {
                  const chip = "inline-flex min-h-9 items-center rounded-full border border-border px-3 text-sm text-muted-foreground";
                  return (
                    <li key={tag}>
                      {tagPages.has(tagSlug(tag)) ? (
                        <Link href={`/blog/tag/${tagSlug(tag)}`} className={`${chip} hover:border-foreground/30 hover:text-foreground`}>
                          {tag}
                        </Link>
                      ) : (
                        <span className={chip}>{tag}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <ShareLinks url={url} title={post.title} xHandle={socials?.xHandle} labels={labels} />

          <AuthorCards authors={authors} label={labels.authors} />

          {topic && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">{labels.relatedResearch}</h2>
              <Link href={`/research/${topic.slug}`} className="mt-2 inline-block font-semibold text-primary hover:underline">
                {topic.title} →
              </Link>
            </div>
          )}
        </footer>

        {related.length > 0 && (
          <section aria-labelledby="related-posts" className="mt-16 border-t border-border pt-10">
            <h2 id="related-posts" className="text-xl font-bold tracking-tight text-foreground">
              {labels.relatedPosts}
            </h2>
            <ul className="mt-6 grid gap-8 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
