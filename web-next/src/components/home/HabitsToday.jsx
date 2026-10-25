import { Link } from "react-router-dom";
import { Check, Flame } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";

// Today's slot in a habit's week of check-ins (M T W T F S S).
export const todaySlot = () => (new Date().getDay() + 6) % 7;

// Every active habit, ready to tick for today (Cassidy, Oct 24: "Active
// daily habits should show up on the home page for ease of access,
// reminding and completion"). Ticking is the same check-in as the habit's
// own card under Pursuits. Habits already on today's sown list above are
// left out so nothing shows twice.
export default function HabitsToday({ skipIds = [] }) {
  const { items, toggleDay } = useAppData();
  const slot = todaySlot();
  const habits = items.filter(i => i.type === "habit" && !i.done && !skipIds.includes(i.id));
  if (habits.length === 0) return null;

  return (
    <div>
      <div className="text-label uppercase text-textMuted mb-1">Your habits</div>
      {habits.map(h => {
        const done = Boolean(h.days?.[slot]);
        return (
          <div key={h.id} className="flex items-center gap-3 min-h-[44px]">
            <button
              type="button"
              onClick={() => toggleDay(h.id, slot)}
              role="checkbox"
              aria-checked={done}
              aria-label={`${h.name}: ${done ? "done today, tap to undo" : "tick off for today"}`}
              className={`w-6 h-6 flex-none rounded-full border flex items-center justify-center transition ${
                done ? "bg-gold border-gold text-[#19193D]" : "border-borderC hover:border-gold"
              }`}
            >
              {done && <Check size={14} strokeWidth={2.5} />}
            </button>
            <Link to="/pursue" className={`flex-1 min-w-0 truncate text-body ${done ? "text-textMuted line-through decoration-1" : "text-textPrimary"}`}>
              {h.name}
            </Link>
            {h.streak > 0 && (
              <span className="flex-none inline-flex items-center gap-1 text-caption text-textSecondary" title={`${h.streak} of 7 this cycle`}>
                <Flame size={12} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
                {h.streak}/7
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
