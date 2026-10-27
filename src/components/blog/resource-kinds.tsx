import { KIND_META, KIND_ORDER } from "@/components/blog/resource-meta";
import type { ResourceKind } from "@/lib/blog";

/** Small icons on a post card so readers can spot posts with code, videos or data. */
export function ResourceKinds({ kinds }: { kinds: ResourceKind[] }) {
  const shown = KIND_ORDER.filter((k) => kinds.includes(k) && k !== "link" && k !== "press");
  if (shown.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {shown.map((kind) => {
        const { label, icon: Icon } = KIND_META[kind];
        return (
          <li key={kind} className="inline-flex items-center gap-1">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </li>
        );
      })}
    </ul>
  );
}
