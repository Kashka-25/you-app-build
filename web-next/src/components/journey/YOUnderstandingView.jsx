import { SectionTitle, Placeholder } from "../Primitives";

// The pattern-noticing insight feature — kept clearly distinct from the
// Seed Being avatar/badge, which keeps its existing name unchanged.
export default function YOUnderstandingView() {
  return (
    <>
      <SectionTitle>YOUnderstanding</SectionTitle>
      <Placeholder label="insight" tall>
        "I've noticed…" pattern reflection, generated from logged data.
      </Placeholder>
      <Placeholder label="suggested for you">short list, time estimates</Placeholder>
    </>
  );
}
