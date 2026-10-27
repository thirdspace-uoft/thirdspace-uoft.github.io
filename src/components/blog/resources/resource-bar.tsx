import { FileDown, Star } from "lucide-react";

import { groupId } from "@/components/blog/resources/resources-section";
import { KIND_META } from "@/components/blog/resource-meta";
import type { PostResource, ResourceKind } from "@/lib/blog";
import { primaryOf } from "@/lib/blog-resources";

const BAR_KINDS: ResourceKind[] = ["paper", "code", "project", "demo", "video", "dataset", "slides"];

const pill =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * One button per kind of resource, right under the byline, the way academic
 * project pages do it. A kind with one resource links straight to it; a kind
 * with several ("Videos · 3") jumps to that group further down.
 */
export function ResourceBar({ resources }: { resources: PostResource[] }) {
  const items: { key: string; href: string; external: boolean; icon: React.ReactNode; label: React.ReactNode }[] = [];

  for (const kind of BAR_KINDS) {
    const all = resources.filter((r) => r.kind === kind);
    const primary = primaryOf(resources, kind);
    if (!primary) continue;
    const { label, group, icon: Icon } = KIND_META[kind];
    const many = all.length > 1;
    const stars = kind === "code" && typeof primary.repo?.stars === "number" ? primary.repo.stars : undefined;
    items.push({
      key: kind,
      href: many ? `#${groupId(kind)}` : primary.url,
      external: !many,
      icon: <Icon className="size-4" aria-hidden />,
      label: (
        <>
          {many ? `${group} · ${all.length}` : label}
          {stars !== undefined && (
            <span className="inline-flex items-center gap-0.5 font-normal text-muted-foreground">
              <Star className="size-3.5" aria-hidden />
              {stars.toLocaleString("en-CA")}
              <span className="sr-only"> stars</span>
            </span>
          )}
        </>
      ),
    });
    // The paper's PDF gets its own button right after it.
    if (kind === "paper" && primary.pdfUrl) {
      items.push({ key: "pdf", href: primary.pdfUrl, external: true, icon: <FileDown className="size-4" aria-hidden />, label: "PDF" });
    }
  }

  if (items.length === 0) return null;
  return (
    <nav aria-label="Paper, code and media" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <a
              href={item.href}
              className={pill}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.icon}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
