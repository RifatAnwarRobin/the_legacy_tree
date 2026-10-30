import { Handle, type NodeProps, Position } from "@xyflow/react";

import type { PersonNodeData } from "../types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function PersonNode({ data }: NodeProps) {
  const person = data as PersonNodeData;
  const lifespan = [person.birthYear, person.deathYear]
    .map((year) => year ?? "")
    .join("–");
  const hasLifespan = lifespan.replace("–", "").length > 0;

  const cardClasses = [
    "person-card",
    `gender-${person.gender.toLowerCase()}`,
    person.isLiving ? "living" : "deceased",
  ].join(" ");

  return (
    <div className="person-reveal" style={{ animationDelay: `${person.delayMs}ms` }}>
      <div className={cardClasses}>
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="target" position={Position.Left} id="left" />

        <div className="person-avatar" aria-hidden="true">
          {initials(person.label)}
        </div>
        <div className="person-body">
          <p className="person-name">
            {person.label}
            {!person.isLiving && (
              <span className="person-dagger" title="Deceased">
                {" "}
                (رَحِمَهُ الله)
              </span>
            )}
          </p>
          {hasLifespan && <p className="person-dates">{lifespan}</p>}
          {person.birthPlace && <p className="person-place">{person.birthPlace}</p>}
        </div>
      </div>
    </div>
  );
}
