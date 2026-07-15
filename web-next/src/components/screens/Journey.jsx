import { useState } from "react";
import { SectionTitle } from "../Primitives";
import { SegmentedControl } from "../ui/SegmentedControl";
import ChaptersView from "../journey/ChaptersView";
import TreeAndStarsView from "../journey/TreeAndStarsView";
import YOUnderstandingView from "../journey/YOUnderstandingView";

const TABS = [
  { value: "chapters", label: "Chapters" },
  { value: "tree-stars", label: "Tree & Stars" },
  { value: "youn", label: "YOUnderstanding" }
];

export default function Journey() {
  const [tab, setTab] = useState("chapters");

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>Journey</SectionTitle>
      <div className="mb-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "chapters" && <ChaptersView />}
      {tab === "tree-stars" && <TreeAndStarsView />}
      {tab === "youn" && <YOUnderstandingView />}
    </div>
  );
}
