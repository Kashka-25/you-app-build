import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function Tree() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Tree of YOU</SectionTitle>
      <Placeholder label="tree visualization" className="min-h-[240px]">
        Unique per user. Trunk = courage, branches = relationships, leaves = learning, flowers = gratitude, fruit = purpose.
      </Placeholder>
    </div>
  );
}
