import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Turns "[text](url)" into links; everything else stays plain text (no HTML). */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, url] = m;
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const external = !url.startsWith("/") && !url.startsWith("#");
    out.push(
      <Link
        key={at}
        href={url}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
      >
        {label}
      </Link>,
    );
    last = at + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraphs split on blank lines, with inline [text](url) links. */
export function RichText({ text, className }: { text?: string; className?: string }) {
  const paragraphs = (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

/** A single line (captions): links, no paragraphs. */
export function InlineText({ text }: { text?: string }) {
  if (!text) return null;
  return <>{inline(text)}</>;
}
