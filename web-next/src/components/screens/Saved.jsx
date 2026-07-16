import { useState } from "react";
import { BackRow, SectionTitle, Pill } from "../Primitives";
import { SegmentedControl } from "../ui/SegmentedControl";
import { EmptyState } from "../ui/EmptyState";

// Scoping still open per BUILD-BACKLOG.md (posts vs quotes vs toolkit vs
// all three) -- built as a tabbed shell so whichever gets prioritized has
// a home already, rather than guessing which one to build first.
const TABS = [
  { value: "posts", label: "Posts" },
  { value: "quotes", label: "Quotes" },
  { value: "toolkit", label: "Toolkit" }
];

const EMPTY_COPY = {
  posts: { title: "No saved posts yet", description: "Posts you save from CommYOUnity will collect here." },
  quotes: { title: "No saved quotes yet", description: "Daily quotes and messages worth keeping will collect here." },
  toolkit: { title: "No saved tools yet", description: "Skills and practices you've learned through YOU will collect here." }
};

export default function Saved() {
  const [tab, setTab] = useState("posts");
  const copy = EMPTY_COPY[tab];

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Saved</SectionTitle>
      <Pill muted>future — design direction only</Pill>

      <div className="my-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      <EmptyState title={copy.title} description={copy.description} />
    </div>
  );
}
