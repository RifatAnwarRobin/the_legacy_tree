import { type Edge, MarkerType, type Node } from "@xyflow/react";

import type { ApiEdge, ApiNode, PersonNodeData } from "../types";

export function year(isoDate: string | null): string | null {
  return isoDate ? isoDate.slice(0, 4) : null;
}

export function toNode(apiNode: ApiNode): Node<PersonNodeData> {
  return {
    id: apiNode.id,
    type: "person",
    position: { x: 0, y: 0 },
    data: {
      label: apiNode.data.label,
      gender: apiNode.data.gender,
      isLiving: apiNode.data.is_living,
      birthYear: year(apiNode.data.birth_date),
      deathYear: year(apiNode.data.death_date),
      birthPlace: apiNode.data.birth_place ?? null,
      delayMs: 0,
    },
  };
}

export function toEdge(apiEdge: ApiEdge): Edge {
  const isParent = apiEdge.relation === "parent";
  return {
    id: apiEdge.id,
    source: apiEdge.source,
    target: apiEdge.target,
    sourceHandle: isParent ? "bottom" : "right",
    targetHandle: isParent ? "top" : "left",
    type: isParent ? "smoothstep" : "straight",
    data: { relation: apiEdge.relation },
    className: isParent ? "edge-parent" : "edge-union",
    markerEnd: isParent ? { type: MarkerType.ArrowClosed } : undefined,
  };
}
