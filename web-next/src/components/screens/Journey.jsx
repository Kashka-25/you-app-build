import { Placeholder, SectionTitle, Pill, ExploreLink } from "../Primitives";

export default function Journey() {
  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>Journey</SectionTitle>
      <Placeholder label="season">
        <Pill>season of letting go</Pill>
        <div>AI-inferred season indicator, replaces % progress.</div>
      </Placeholder>

      <SectionTitle>Life chapters</SectionTitle>
      <Placeholder label="chapter card" tall>Title, dates, key moments — AI-detected, not manually created.</Placeholder>
      <Placeholder label="chapter card" tall>repeat, scroll vertically</Placeholder>

      <SectionTitle>Deeper views</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <ExploreLink to="/tree" label="tree of YOU" sub="growth metaphor" />
        <ExploreLink to="/constellations" label="constellations" sub="memory star map" />
      </div>

      <SectionTitle>Your pursuits</SectionTitle>
      <ExploreLink to="/pursue" label="habits, goals & dreams" sub="full functional list — add, tag, complete" />
    </div>
  );
}
