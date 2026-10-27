import { PressList } from "@/components/blog/resources/link-cards";
import { ResourceCard } from "@/components/blog/resources/resource-card";
import { VideoTile } from "@/components/blog/resources/video-tile";
import { KIND_META, KIND_ORDER } from "@/components/blog/resource-meta";
import type { PostResource } from "@/lib/blog";

/** Anchor of one group, e.g. #resources-code; the resource bar links here. */
export const groupId = (kind: string) => `resources-${kind}`;

/** Every resource, grouped by kind. Renders nothing at all when there are none. */
export function ResourcesSection({ resources, label }: { resources: PostResource[]; label: string }) {
  const groups = KIND_ORDER.map((kind) => ({ kind, items: resources.filter((r) => r.kind === kind) })).filter(
    (g) => g.items.length > 0,
  );
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="resources" className="mt-16 max-w-4xl border-t border-border pt-10">
      <h2 id="resources" className="scroll-mt-24 text-2xl font-bold tracking-tight text-foreground">
        {label}
      </h2>
      {groups.map(({ kind, items }) => (
        <div key={kind} id={groupId(kind)} className="mt-8 scroll-mt-24">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{KIND_META[kind].group}</h3>
          <div className="mt-3">
            {kind === "video" ? (
              // A swipeable row on phones, a grid from small screens up. Plain CSS
              // scroll-snap, so no carousel script is needed.
              <ul className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
                {items.map((r) => (
                  <li key={r.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
                    <VideoTile resource={r} />
                  </li>
                ))}
              </ul>
            ) : kind === "press" ? (
              <PressList resources={items} />
            ) : (
              <ul className={kind === "paper" ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
                {items.map((r) => (
                  <li key={r.id}>
                    <ResourceCard resource={r} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
