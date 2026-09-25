import TreeOfStars from "./tree-stars/TreeOfStars";

// Replaces the old ambient-tap-in -> separate Tree/Constellations screens:
// the real visual is engaging enough on its own now that hiding it behind
// another placeholder tap-through just added friction.
export default function TreeAndStarsView() {
  return <TreeOfStars />;
}
