import dagre from "@dagrejs/dagre";
import { type Edge, type Node, Position } from "@xyflow/react";

import type { ApiEdge, ApiNode, PersonNodeData } from "../types";
import { NODE_HEIGHT, NODE_WIDTH } from "./layout";
import { toEdge, toNode } from "./transform";

const PARTNER_GAP = 44; // space between the two cards of a couple

interface Group {
  id: string;
  members: string[]; // 1 person (single) or 2 (a couple)
}

/**
 * Whole-tree layout that keeps couples together.
 *
 * The trick: collapse each couple into one *group* and lay out the groups with
 * a hierarchical engine, then place the two partners side by side inside their
 * group's box. Children therefore hang beneath the couple, not beneath a lone
 * parent. A person who appears in several unions can only sit in one place, so
 * they are grouped with their couple that has the most children; any further
 * spouse becomes a nearby single node (the honest limitation of 2D trees).
 */
export function layoutWholeTree(
  apiNodes: ApiNode[],
  apiEdges: ApiEdge[],
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  const parentEdges = apiEdges.filter((e) => e.relation === "parent");
  const unionEdges = apiEdges.filter((e) => e.relation === "union");

  // --- 1. Collect candidate couples (explicit unions + shared-child pairs) ---
  const key = (a: string, b: string) => [a, b].sort().join("::");
  const couples = new Map<string, { a: string; b: string; children: number }>();
  const addCouple = (a: string, b: string) => {
    if (a === b) return;
    const k = key(a, b);
    if (!couples.has(k)) {
      const [x, y] = [a, b].sort();
      couples.set(k, { a: x, b: y, children: 0 });
    }
  };
  unionEdges.forEach((u) => addCouple(u.source, u.target));

  const parentsOf = new Map<string, string[]>();
  parentEdges.forEach((e) => {
    const list = parentsOf.get(e.target) ?? [];
    list.push(e.source);
    parentsOf.set(e.target, list);
  });
  parentsOf.forEach((parents) => {
    for (let i = 0; i < parents.length; i += 1) {
      for (let j = i + 1; j < parents.length; j += 1) {
        addCouple(parents[i], parents[j]);
        const c = couples.get(key(parents[i], parents[j]));
        if (c) c.children += 1;
      }
    }
  });

  // --- 2. Assign each person to exactly one group ---------------------------
  const grouped = new Set<string>();
  const groups: Group[] = [];
  const groupOf = new Map<string, string>();

  [...couples.values()]
    .sort((x, y) => y.children - x.children)
    .forEach((c) => {
      if (!grouped.has(c.a) && !grouped.has(c.b)) {
        const id = `grp-${c.a}-${c.b}`;
        groups.push({ id, members: [c.a, c.b] });
        [c.a, c.b].forEach((m) => {
          grouped.add(m);
          groupOf.set(m, id);
        });
      }
    });

  apiNodes.forEach((n) => {
    if (!grouped.has(n.id)) {
      const id = `grp-${n.id}`;
      groups.push({ id, members: [n.id] });
      grouped.add(n.id);
      groupOf.set(n.id, id);
    }
  });

  const widthOf = (group: Group) =>
    group.members.length > 1 ? NODE_WIDTH * 2 + PARTNER_GAP : NODE_WIDTH;

  // --- 3. Lay out the groups -----------------------------------------------
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    ranker: "network-simplex",
    ranksep: 130,
    nodesep: 80,
    marginx: 60,
    marginy: 60,
  });
  groups.forEach((group) =>
    g.setNode(group.id, { width: widthOf(group), height: NODE_HEIGHT }),
  );

  const seenEdge = new Set<string>();
  parentEdges.forEach((e) => {
    const sg = groupOf.get(e.source);
    const tg = groupOf.get(e.target);
    if (sg && tg && sg !== tg && !seenEdge.has(`${sg}>${tg}`)) {
      seenEdge.add(`${sg}>${tg}`);
      g.setEdge(sg, tg);
    }
  });
  dagre.layout(g);

  // --- 4. Expand groups into individual card positions ---------------------
  const pos = new Map<string, { x: number; y: number }>();
  const generationYs = new Set<number>();
  groups.forEach((group) => {
    const box = g.node(group.id);
    const top = box.y - NODE_HEIGHT / 2;
    generationYs.add(Math.round(box.y));
    if (group.members.length > 1) {
      const left = box.x - widthOf(group) / 2;
      pos.set(group.members[0], { x: left, y: top });
      pos.set(group.members[1], { x: left + NODE_WIDTH + PARTNER_GAP, y: top });
    } else {
      pos.set(group.members[0], { x: box.x - NODE_WIDTH / 2, y: top });
    }
  });

  const genIndex = new Map(
    [...generationYs].sort((a, b) => a - b).map((y, i) => [y, i]),
  );

  const nodes: Node<PersonNodeData>[] = apiNodes
    .filter((n) => pos.has(n.id))
    .map((n) => {
      const base = toNode(n);
      const p = pos.get(n.id) as { x: number; y: number };
      const generation = genIndex.get(Math.round(p.y + NODE_HEIGHT / 2)) ?? 0;
      return {
        ...base,
        position: p,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        data: { ...base.data, delayMs: generation * 120 },
      };
    });

  // --- 5. Edges: parentage as-is; union handles chosen by left/right -------
  const parentRf = parentEdges.map(toEdge);
  const unionRf: Edge[] = unionEdges.map((u) => {
    const pa = pos.get(u.source);
    const pb = pos.get(u.target);
    let left = u.source;
    let right = u.target;
    if (pa && pb && pa.x > pb.x) {
      left = u.target;
      right = u.source;
    }
    return {
      id: u.id,
      source: left,
      target: right,
      sourceHandle: "right",
      targetHandle: "left",
      type: "straight",
      data: { relation: "union" },
      className: "edge-union",
    };
  });

  return { nodes, edges: [...parentRf, ...unionRf] };
}
