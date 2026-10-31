import { FamilyGraph } from "./graph/FamilyGraph";

interface Props {
  onHome: () => void;
  onLogout: () => void;
}

export function TreeScreen({ onHome, onLogout }: Props) {
  return (
    <div className="tree-screen">
      <header className="tree-bar">
        <button className="brand brand-button" onClick={onHome}>
          The Legacy Tree
        </button>
        <ul className="legend">
          <li>
            <span className="swatch sw-m" /> Male
          </li>
          <li>
            <span className="swatch sw-f" /> Female
          </li>
          <li>
            <span className="swatch sw-union" /> Partnership
          </li>
          <li>
            <span className="swatch sw-deceased" /> Deceased
          </li>
        </ul>
        <button className="btn btn-link" onClick={onLogout}>
          Sign out
        </button>
      </header>
      <main className="tree-canvas">
        <FamilyGraph />
      </main>
    </div>
  );
}
