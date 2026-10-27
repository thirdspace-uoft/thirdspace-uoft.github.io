import type { Paragraph, PhrasingContent, Root, RootContent, Text } from "mdast";
import { visit, SKIP } from "unist-util-visit";

/** A bare link on its own line to one of these becomes a card or player. */
const UPGRADABLE = /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|github\.com|arxiv\.org)\//i;

/** Children that are only whitespace don't count when checking "alone on its line". */
function meaningful(children: PhrasingContent[]): PhrasingContent[] {
  return children.filter((c) => !(c.type === "text" && !c.value.trim()));
}

function textOf(node: { children?: unknown[]; value?: unknown }): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map((c) => textOf(c as typeof node)).join("");
}

/**
 * The blog's Markdown extensions, all done on the syntax tree so no raw HTML
 * is ever allowed through:
 *
 * - `::resource{id="…"}` on its own line → `<div data-resource-id>`, which the
 *   renderer swaps for that resource's card or player. Every other directive is
 *   put back as the text it was written as, so "Note:this" isn't swallowed.
 * - A paragraph holding only an image → `<figure>`, with the image's Markdown
 *   title (`![alt](path "Caption")`) as its `<figcaption>`.
 * - A paragraph holding only a YouTube, Vimeo, GitHub or arXiv URL →
 *   `<div data-auto-url>`, rendered as the matching card.
 */
export function remarkBlog() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.type === "leafDirective" || node.type === "containerDirective" || node.type === "textDirective") {
        if (node.type === "leafDirective" && node.name === "resource" && node.attributes?.id) {
          node.data = { hName: "div", hProperties: { "data-resource-id": node.attributes.id } };
          node.children = [];
          return SKIP;
        }
        const prefix = node.type === "textDirective" ? ":" : node.type === "leafDirective" ? "::" : ":::";
        const text: Text = { type: "text", value: `${prefix}${node.name}${textOf(node) ? `[${textOf(node)}]` : ""}` };
        const replacement: RootContent =
          node.type === "textDirective" ? text : ({ type: "paragraph", children: [text] } as Paragraph);
        (parent.children as RootContent[]).splice(index, 1, replacement);
        return [SKIP, index + 1];
      }

      if (node.type !== "paragraph") return;
      const only = meaningful(node.children);
      if (only.length !== 1) return;
      const child = only[0];

      if (child.type === "image") {
        const children: RootContent[] = [child];
        if (child.title) {
          children.push({
            type: "paragraph",
            data: { hName: "figcaption" },
            children: [{ type: "text", value: child.title }],
          } as Paragraph);
          // The caption is shown, so it shouldn't also be the hover tooltip.
          child.title = null;
        }
        node.data = { hName: "figure" };
        node.children = children as PhrasingContent[];
        return SKIP;
      }

      // remark-gfm turns a bare URL into a link whose text is the URL itself.
      if (child.type === "link" && UPGRADABLE.test(child.url) && textOf(child) === child.url) {
        node.data = { hName: "div", hProperties: { "data-auto-url": child.url } };
        node.children = [];
        return SKIP;
      }
    });
  };
}
