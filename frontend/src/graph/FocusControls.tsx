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
];

export function FocusControls({ people, focusId, mode, onFocus, onMode }: Props) {
  const sorted = [...people].sort((a, b) => a.label.localeCompare(b.label));
  const everyone = mode === "all";

  return (
    <div className="focus-controls">
      <label className="focus-label" htmlFor="focus-person">
        {everyone ? "Everyone" : "Showing"}
      </label>
      <select
        id="focus-person"
        className="focus-select"
        value={focusId}
        onChange={(event) => onFocus(event.target.value)}
        disabled={everyone}
        title={everyone ? "Pick a person to focus the ancestor/descendant views" : undefined}
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
