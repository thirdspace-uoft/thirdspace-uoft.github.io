import { ArrowUpRight, Database, Globe, MonitorPlay, Presentation, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

import { badge, button, card, cardTitle, meta, primaryButton } from "@/components/blog/resources/styles";
import { formatPostDate, type PostResource } from "@/lib/blog";
import { hostname } from "@/lib/blog-resources";
import { getImageUrl } from "@/lib/utils";

function Thumbnail({ r }: { r: PostResource }) {
  if (!r.thumbnail) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
    <img
      src={getImageUrl(r.thumbnail)}
      alt=""
      width={640}
      height={360}
      loading="lazy"
      className="mb-4 aspect-video w-full rounded-lg border border-border object-cover"
    />
  );
}

/** Project website or a web demo: what it is, where it lives, one button. */
export function ProjectCard({ resource: r }: { resource: PostResource }) {
  const Icon = r.kind === "demo" ? MonitorPlay : Globe;
  return (
    <article className={card}>
      <Thumbnail r={r} />
      <h4 className={`${cardTitle} flex items-center gap-2`}>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {r.title}
      </h4>
      {r.description && <p className="mt-1.5 text-sm text-foreground/80">{r.description}</p>}
      <p className={`mt-1 ${meta}`}>{hostname(r.url)}</p>
      <div className="mt-4">
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={primaryButton}>
          {r.kind === "demo" ? "Try the demo" : "Open project"}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export function DatasetCard({ resource: r }: { resource: PostResource }) {
  const facts = [r.size, r.license, hostname(r.url)].filter(Boolean);
  return (
    <article className={card}>
      <h4 className={`${cardTitle} flex items-center gap-2`}>
        <Database className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {r.title}
      </h4>
      {r.description && <p className="mt-1.5 text-sm text-foreground/80">{r.description}</p>}
      {facts.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {facts.map((f) => (
            <li key={f} className={badge}>{f}</li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={button}>
          Get the data
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

/** Slides and posters: optional thumbnail and a button; PDFs open in a new tab. */
export function SlidesCard({ resource: r }: { resource: PostResource }) {
  const Icon = r.kind === "poster" ? ImageIcon : Presentation;
  return (
    <article className={card}>
      <Thumbnail r={r} />
      <h4 className={`${cardTitle} flex items-center gap-2`}>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {r.title}
      </h4>
      {r.description && <p className="mt-1.5 text-sm text-foreground/80">{r.description}</p>}
      <div className="mt-4">
        <a href={r.url} target="_blank" rel="noopener noreferrer" className={button}>
          {r.kind === "poster" ? "View poster" : "View slides"}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}

export function LinkCard({ resource: r }: { resource: PostResource }) {
  return (
    <article className={card}>
      <h4 className={`${cardTitle} flex items-center gap-2`}>
        <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words hover:text-primary hover:underline">
          {r.title || r.url}
        </a>
      </h4>
      {r.description && <p className="mt-1.5 text-sm text-foreground/80">{r.description}</p>}
      <p className={`mt-1 ${meta}`}>{hostname(r.url)}</p>
    </article>
  );
}

/** Media coverage: a compact list of outlet, headline and date. `description` holds the outlet. */
export function PressList({ resources }: { resources: PostResource[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {resources.map((r) => (
        <li key={r.id} className="px-4 py-3 sm:px-5">
          <p className={meta}>
            {[r.description || hostname(r.url), formatPostDate(r.recordedAt)].filter(Boolean).join(" · ")}
          </p>
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex min-h-8 items-center font-semibold text-foreground hover:text-primary hover:underline">
            {r.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
