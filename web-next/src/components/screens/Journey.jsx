import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SectionTitle } from "../Primitives";
import { SegmentedControl } from "../ui/SegmentedControl";
import ChaptersView from "../journey/ChaptersView";
import TreeAndStarsView from "../journey/TreeAndStarsView";
import YOUnderstandingView from "../journey/YOUnderstandingView";
import IdentityVisionView from "../journey/IdentityVisionView";

const TABS = [
  { value: "chapters", label: "Chapters" },
  { value: "identity", label: "Identity" },
  { value: "tree-stars", label: "Tree & Stars" },
  { value: "youn", label: "YOUnderstanding" }
];

// A Link into this screen can jump straight to a tab (e.g. Bring Me Back to
// Myself linking into "identity") by passing router state: `state={{ tab:
// "identity" }}` — falls back to the default when opened normally from the
// nav bar, where there's no location state at all. The effect (keyed on
// location.key, which changes on every navigation even to the same route)
// is what makes this also work for a Link back into Journey from *inside*
// Journey itself — the state-only useState initializer above only runs on
// first mount, so without it a same-route Link's state was silently ignored.
export default function Journey() {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "chapters");

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.key]);

  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>Journey</SectionTitle>
      <div className="mb-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "chapters" && <ChaptersView />}
      {tab === "identity" && <IdentityVisionView />}
      {tab === "tree-stars" && <TreeAndStarsView />}
      {tab === "youn" && <YOUnderstandingView />}
    </div>
  );
}
