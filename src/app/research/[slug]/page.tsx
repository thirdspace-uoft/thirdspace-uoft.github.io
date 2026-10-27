import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { ResearchFigure } from "@/components/research/research-figure";
import { ResearchTopicRow } from "@/components/research/research-topic-row";
import { RichText } from "@/components/research/rich-text";
import { getResearch, getTopic, getTopics } from "@/lib/research";
import { PostCard } from "@/components/blog/post-card";
import { ResourceKinds } from "@/components/blog/resource-kinds";
import { getBlog, getBlogLabels, getPostsByTopic, toCardData } from "@/lib/blog";

/** Static export: only the topics that exist at build time get a page. */
export const dynamicParams = false;

/** Placeholder param when there are no topics — an empty list fails `output: "export"`. */
const NO_TOPICS = "_";

export function generateStaticParams() {
  const slugs = getTopics().map((t) => ({ slug: t.slug as string }));
  return slugs.length > 0 ? slugs : [{ slug: NO_TOPICS }];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  const research = getResearch();
  if (!topic) return {};
  return {
    title: [topic.title, research.page?.metaTitle].filter(Boolean).join(" — "),
    description: topic.metaDescription ?? topic.summary,
  };
}

export default async function ResearchTopicPage({ params }: Props) {
  const { slug } = await params;
  const research = getResearch();
  const topic = getTopic(slug);
  if (!research.enabled || !topic) notFound();

  const sections = topic.sections ?? [];
  // Posts linked to this topic in the blog editor; none while the blog is off.
  const posts = getBlog().enabled ? getPostsByTopic(topic.slug as string).map(toCardData) : [];
  const blogLabels = getBlogLabels();

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8 sm:pt-10">
        <ResearchTopicRow topics={getTopics()} activeSlug={topic.slug} label={research.labels?.topicsNav} />
      </div>

      <article className="mx-auto w-full max-w-4xl px-5 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
        <header data-section={`research-${topic.slug}`} data-section-label={topic.title} className="space-y-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {topic.title}
          </h1>
          <ResearchFigure figure={topic.hero} labels={research.labels} priority />
          <RichText text={topic.intro} className="text-base leading-relaxed text-foreground/85 sm:text-lg" />
        </header>

        {sections.map((section, i) => (
          <section
            key={section.id ?? i}
            data-section={`research-${topic.slug}-${i}`}
            data-section-label={section.heading}
            className="mt-14 space-y-5 border-t border-border pt-10 sm:mt-16"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{section.heading}</h2>
            <ResearchFigure figure={section.figure} labels={research.labels} />
            <RichText text={section.body} className="text-base leading-relaxed text-foreground/85" />

            {(section.papers ?? []).some((p) => p.title) && (
              <div className="rounded-xl border border-border/70 bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{research.labels?.relatedPapers}</h3>
                <ul className="mt-3 space-y-2.5">
                  {(section.papers ?? [])
                    .filter((p) => p.title)
                    .map((paper, j) => (
                      <li key={j} className="text-sm leading-snug">
                        {paper.url ? (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-foreground underline decoration-primary/25 underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
                          >
                            {paper.title}
                            <ArrowUpRight className="ml-0.5 inline size-3 align-[-1px]" />
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{paper.title}</span>
                        )}
                        {(paper.venue || paper.year) && (
                          <span className="ml-1.5 text-muted-foreground">
                            {/* Venues usually already carry the year ("CHI 2024"); don't repeat it. */}
                            {[paper.venue, paper.year && !paper.venue?.includes(paper.year) ? paper.year : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        ))}

        {posts.length > 0 && (
          <section
            data-section={`research-${topic.slug}-blog`}
            data-section-label={blogLabels.fromTheBlog}
            className="mt-14 space-y-6 border-t border-border pt-10 sm:mt-16"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{blogLabels.fromTheBlog}</h2>
            <ul className="space-y-8">
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} kindsSlot={<ResourceKinds kinds={post.kinds} />} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
