import { Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { celebration, formatAmount, habitStats } from "../../lib/habits";
import { localDateKey } from "../../lib/week";

// A habit's story so far: days done out of days since it began, and the
// running total of each amount, with a small celebration at round numbers
// ("Wow, 100 days of this habit out of 140. That's 10,000 push-ups.").
export default function HabitTotals({ item }) {
  const { habitLogs } = useAppData();
  const stats = habitStats(item, habitLogs, localDateKey());
  if (stats.daysDone === 0) return null;
  const party = celebration(stats);
  const totals = stats.totals.map(t => formatAmount(t.amount, t.unit || (t.key === "habit" ? "" : t.text.toLowerCase())));

  return (
    <div className="mt-2">
      <div className="text-caption text-textSecondary">
        Done on <b className="text-textPrimary font-medium">{stats.daysDone}</b> of {stats.since} days
        {totals.length > 0 && <> · {totals.join(" · ")}</>}
      </div>
      {party && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-sm bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] px-2.5 py-1.5 text-caption text-textPrimary">
          <Sparkles size={13} strokeWidth={1.75} className="text-gold flex-none mt-0.5" />
          <span>{party.text}</span>
        </div>
      )}
    </div>
  );
}
