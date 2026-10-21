import { notFound } from "next/navigation";

import { ResearchTopicRow } from "@/components/research/research-topic-row";
import { RichText } from "@/components/research/rich-text";
import { getResearch, getTopics } from "@/lib/research";

const research = getResearch();

export const metadata = {
  title: research.page?.metaTitle,
  description: research.page?.metaDescription,
};

export default function ResearchPage() {
  // Turned off in the admin: the page does not exist (and the nav link is hidden).
  if (!research.enabled) notFound();

  const topics = getTopics();

  return (
    <main className="bg-background">
      {/* No bottom border: the footer draws its own divider. */}
      <section data-section="research" data-section-label={research.navLabel}>
        <div className="mx-auto w-full max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {research.page?.title}
            </h1>
            <RichText
              text={research.page?.intro}
              className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
            />
          </div>
        </div>
        {topics.length > 0 && (
          <div className="mx-auto mt-10 w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
            <ResearchTopicRow topics={topics} label={research.labels?.topicsNav} layout="grid" />
          </div>
        )}
      </section>
    </main>
  );
}
