import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function AICompanion() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>YOU companion</SectionTitle>
      <Placeholder label="insight" tall>
        "I've noticed…" pattern reflection, generated from logged data.
      </Placeholder>
      <Placeholder label="suggested for you">short list, time estimates</Placeholder>
    </div>
  );
}
