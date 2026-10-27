import { ResourceCard } from "@/components/blog/resources/resource-card";
import type { PostResource } from "@/lib/blog";
import { resourceFromUrl } from "@/lib/blog-resources";

/**
 * What `::resource{id="…"}` and a bare resource link on its own line render
 * as inside a post body: the resource's card or player. A pasted link that
 * isn't in the post's resource list still gets a card built from the URL.
 */
export function ResourceEmbed({ resources, id, url }: { resources: PostResource[]; id?: string; url?: string }) {
  const resource = id
    ? resources.find((r) => r.id === id)
    : resources.find((r) => r.url === url) ?? (url ? resourceFromUrl(url) : undefined);
  // An unknown id renders nothing rather than a broken card; the admin editor warns about it.
  if (!resource) return null;
  return (
    <div className="not-prose my-8">
      <ResourceCard resource={resource} />
    </div>
  );
}
