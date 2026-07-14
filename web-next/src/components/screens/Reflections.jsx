import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function Reflections() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Reflections</SectionTitle>
      <Placeholder label="today's prompt">journal entry, mood tag</Placeholder>
      <Placeholder label="recent reflection" tall>card</Placeholder>
      <Placeholder label="recent reflection" tall>card</Placeholder>
    </div>
  );
}
