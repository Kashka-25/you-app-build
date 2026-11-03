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
  const perStep = stats.perStep;

  return (
    <div className="mt-2">
      <div className="text-caption text-textSecondary">
        Done on <b className="text-textPrimary font-medium">{stats.daysDone}</b> of {stats.since} days
        {perStep.length === 0 && totals.length > 0 && <> · {totals.join(" · ")}</>}
      </div>
      {/* With steps, each one on its own line: its days and its total. */}
      {perStep.length > 0 && (
        <ul className="m-0 mt-1 p-0 list-none space-y-0.5">
          {perStep.map(s => (
            <li key={s.key} className="flex items-baseline gap-2 text-caption text-textSecondary">
              <span className="min-w-0 truncate text-textPrimary">{s.text}</span>
              <span className={`flex-none ${s.days < stats.daysDone ? "text-textMuted" : ""}`}>
                {s.days} of {stats.since} {stats.since === 1 ? "day" : "days"}
              </span>
              {s.amount > 0 && <span className="flex-none text-textMuted">· {formatAmount(s.amount, s.unit || s.text.toLowerCase())}</span>}
            </li>
          ))}
        </ul>
      )}
      {party && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-sm bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] px-2.5 py-1.5 text-caption text-textPrimary">
          <Sparkles size={13} strokeWidth={1.75} className="text-gold flex-none mt-0.5" />
          <span>{party.text}</span>
        </div>
      )}
    </div>
  );
}
