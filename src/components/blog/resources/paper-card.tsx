import { FileDown } from "lucide-react";

import { CiteDialog } from "@/components/blog/resources/cite-dialog";
import { PeopleLinks } from "@/components/blog/resources/people-links";
import { badge, button, card, cardTitle, meta } from "@/components/blog/resources/styles";
import type { PostResource } from "@/lib/blog";
import { apaFor } from "@/lib/blog-resources";

/** Title, authors (lab members linked), venue, and PDF / DOI / arXiv / Cite buttons. */
export function PaperCard({ resource: r }: { resource: PostResource }) {
  const href = r.doi ? `https://doi.org/${r.doi}` : r.url;
  const authors = (r.authors ?? "").split(/,\s*/).filter(Boolean);
  // Venues usually already carry the year ("CHI 2024"); don't repeat it.
  const venue = [r.venue, r.year && !r.venue?.includes(r.year) ? r.year : null].filter(Boolean).join(" ");

  return (
    <article className={card}>
      <h4 className={cardTitle}>
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
          {r.title}
        </a>
      </h4>
      {authors.length > 0 && (
        <p className={`mt-1.5 ${meta}`}>
          <PeopleLinks names={authors} />
        </p>
      )}
      {r.description && <p className="mt-1.5 text-sm text-foreground/80">{r.description}</p>}
      {venue && <p className="mt-2.5"><span className={badge}>{venue}</span></p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {r.pdfUrl && (
          <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className={button}>
            <FileDown className="size-4" aria-hidden />
            PDF
          </a>
        )}
        {r.doi && (
          <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer" className={button}>
            DOI
          </a>
        )}
        {r.arxivId && (
          <a href={`https://arxiv.org/abs/${r.arxivId}`} target="_blank" rel="noopener noreferrer" className={button}>
            arXiv
          </a>
        )}
        <CiteDialog title={r.title} bibtex={r.bibtex} apa={apaFor(r)} buttonClassName={button} />
      </div>
    </article>
  );
}
