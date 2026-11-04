import { Link } from "react-router-dom";
import { ChevronRight, Sprout, Wheat } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { tendedDaysThisWeek, needsSowing, isSunday, weekStartKey, harvestDue } from "../../lib/week";

// The weekly ritual where the pursuits live (Nov 4): before, Sow and
// Harvest were only offered on Home on certain days, so PursYOUts gave no
// sign the week could be planned. One quiet card, there all week:
//  · nothing sown yet → an invitation to sow;
//  · sown → what's growing this week and how often it's been tended;
//  · a week to look back on → Harvest first.
export default function WeekRitualCard() {
  const { items, weekIntentions, weekHarvests } = useAppData();
  const week = weekStartKey();
  const sown = weekIntentions
    .filter(w => w.week_start === week)
    .map(w => items.find(i => i.id === w.item_id))
    .filter(Boolean);
  const tendedDays = tendedDaysThisWeek(weekIntentions);
  const offerSow = needsSowing(weekIntentions);
  const harvest = harvestDue(weekIntentions, weekHarvests);

  return (
    <section aria-labelledby="pursue-week" className="rounded-card bg-surface1 shadow-card px-4 py-3 mb-4">
      <h2 id="pursue-week" className="font-serif text-h3 text-textPrimary m-0">Your week</h2>
      {sown.length > 0 ? (
        <p className="text-bodySm text-textSecondary m-0 mt-1">
          Growing: {sown.map(i => i.name).join(" · ")}
          {tendedDays > 0 && <span className="text-textMuted"> — tended {tendedDays} {tendedDays === 1 ? "day" : "days"}</span>}
        </p>
      ) : (
        <p className="text-bodySm text-textSecondary m-0 mt-1">
          Choose up to three of these to tend this week. Resting is allowed too.
        </p>
      )}

      {harvest && (
        <Link to="/harvest" className="flex items-center gap-2.5 min-h-[44px] text-bodySm text-textPrimary mt-1">
          <Wheat size={16} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
          <span className="flex-1">{isSunday() ? "Harvest this week" : "Harvest last week"}: look back at what grew</span>
          <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" aria-hidden="true" />
        </Link>
      )}
      <Link to="/sow" className={`flex items-center gap-2.5 min-h-[44px] text-bodySm mt-1 ${offerSow ? "text-forestAccent font-medium" : "text-textSecondary"}`}>
        <Sprout size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="flex-1">
          {offerSow ? (isSunday() ? "Sow next week" : "Sow your week") : "Change this week's sowing"}
        </span>
        <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" aria-hidden="true" />
      </Link>
    </section>
  );
}
