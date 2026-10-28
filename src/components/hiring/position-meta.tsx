import { Building2, Globe, Shuffle } from "lucide-react";

import { formatDeadline, type HiringLabels, type HiringListing, type HiringMode } from "@/lib/hiring";
import { cn } from "@/lib/utils";

const MODE_ICON: Record<HiringMode, typeof Globe> = {
  online: Globe,
  offline: Building2,
  hybrid: Shuffle,
};

export function ModeChip({ mode, labels }: { mode?: HiringMode; labels: HiringLabels }) {
  const label = mode ? labels.modes?.[mode] : undefined;
  if (!mode || !label) return null;
  const Icon = MODE_ICON[mode];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/** "Mentor: …  ·  Commitment: …  ·  Deadline: …", skipping empty parts. */
export function PositionFacts({
  listing,
  labels,
  className,
}: {
  listing: HiringListing;
  labels: HiringLabels;
  className?: string;
}) {
  const facts = [
    [labels.mentor, listing.mentor],
    [labels.commitment, listing.commitment],
    [labels.deadline, listing.deadline ? formatDeadline(listing.deadline) : ""],
  ].filter(([, value]) => value) as [string | undefined, string][];
  if (facts.length === 0) return null;
  return (
    <dl className={cn("flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground", className)}>
      {facts.map(([label, value]) => (
        <div key={label ?? value} className="flex gap-1.5">
          {label && <dt className="text-muted-foreground/80">{label}</dt>}
          <dd className="font-medium text-foreground/85">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
