import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { compassIsStale } from "../../lib/crossroads";
import Crossroads, { NorthStar } from "./Crossroads";

function niceDay(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Top of the Values section: an invitation to the Crossroads, or the
// compass the Seeker found there.
export default function TrueNorthCard() {
  const { activeValues, compass } = useAppData();
  const [walking, setWalking] = useState(null); // "walk" | "line" | null
  const names = activeValues.map(v => v.name);
  const stale = compassIsStale(compass, names);

  if (!compass && names.length < 2) {
    return (
      <div className="rounded-card bg-surface1 p-4 mb-4 text-bodySm text-textSecondary flex items-center gap-3">
        <NorthStar size={22} color="#9A7A2E" />
        Bring at least two values into focus to find your True North.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card p-5 mb-4 flex flex-col gap-3 text-[#F7F5EF] shadow-cardDark" style={{ background: "#0F1A14" }}>
        {!compass ? (
          <>
            <div className="flex items-center gap-2.5">
              <NorthStar size={28} strokeWidth={1.5} />
              <div className="font-serif text-[22px] font-semibold">Find your True North</div>
            </div>
            <p className="text-body text-[#D9D4C8] m-0">
              {names.length} values, no order yet. A compass needs a north. Walk the crossroads to find which way you lean when they pull against each other.
            </p>
            <button
              onClick={() => setWalking("walk")}
              className="self-start min-h-[44px] px-[18px] rounded-sm bg-[#C9A24D] text-[#0F1A14] font-semibold text-body"
            >
              Walk the crossroads
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <NorthStar size={18} filled strokeWidth={1.5} />
              <span className="text-label uppercase tracking-[0.1em] text-[#C9A24D]">Your True North</span>
            </div>
            <div className="font-serif text-[30px] font-semibold leading-none">{compass.ordering[0].join(" & ")}</div>
            {compass.compass_line ? (
              <p className="font-serif italic text-[19px] leading-snug text-[#EDE6D6] m-0">{compass.compass_line}</p>
            ) : (
              <button onClick={() => setWalking("line")} className="self-start text-body text-[#C9A24D] underline underline-offset-4 min-h-[44px]">
                Write your compass line
              </button>
            )}
            {compass.ordering.length > 1 && (
              <div className="text-bodySm text-[#B8B3A9]">
                then {compass.ordering.slice(1).map(g => g.join(" = ")).join(" · ")}
              </div>
            )}
            {stale && (
              <div className="text-bodySm text-[#D9D4C8] border border-dashed border-[#C9A24D]/40 rounded-sm px-3 py-2.5">
                Your values in focus have changed since you set this. Walk the crossroads again when you’re ready.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {names.length >= 2 && (
                <button onClick={() => setWalking("walk")} className="min-h-[44px] px-4 rounded-sm border border-white/15 text-body text-[#EDE6D6]">
                  Walk again
                </button>
              )}
              {compass.compass_line && (
                <button onClick={() => setWalking("line")} className="min-h-[44px] px-4 rounded-sm text-body text-[#B8B3A9]">
                  Rewrite the line
                </button>
              )}
              <span className="text-caption text-[#8B8E87] ml-auto">Set {niceDay(compass.created_at)}</span>
            </div>
          </>
        )}
      </div>
      <Crossroads open={!!walking} mode={walking || "walk"} onClose={() => setWalking(null)} />
    </>
  );
}
