import type { Link, Nodes, Root, Text } from "mdast";
import { findProjectIds, type ProjectId } from "./project-ids";
import { resolveGuideLink } from "./guide-links";

// Match portfolio names, not general words such as "parking" or "self help".
const PROJECT_NAME =
  /\b(?:court[ -]*folio|cortfolio|hello[ -]*marky|pickle[ -]*pals|selfhelp(?:[ -]+ai)?|self[ -]+help[ -]+ai|parking[ -]*buddy|next[ -]*move[ -]*asia)\b/gi;
const SKIP = new Set([
  "link",
  "linkReference",
  "image",
  "imageReference",
  "inlineCode",
  "code",
  "html",
  "definition",
]);

/** Link the first ordinary mention of each project, including bold text.
 * Operates on parsed Markdown so it cannot rewrite URLs, code or HTML, and
 * constructs only routes from our known project IDs. No model-generated URL.
 */
export default function remarkProjectLinks() {
  return (tree: Root) => {
    const linked = new Set<ProjectId>();
    function visit(node: Nodes) {
      if (SKIP.has(node.type)) {
        if (node.type === "link") {
          const destination = resolveGuideLink(node.url);
          if (
            destination?.kind === "site" &&
            destination.action.type === "project"
          )
            linked.add(destination.action.id);
        }
        return;
      }
      if (!("children" in node)) return;
      const children = node.children as Nodes[];
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        if (child.type !== "text") {
          visit(child);
          continue;
        }
        const parts: (Text | Link)[] = [];
        let cursor = 0;
        for (const match of child.value.matchAll(PROJECT_NAME)) {
          const start = match.index!;
          const end = start + match[0].length;
          // Do not turn part of an email, URL, path or longer name into a link.
          const before = child.value[start - 1] || "";
          const after = child.value[end] || "";
          if (
            /[\p{L}\p{N}_/@.\-]/u.test(before) ||
            /[\p{L}\p{N}_/@\-]/u.test(after) ||
            (after === "." && /[a-z0-9]/i.test(child.value[end + 1] || ""))
          )
            continue;
          const id = findProjectIds(match[0])[0];
          if (!id || linked.has(id)) continue;
          if (start > cursor)
            parts.push({
              type: "text",
              value: child.value.slice(cursor, start),
            });
          parts.push({
            type: "link",
            url: `/work/${id}`,
            children: [{ type: "text", value: match[0] }],
          });
          linked.add(id);
          cursor = end;
        }
        if (!parts.length) continue;
        if (cursor < child.value.length)
          parts.push({ type: "text", value: child.value.slice(cursor) });
        children.splice(index, 1, ...parts);
        index += parts.length - 1;
      }
    }
    visit(tree);
  };
}
