import type { ApiEdge, ApiNode } from "../types";

export type Direction = "ancestors" | "descendants";
export type ViewMode = Direction | "all" | "timeline";

export interface SubGraph {
  nodes: ApiNode[];
  edges: ApiEdge[];
}

/**
 * Reduce the whole family graph to a single clean lineage: either everyone
 * *above* the focus person (ancestors) or everyone *below* them (descendants).
 *
 * This is why the view looks tidy — one person, one direction means the layout
 * engine only has to rank a single tree instead of the entire web. For the
 * descendants view, spouses of included people are pulled in too, so children
 * sit under a couple rather than a single parent.
 */
export function buildSubgraph(
  nodes: ApiNode[],
  edges: ApiEdge[],
  focusId: string,
  direction: Direction,
): SubGraph {
  const parentEdges = edges.filter((e) => e.relation === "parent");
  const unionEdges = edges.filter((e) => e.relation === "union");

  const included = new Set<string>([focusId]);
  const stack = [focusId];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const edge of parentEdges) {
      // ancestors: climb from child to parent; descendants: the reverse.
      const next =
        direction === "ancestors"
          ? edge.target === current
            ? edge.source
            : null
          : edge.source === current
            ? edge.target
            : null;
      if (next && !included.has(next)) {
        included.add(next);
        stack.push(next);
      }
    }
  }

  // In a descendants view, bring in each included person's partner(s) so a
  // couple is shown together above their shared children.
  if (direction === "descendants") {
    for (const union of unionEdges) {
      if (included.has(union.source)) included.add(union.target);
      else if (included.has(union.target)) included.add(union.source);
    }
  }

  const subNodes = nodes.filter((n) => included.has(n.id));
  const subEdges = [
    ...parentEdges.filter((e) => included.has(e.source) && included.has(e.target)),
    ...unionEdges.filter((e) => included.has(e.source) && included.has(e.target)),
  ];
  return { nodes: subNodes, edges: subEdges };
}
