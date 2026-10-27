import { FileText } from "lucide-react";

import { PeopleLinks } from "@/components/blog/resources/people-links";
import { VideoPlayer } from "@/components/blog/resources/video-player";
import { badge, meta } from "@/components/blog/resources/styles";
import { formatPostDate, type PostResource } from "@/lib/blog";
import { videoMedia } from "@/lib/blog-resources";

const TYPE_LABEL = { demo: "Demo", talk: "Talk", discussion: "Discussion", interview: "Interview", explainer: "Explainer" } as const;

/**
 * A video that plays in place, with its caption. `featured` is the large one
 * above the post body and shows speakers and the transcript link too.
 */
export function VideoTile({ resource, featured = false }: { resource: PostResource; featured?: boolean }) {
  const media = videoMedia(resource);
  const type = resource.videoType ?? (resource.kind === "demo" ? "demo" : undefined);
  const when = formatPostDate(resource.recordedAt);
  const details = [resource.event, when || undefined, !featured ? resource.channel : undefined].filter(Boolean).join(" · ");
  const Title = featured ? "p" : "h4";

  return (
    <figure className="min-w-0">
      <VideoPlayer media={media} priority={featured} />
      <figcaption className={featured ? "mt-3 space-y-1.5" : "mt-2.5 space-y-1"}>
        <div className="flex flex-wrap items-center gap-2">
          {type && <span className={badge}>{TYPE_LABEL[type]}</span>}
          <Title className={featured ? "text-base font-semibold text-foreground" : "text-sm font-semibold leading-snug text-foreground"}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
              {media.title}
            </a>
          </Title>
        </div>
        {details && <p className={meta}>{details}</p>}
        {featured && (resource.speakers ?? []).length > 0 && (
          <p className={meta}>
            <PeopleLinks names={resource.speakers ?? []} />
          </p>
        )}
        {resource.description && <p className="text-sm text-foreground/80">{resource.description}</p>}
        {resource.transcriptUrl && (
          <a href={resource.transcriptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <FileText className="size-4" aria-hidden />
            Transcript
          </a>
        )}
      </figcaption>
    </figure>
  );
}
