import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { ResourceEmbed } from "@/components/blog/resource-embed";
import { remarkBlog } from "@/components/blog/remark-blog";
import type { PostResource } from "@/lib/blog";
import { cn, getImageUrl } from "@/lib/utils";
import "./prose.css";

type Props<T extends keyof React.JSX.IntrinsicElements> = ComponentProps<T> & ExtraProps;

/** react-markdown passes the syntax-tree node along; it must not reach the DOM. */
function withoutNode<T extends ExtraProps>({ node, ...rest }: T): Omit<T, "node"> {
  void node;
  return rest;
}

const isExternal = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith("mailto:");

function A(props: Props<"a">) {
  const { href = "", children, ...rest } = withoutNode(props);
  // Footnote and heading anchors stay plain links; other site paths go through next/link.
  if (href.startsWith("#")) return <a href={href} {...rest}>{children}</a>;
  if (href.startsWith("/")) return <Link href={href} {...rest}>{children}</Link>;
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return <a href={href} {...rest}>{children}</a>;
}

function Img(props: Props<"img">) {
  const { src, alt, title, ...rest } = withoutNode(props);
  if (typeof src !== "string" || !src) return null;
  // Relative paths are ImageKit uploads, like every other image on the site.
  const url = /^https?:\/\//i.test(src) ? src : getImageUrl(src);
  // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation
  return <img src={url} alt={alt ?? ""} title={title} loading="lazy" decoding="async" {...rest} />;
}

/** Fenced code: a plain block with its language as a small label. No highlighter ships to the browser. */
function Pre({ children, node }: Props<"pre">) {
  const code = node?.children[0];
  const className = code?.type === "element" ? code.properties.className : undefined;
  const lang = (Array.isArray(className) ? className : [])
    .map(String)
    .find((c) => c.startsWith("language-"))
    ?.slice("language-".length);
  return (
    <div className="blog-code">
      {lang && <span className="blog-code-lang">{lang}</span>}
      <pre tabIndex={0}>{children}</pre>
    </div>
  );
}

function Table(props: Props<"table">) {
  const { children, ...rest } = withoutNode(props);
  // Wide tables scroll inside their own box instead of widening the page.
  return (
    <div className="blog-table" tabIndex={0}>
      <table {...rest}>{children}</table>
    </div>
  );
}

export function Markdown({
  body,
  resources = [],
  className,
}: {
  body: string;
  resources?: PostResource[];
  className?: string;
}) {
  function Div(props: Props<"div">): ReactNode {
    const { children, ...rest } = withoutNode(props);
    const data = rest as Record<string, unknown>;
    const id = data["data-resource-id"];
    const url = data["data-auto-url"];
    if (typeof id === "string" || typeof url === "string") {
      return (
        <ResourceEmbed
          resources={resources}
          id={typeof id === "string" ? id : undefined}
          url={typeof url === "string" ? url : undefined}
        />
      );
    }
    return <div {...rest}>{children}</div>;
  }

  const components: Components = { a: A, img: Img, pre: Pre, table: Table, div: Div };

  return (
    <div className={cn("blog-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkBlog]}
        rehypePlugins={[
          rehypeKatex,
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["blog-heading-link"] } }],
        ]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
