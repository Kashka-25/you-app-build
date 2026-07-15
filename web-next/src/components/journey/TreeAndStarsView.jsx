import { useState } from "react";
import AmbientScene from "./tree-stars/AmbientScene";
import TreeDetail from "./tree-stars/TreeDetail";
import ConstellationsDetail from "./tree-stars/ConstellationsDetail";

// Ambient scene is home base for this segment — back from either detail
// screen returns here, not to Journey itself.
export default function TreeAndStarsView() {
  const [view, setView] = useState("ambient");

  if (view === "tree") return <TreeDetail onBack={() => setView("ambient")} />;
  if (view === "stars") return <ConstellationsDetail onBack={() => setView("ambient")} />;
  return <AmbientScene onTapTree={() => setView("tree")} onTapSky={() => setView("stars")} />;
}
