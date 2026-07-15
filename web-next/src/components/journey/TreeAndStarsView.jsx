import { useState } from "react";
import { SectionTitle, Placeholder } from "../Primitives";
import { SegmentedControl } from "../ui/SegmentedControl";

const VIEWS = [
  { value: "tree", label: "Tree of YOU" },
  { value: "stars", label: "Constellations" }
];

export default function TreeAndStarsView() {
  const [view, setView] = useState("tree");

  return (
    <>
      <SegmentedControl options={VIEWS} value={view} onChange={setView} />

      {view === "tree" ? (
        <>
          <SectionTitle>Tree of YOU</SectionTitle>
          <Placeholder label="tree visualization" className="min-h-[240px]">
            Unique per user. Trunk = courage, branches = relationships, leaves = learning,
            flowers = gratitude, fruit = purpose.
          </Placeholder>
        </>
      ) : (
        <>
          <SectionTitle>Life constellations</SectionTitle>
          <Placeholder label="star map" className="min-h-[240px]">
            Meaningful memories as stars. Connecting stars reveals patterns. Pulled from Memory Bank.
          </Placeholder>
        </>
      )}
    </>
  );
}
