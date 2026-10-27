import { CodeXml, Scale, Star } from "lucide-react";

import { button, card, cardTitle, meta } from "@/components/blog/resources/styles";
import type { PostResource } from "@/lib/blog";
import { formatMonth, hostname, LANGUAGE_COLORS } from "@/lib/blog-resources";

/**
 * A repository. GitHub repos show the details the build fetched (stars,
 * language, license, last push); if that lookup failed, or the code is on
 * GitLab or Hugging Face, the card is just the name and a link.
 */
export function CodeCard({ resource: r }: { resource: PostResource }) {
  const repo = r.repo;
  const host = hostname(r.url);
  const isGitHub = host === "github.com";
  const updated = formatMonth(repo?.updatedAt);
  const stats = [
    repo?.language && (
      <span key="lang" className="inline-flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-full" style={{ background: LANGUAGE_COLORS[repo.language] ?? "var(--muted-foreground)" }} />
        {repo.language}
      </span>
    ),
    typeof repo?.stars === "number" && (
      <span key="stars" className="inline-flex items-center gap-1">
        <Star className="size-3.5" aria-hidden />
        {repo.stars.toLocaleString("en-CA")} <span className="sr-only">stars</span>
      </span>
    ),
    repo?.license && (
      <span key="license" className="inline-flex items-center gap-1">
        <Scale className="size-3.5" aria-hidden />
        {repo.license}
      </span>
    ),
    updated && <span key="updated">Updated {updated}</span>,
  ].filter(Boolean);

  return (
    <article className={card}>
      <h4 className={`${cardTitle} flex items-center gap-2`}>
        <CodeXml className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words hover:text-primary hover:underline">
          {repo?.fullName ?? r.title}
        </a>
      </h4>
      {(r.description || repo?.description) && (
        <p className="mt-1.5 text-sm text-foreground/80">{r.description || repo?.description}</p>
      )}
      {stats.length > 0 && <p className={`mt-2.5 flex flex-wrap gap-x-4 gap-y-1 ${meta}`}>{stats}</p>}
      <div className="mt-4">
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={button}>
          {isGitHub ? "View on GitHub" : `View on ${host}`}
        </a>
      </div>
    </article>
  );
}
