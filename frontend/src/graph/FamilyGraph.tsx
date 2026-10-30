import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeMouseHandler,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchGraph } from "../api/client";
import type { GraphResponse, PersonNodeData } from "../types";
import { layoutWholeTree } from "./coupleLayout";
import { DetailPanel } from "./DetailPanel";
import { FocusControls } from "./FocusControls";
import { layoutGraph } from "./layout";
import { PersonNode } from "./PersonNode";
import { buildSubgraph, type Direction, type ViewMode } from "./subgraph";
import { toEdge, toNode } from "./transform";

const nodeTypes = { person: PersonNode };

/** Prefer a focus person who actually has ancestors, so the default view is useful. */
function defaultFocus(graph: GraphResponse): string {
  const childIds = new Set(
    graph.edges.filter((e) => e.relation === "parent").map((e) => e.target),
  );
  const child = graph.nodes.find((n) => childIds.has(n.id));
  return (child ?? graph.nodes[0]).id;
}

type Status = "loading" | "ready" | "empty" | "error";

export function FamilyGraph() {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const [focusId, setFocusId] = useState<string>("");
  const [mode, setMode] = useState<ViewMode>("ancestors");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchGraph()
      .then((data) => {
        if (!active) return;
        if (data.nodes.length === 0) {
          setStatus("empty");
          return;
        }
        setGraph(data);
        setFocusId(defaultFocus(data));
        setStatus("ready");
      })
      .catch((error: Error) => {
        if (!active) return;
        setMessage(error.message);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const { nodes, edges } = useMemo(() => {
    const empty = { nodes: [] as Node<PersonNodeData>[], edges: [] as Edge[] };
    if (!graph) return empty;

    if (mode === "all") {
      return layoutWholeTree(graph.nodes, graph.edges);
    }
    if (!focusId) return empty;

    const sub = buildSubgraph(graph.nodes, graph.edges, focusId, mode as Direction);
    const laidOut = layoutGraph(sub.nodes.map(toNode), sub.edges.map(toEdge));
    return { nodes: laidOut, edges: sub.edges.map(toEdge) };
  }, [graph, focusId, mode]);

  // When a person is selected, make their connected lines glow and dim the rest.
  const displayEdges = useMemo(() => {
    if (!selectedId) return edges;
    return edges.map((edge) => {
      const connected = edge.source === selectedId || edge.target === selectedId;
      return {
        ...edge,
        className: `${edge.className ?? ""} ${connected ? "edge-highlight" : "edge-dim"}`.trim(),
        zIndex: connected ? 10 : 0,
      };
    });
  }, [edges, selectedId]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedId(node.id);
  }, []);

  if (status === "loading") return <div className="state">Gathering the family…</div>;
  if (status === "error") return <div className="state state-error">{message}</div>;
  if (status === "empty") {
    return (
      <div className="state">
        No people yet. Add your family in the admin, then reload.
      </div>
    );
  }

  const people = (graph as GraphResponse).nodes.map((n) => ({
    id: n.id,
    label: n.data.label,
  }));

  return (
    <>
      <FocusControls
        people={people}
        focusId={focusId}
        mode={mode}
        onFocus={(id) => {
          setFocusId(id);
          setSelectedId(null);
        }}
        onMode={(m) => {
          setMode(m);
          setSelectedId(null);
        }}
      />

      <ReactFlow
        key={`${mode}-${focusId}`}
        nodes={nodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedId(null)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
      >
        <Background gap={30} size={1.4} color="rgba(201, 162, 75, 0.12)" />
        <MiniMap pannable zoomable nodeStrokeWidth={2} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {selectedId && (
        <DetailPanel personId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
