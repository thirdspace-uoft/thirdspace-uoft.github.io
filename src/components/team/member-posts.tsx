import Link from "next/link";

export type MemberPost = { slug: string; title: string; date: string };

/** A member's blog posts, listed in their profile dialog. */
export function MemberPosts({ posts, label }: { posts?: MemberPost[]; label?: string }) {
  if (!posts || posts.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{label}</h3>
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.slug} className="type-body">
            <Link
              href={`/blog/${p.slug}`}
              className="text-foreground underline decoration-primary/40 decoration-1 underline-offset-[5px] transition-colors hover:decoration-primary"
            >
              {p.title}
            </Link>
            <span className="text-muted-foreground"> · {p.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
