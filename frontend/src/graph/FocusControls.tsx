import type { ViewMode } from "./subgraph";

interface PersonOption {
  id: string;
  label: string;
}

interface Props {
  people: PersonOption[];
  focusId: string;
  mode: ViewMode;
  onFocus: (id: string) => void;
  onMode: (mode: ViewMode) => void;
}

const MODES: { value: ViewMode; label: string }[] = [
  { value: "ancestors", label: "Ancestors" },
  { value: "descendants", label: "Descendants" },
  { value: "all", label: "Everyone" },
  { value: "timeline", label: "Timeline" },
];

export function FocusControls({ people, focusId, mode, onFocus, onMode }: Props) {
  const sorted = [...people].sort((a, b) => a.label.localeCompare(b.label));
  const noFocus = mode === "all" || mode === "timeline";
  const label = mode === "timeline" ? "Timeline" : mode === "all" ? "Everyone" : "Showing";

  return (
    <div className="focus-controls">
      <label className="focus-label" htmlFor="focus-person">
        {label}
      </label>
      <select
        id="focus-person"
        className="focus-select"
        value={focusId}
        onChange={(event) => onFocus(event.target.value)}
        disabled={noFocus}
        title={noFocus ? "Pick a person for the ancestor / descendant views" : undefined}
      >
        {sorted.map((person) => (
          <option key={person.id} value={person.id}>
            {person.label}
          </option>
        ))}
      </select>

      <div className="focus-toggle" role="group" aria-label="View">
        {MODES.map((m) => (
          <button
            key={m.value}
            className={mode === m.value ? "active" : ""}
            onClick={() => onMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
