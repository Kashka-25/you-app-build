import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SegmentedControl } from "../ui/SegmentedControl";
import ChaptersView from "../journey/ChaptersView";
import TreeAndStarsView from "../journey/TreeAndStarsView";
import YOUnderstandingView from "../journey/YOUnderstandingView";
import IdentityVisionView from "../journey/IdentityVisionView";

const TAB_KEY = "you.journey-tab";

const TABS = [
  { value: "chapters", label: "Memories" },
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
// Shown to the Seeker as "YOUrney" (renamed Oct 1: the whole life story is
// the YOUrney). The route and code keep "journey" so old links still work.
// Travel plans are a different thing: Wanderings, which live in Dreams.
export default function Journey() {
  const location = useLocation();
  // The last tab is remembered for this visit (Nov 4), so coming back from
  // an entry opened in YOUnderstanding returns there, not to Memories.
  const [tab, setTabState] = useState(() => {
    if (location.state?.tab) return location.state.tab;
    try { return sessionStorage.getItem(TAB_KEY) || "chapters"; } catch { return "chapters"; }
  });
  function setTab(next) {
    setTabState(next);
    try { sessionStorage.setItem(TAB_KEY, next); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab);
  }, [location.key]);

  return (
    <div className="pt-1 pb-24 px-5">
      {/* A painted header like YOUrnal's and PursYOUts' (Cassidy, Nov 4),
          with the four ways into your story on the painting itself. */}
      <section aria-labelledby="yourney-title" className="relative mt-3 mb-4 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/yourney.webp"
          alt=""
          width="705"
          height="380"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_30%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/75 via-45% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/75" />
        <div className="relative flex flex-col justify-end min-h-[210px] pt-20">
          <div className="px-4">
            <h1 id="yourney-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">YOUrney</h1>
            <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">Your story, as it unfolds.</p>
          </div>
          {/* the tabs run nearly edge to edge so all four fit on a phone */}
          <div className="mt-3 px-1.5 pb-1.5">
            <SegmentedControl options={TABS} value={tab} onChange={setTab} />
          </div>
        </div>
      </section>

      {tab === "chapters" && <ChaptersView />}
      {tab === "identity" && <IdentityVisionView />}
      {tab === "tree-stars" && <TreeAndStarsView />}
      {tab === "youn" && <YOUnderstandingView />}
    </div>
  );
}
