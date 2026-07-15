import { Placeholder, SectionTitle, Pill, ExploreLink } from "../Primitives";

export default function ChaptersView() {
  return (
    <>
      <Placeholder label="season">
        <Pill>season of letting go</Pill>
        <div>AI-inferred season indicator, replaces % progress.</div>
      </Placeholder>

      <SectionTitle>Life chapters</SectionTitle>
      <Placeholder label="chapter card" tall>Title, dates, key moments — AI-detected, not manually created.</Placeholder>
      <Placeholder label="chapter card" tall>repeat, scroll vertically</Placeholder>

      <SectionTitle>Your pursuits</SectionTitle>
      <ExploreLink to="/pursue" label="habits, goals & dreams" sub="full functional list — add, tag, complete" />
    </>
  );
}
