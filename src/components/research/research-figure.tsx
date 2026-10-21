import { InlineText } from "@/components/research/rich-text";
import { MediaView, ResearchSlider } from "@/components/research/research-media";
import { presentMedia, type ResearchContent, type ResearchFigure as Figure } from "@/lib/research";

/**
 * A figure in the iliad style: one visual at its own aspect ratio, two or three
 * side by side at a shared height, or a slider beyond that — with an italic
 * caption underneath.
 */
export function ResearchFigure({
  figure,
  labels,
  priority,
}: {
  figure?: Figure;
  labels?: ResearchContent["labels"];
  priority?: boolean;
}) {
  const media = presentMedia(figure?.media);
  if (media.length === 0) return null;

  return (
    <figure className="space-y-3">
      {media.length === 1 && (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card p-2 sm:p-3">
          <MediaView media={media[0]} layout="natural" sizes="(max-width: 1024px) 100vw, 960px" priority={priority} />
        </div>
      )}

      {(media.length === 2 || media.length === 3) && (
        <div className={media.length === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-3"}>
          {media.map((m, i) => (
            <div key={`${m.path}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-card">
              {/* contain, not cover: most paper figures are diagrams that cropping would cut off */}
              <MediaView media={m} sizes="(max-width: 640px) 100vw, 400px" fit="contain" priority={priority && i === 0} />
            </div>
          ))}
        </div>
      )}

      {media.length > 3 && (
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border/70 bg-muted/30">
          <ResearchSlider media={media} labels={labels} sizes="(max-width: 1024px) 100vw, 960px" />
        </div>
      )}

      {figure?.caption && (
        <figcaption className="text-sm italic leading-relaxed text-muted-foreground">
          <InlineText text={figure.caption} />
        </figcaption>
      )}
    </figure>
  );
}
