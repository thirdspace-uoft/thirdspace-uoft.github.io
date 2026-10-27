import { CodeCard } from "@/components/blog/resources/code-card";
import { DatasetCard, LinkCard, PressList, ProjectCard, SlidesCard } from "@/components/blog/resources/link-cards";
import { PaperCard } from "@/components/blog/resources/paper-card";
import { VideoTile } from "@/components/blog/resources/video-tile";
import type { PostResource } from "@/lib/blog";
import { isVideo } from "@/lib/blog-resources";

/** The right card for one resource. */
export function ResourceCard({ resource }: { resource: PostResource }) {
  if (isVideo(resource)) return <VideoTile resource={resource} />;
  switch (resource.kind) {
    case "paper":
      return <PaperCard resource={resource} />;
    case "code":
      return <CodeCard resource={resource} />;
    case "project":
    case "demo":
      return <ProjectCard resource={resource} />;
    case "dataset":
      return <DatasetCard resource={resource} />;
    case "slides":
    case "poster":
      return <SlidesCard resource={resource} />;
    case "press":
      return <PressList resources={[resource]} />;
    default:
      return <LinkCard resource={resource} />;
  }
}
