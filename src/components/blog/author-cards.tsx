import Link from "next/link";

import type { ResolvedAuthor } from "@/lib/blog";
import { getImageUrl } from "@/lib/utils";

/** Photo, name and title for each author, linking to their People-page row. */
export function AuthorCards({ authors, label }: { authors: ResolvedAuthor[]; label: string }) {
  if (authors.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {authors.map((a) => {
          const body = (
            <>
              {a.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
                <img
                  src={`${getImageUrl(a.photo)}?tr=w-96,h-96,fo-face`}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  className="size-12 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
                  {a.name.charAt(0)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{a.name}</span>
                {a.title && <span className="block text-sm text-muted-foreground">{a.title}</span>}
              </span>
            </>
          );
          const className =
            "flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
          return (
            <li key={a.name}>
              {a.href ? (
                a.isMember ? (
                  <Link href={a.href} className={className}>{body}</Link>
                ) : (
                  <a href={a.href} target="_blank" rel="noopener noreferrer" className={className}>{body}</a>
                )
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
