import dagre from "@dagrejs/dagre";
import { type Edge, type Node, Position } from "@xyflow/react";

import type { PersonNodeData } from "../types";

export const NODE_WIDTH = 210;
export const NODE_HEIGHT = 96;

/**
 * Top-down hierarchical layout. Only parentage edges drive the ranking, so
 * generations stack cleanly; union edges are drawn but not ranked. The
 * network-simplex ranker plus generous spacing reduces edge crossings.
 */
export function layoutGraph(
  nodes: Node<PersonNodeData>[],
  edges: Edge[],
): Node<PersonNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ranker: "network-simplex",
    ranksep: 120,
    nodesep: 70,
    edgesep: 30,
    marginx: 60,
    marginy: 60,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges
    .filter((edge) => edge.data?.relation === "parent")
    .forEach((edge) => {
      g.setEdge(edge.source, edge.target, { weight: 2, minlen: 1 });
    });

  dagre.layout(g);

  // Map each distinct rank (y) to a generation index, for staggered reveal.
  const ys = [...new Set(nodes.map((n) => Math.round(g.node(n.id).y)))].sort(
    (a, b) => a - b,
  );
  const generationOf = new Map(ys.map((y, index) => [y, index]));

  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    const generation = generationOf.get(Math.round(y)) ?? 0;
    return {
      ...node,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: { ...node.data, delayMs: generation * 140 },
    };
  });
}
