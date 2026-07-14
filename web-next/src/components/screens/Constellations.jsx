import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function Constellations() {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Life constellations</SectionTitle>
      <Placeholder label="star map" className="min-h-[240px]">
        Meaningful memories as stars. Connecting stars reveals patterns. Pulled from Memory Bank.
      </Placeholder>
    </div>
  );
}
