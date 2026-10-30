import { useEffect, useMemo, useState } from "react";

import type { GraphResponse } from "../types";

interface Props {
  graph: GraphResponse;
}

interface Entry {
  id: string;
  name: string;
  gender: string;
  birthYear: number;
  deathYear: number | null;
  isLiving: boolean;
  birthPlace: string | null;
  xPct: number;
}

const STEP_MS = 1500;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Timeline({ graph }: Props) {
  const thisYear = new Date().getFullYear();

  const { entries, minYear, maxYear, undated } = useMemo(() => {
    const dated = graph.nodes
      .flatMap((n) => {
        const by = n.data.birth_date ? Number.parseInt(n.data.birth_date.slice(0, 4), 10) : null;
        if (by === null) return [];
        return [
          {
            id: n.id,
            name: n.data.label,
            gender: n.data.gender as string,
            birthYear: by,
            deathYear: n.data.death_date ? Number.parseInt(n.data.death_date.slice(0, 4), 10) : null,
            isLiving: n.data.is_living,
            birthPlace: n.data.birth_place ?? null,
          },
        ];
      })
      .sort((a, b) => a.birthYear - b.birthYear);

    const min = dated.length ? dated[0].birthYear : thisYear;
    const max = Math.max(thisYear, ...dated.map((e) => e.deathYear ?? e.birthYear));
    const span = Math.max(1, max - min);
    const list: Entry[] = dated.map((e) => ({ ...e, xPct: ((e.birthYear - min) / span) * 100 }));
    return {
      entries: list,
      minYear: min,
      maxYear: max,
      undated: graph.nodes.length - dated.length,
    };
  }, [graph, thisYear]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    if (index >= entries.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, entries.length - 1)), STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, index, entries.length]);

  const relations = useMemo(() => {
    const current = entries[index];
    const nameOf = new Map(graph.nodes.map((n) => [n.id, n.data.label]));
    const parents: string[] = [];
    const children: string[] = [];
    const partners: string[] = [];
    if (current) {
      graph.edges.forEach((e) => {
        if (e.relation === "parent") {
          if (e.target === current.id) parents.push(nameOf.get(e.source) ?? "");
          if (e.source === current.id) children.push(nameOf.get(e.target) ?? "");
        } else if (e.relation === "union") {
          if (e.source === current.id) partners.push(nameOf.get(e.target) ?? "");
          else if (e.target === current.id) partners.push(nameOf.get(e.source) ?? "");
        }
      });
    }
    return { parents, partners, children };
  }, [entries, index, graph]);

  if (entries.length === 0) {
    return (
      <div className="state">
        No birth dates yet — add dates to people to see the timeline.
      </div>
    );
  }

  const current = entries[index];
  const fill = current.xPct;
  const span = [
    current.birthYear,
    current.deathYear ?? (current.isLiving ? "present" : ""),
  ]
    .filter((v) => v !== "")
    .join(" – ");

  return (
    <div className="timeline">
      <div className="tl-stage">
        <article
          key={current.id}
          className={`tl-card gender-${current.gender.toLowerCase()} ${current.isLiving ? "living" : "deceased"}`}
        >
          <div className="tl-year">{span}</div>
          <div className="tl-main">
            <div className="tl-avatar">{initials(current.name)}</div>
            <div>
              <h2 className="tl-name">{current.name}</h2>
              {current.birthPlace && <p className="tl-place">{current.birthPlace}</p>}
            </div>
          </div>
          <div className="tl-relations">
            <RelRow label="Parents" names={relations.parents} />
            <RelRow label="Partners" names={relations.partners} />
            <RelRow label="Children" names={relations.children} />
          </div>
        </article>
      </div>

      <div className="tl-controls">
        <button
          className="tl-btn"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Previous"
        >
          ‹
        </button>
        <button className="tl-play" onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className="tl-btn"
          onClick={() => setIndex((i) => Math.min(entries.length - 1, i + 1))}
          disabled={index === entries.length - 1}
          aria-label="Next"
        >
          ›
        </button>
        <span className="tl-counter">
          {index + 1} / {entries.length}
          {undated > 0 && <span className="tl-undated"> · {undated} without dates</span>}
        </span>
      </div>

      <div className="tl-track-wrap">
        <div className="tl-track">
          <div className="tl-fill" style={{ width: `${fill}%` }} />
          <div className="tl-head" style={{ left: `${fill}%` }} />
          {entries.map((e, idx) => (
            <button
              key={e.id}
              className={`tl-dot gender-${e.gender.toLowerCase()} ${idx === index ? "on" : ""}`}
              style={{ left: `${e.xPct}%` }}
              title={`${e.name} (${e.birthYear})`}
              aria-label={`${e.name}, born ${e.birthYear}`}
              onClick={() => {
                setPlaying(false);
                setIndex(idx);
              }}
            />
          ))}
        </div>
        <div className="tl-axis">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  );
}

function RelRow({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="tl-rel">
      <span className="tl-rel-label">{label}</span>
      <span className="tl-rel-names">{names.join(", ")}</span>
    </div>
  );
}
