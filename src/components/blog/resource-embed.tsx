import type { PostResource } from "@/lib/blog";

/**
 * What `::resource{id="…"}` and a bare resource link on its own line render
 * as inside a post body. Looks the resource up by id, then by URL.
 */
export function ResourceEmbed({ resources, id, url }: { resources: PostResource[]; id?: string; url?: string }) {
  const resource = id ? resources.find((r) => r.id === id) : resources.find((r) => r.url === url);
  const href = resource?.url ?? url;
  if (!href) return null;
  return (
    <p>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {resource?.title || href}
      </a>
    </p>
  );
}
