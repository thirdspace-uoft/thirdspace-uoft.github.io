import type { PostHeading } from "@/lib/blog-headings";

/** Links to the post's `##` sections. Only rendered with 3 or more. */
export function TableOfContents({ headings, label }: { headings: PostHeading[]; label: string }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label={label} className="text-sm">
      <h2 className="font-semibold text-foreground">{label}</h2>
      <ol className="mt-3 space-y-2 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l border-transparent pl-3 leading-snug text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
