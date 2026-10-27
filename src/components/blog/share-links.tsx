import { Mail } from "lucide-react";

import { CopyLinkButton } from "@/components/blog/copy-link-button";

const buttonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Plain share links: no third-party scripts, so no trackers and nothing extra
 * to download. Each opens the site's own share screen with the post filled in.
 */
export function ShareLinks({
  url,
  title,
  xHandle,
  labels,
}: {
  url: string;
  title: string;
  /** "@SpaceUoft" → credited with `via=`. */
  xHandle?: string;
  labels: { share: string; copyLink: string; linkCopied: string };
}) {
  const e = encodeURIComponent;
  const via = xHandle?.replace(/^@/, "");
  const links = [
    { label: "X", href: `https://x.com/intent/post?text=${e(title)}&url=${e(url)}${via ? `&via=${e(via)}` : ""}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
    { label: "Bluesky", href: `https://bsky.app/intent/compose?text=${e(`${title} ${url}`)}` },
  ];
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{labels.share}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={buttonClass}>
            {l.label}
          </a>
        ))}
        <a href={`mailto:?subject=${e(title)}&body=${e(url)}`} className={buttonClass}>
          <Mail className="size-4" aria-hidden />
          Email
        </a>
        <CopyLinkButton url={url} label={labels.copyLink} copiedLabel={labels.linkCopied} className={buttonClass} />
      </div>
    </div>
  );
}
