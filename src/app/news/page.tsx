import { getNews } from "@/lib/news";
import { NewsArchive } from "./news-archive";

const news = getNews();

export const metadata = {
  title: news.page?.metaTitle,
  description: news.page?.metaDescription,
};

export default function NewsPage() {
  const hasItems = (news.items ?? []).length > 0;

  return (
    <main className="bg-background">
      <section data-section="news" data-section-label="News" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.14]">
            {news.page?.title}
          </h1>
          {news.page?.subhead && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {news.page.subhead}
            </p>
          )}
          {!hasItems && news.emptyLabel && (
            <p className="mt-10 text-sm text-muted-foreground">{news.emptyLabel}</p>
          )}
        </div>
      </section>

      {hasItems && <NewsArchive news={news} />}
    </main>
  );
}
