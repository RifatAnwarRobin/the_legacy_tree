import { useState } from "react";

import { Landing } from "./Landing";
import { TreeScreen } from "./TreeScreen";

type Page = "landing" | "tree";

export default function App() {
  const [page, setPage] = useState<Page>("landing");

  if (page === "tree") {
    return <TreeScreen onHome={() => setPage("landing")} />;
  }
  return <Landing onEnter={() => setPage("tree")} />;
}
