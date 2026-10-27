import Link from "next/link";
import { Fragment } from "react";

import type { ResolvedAuthor } from "@/lib/blog";

/** Author names linked to their People-page rows (or a guest's own site). */
export function AuthorNames({ authors }: { authors: ResolvedAuthor[] }) {
  return (
    <>
      {authors.map((a, i) => (
        <Fragment key={a.name}>
          {i > 0 && (i === authors.length - 1 ? " and " : ", ")}
          {a.href ? (
            a.isMember ? (
              <Link href={a.href} className="font-semibold text-foreground hover:text-primary hover:underline">
                {a.name}
              </Link>
            ) : (
              <a href={a.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary hover:underline">
                {a.name}
              </a>
            )
          ) : (
            <span className="font-semibold text-foreground">{a.name}</span>
          )}
        </Fragment>
      ))}
    </>
  );
}
