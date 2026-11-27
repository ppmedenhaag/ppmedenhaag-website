// Sätteri hast plugin (astro.config.mjs → markdown.processor): sequential heading levels in Markdown content.
//
// The page template renders the title as the <h1>. Content authors pick a heading size by the number of #'s
// (### for sections, ##### for schedule dates ...), which skips levels in the document outline (h1 → h3, h1 → h5).
// Screen readers announce that as missing structure, and Lighthouse flags it ("heading-order").
//
// This plugin renumbers the headings of each document to h2, h3, h4 ... without gaps and adds the class
// "md-h<original level>". The unlayered `.prose .md-hN` rules at the bottom of src/styles/global.css give such a
// heading the size and spacing of its original level, so the page looks exactly as authored. The Markdown files
// themselves stay untouched.
//
// New level: outline normalisation in document order (### ### ##### → h2 h2 h3; ##### ###### #### → h2 h3 h2), so
// there is never a gap after the h1 or between headings. The levels are computed in `before` (a document-order walk of the whole tree) and consumed in the same
// order by `visit` (Sätteri visits elements in document order; hast nodes carry no source positions to key on).
// If the order ever disagrees (tag mismatch), the plain rank is used for that heading.

const TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];

function collectHeadings(node, out) {
  if (node.type === "element" && TAGS.includes(node.tagName)) out.push(node);
  for (const child of node.children ?? []) collectHeadings(child, out);
  return out;
}

export function headingLevels() {
  return () => {
    /** [original level, new level] per heading, in document order */
    let plan = [];
    let index = 0;
    /** original level → rank level (fallback) */
    let rank = new Map();
    return {
      name: "ppme-heading-levels",
      before(root) {
        const headings = collectHeadings(root, []).map((h) => Number(h.tagName[1]));
        const used = [...new Set(headings)].sort((a, b) => a - b);
        rank = new Map(used.map((level, i) => [level, Math.min(i + 2, 6)]));
        // Outline normalisation with a stack of open headings [original, new]: a heading nests one level below the
        // nearest preceding heading with a smaller original level (h2 when there is none); a heading with the same
        // original level as an open one becomes its sibling.
        const stack = [];
        plan = headings.map((level) => {
          let sibling;
          while (stack.length && stack[stack.length - 1][0] >= level) {
            const [orig, lvl] = stack.pop();
            if (orig === level) sibling = lvl;
          }
          const next = Math.min(sibling ?? (stack.length ? stack[stack.length - 1][1] + 1 : 2), 6);
          stack.push([level, next]);
          return [level, next];
        });
        index = 0;
      },
      element: {
        filter: TAGS,
        visit(node, ctx) {
          const level = Number(node.tagName[1]);
          const step = plan[index++];
          const next = step && step[0] === level ? step[1] : (rank.get(level) ?? level);
          if (next === level) return;
          const existing = node.properties?.className;
          const classes = Array.isArray(existing) ? existing : typeof existing === "string" ? existing.split(/\s+/) : [];
          ctx.setField(node, "tagName", `h${next}`);
          ctx.setProperty(node, "className", [...classes, `md-h${level}`]);
        },
      },
    };
  };
}
