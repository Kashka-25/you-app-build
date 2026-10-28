import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Flame } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import HabitDay from "../pursue/HabitDay";
import { dailySteps } from "../../lib/habits";
import { localDateKey } from "../../lib/week";
import { nextCheckinXp } from "../../lib/xp";

// Today's slot in a habit's week of check-ins (M T W T F S S).
export const todaySlot = () => (new Date().getDay() + 6) % 7;

// Every active habit, ready to tick for today (Cassidy, Oct 24: "Active
// daily habits should show up on the home page for ease of access,
// reminding and completion"). Ticking is the same check-in as the habit's
// own card under Pursuits. Habits already on today's sown list above are
// left out so nothing shows twice.
export default function HabitsToday({ skipIds = [] }) {
  const { items } = useAppData();
  const today = localDateKey();
  const slot = todaySlot();
  const habits = items.filter(i => i.type === "habit" && !i.done && !skipIds.includes(i.id));
  if (habits.length === 0) return null;

  return (
    <div>
      <div className="text-label uppercase text-textMuted mb-1">Your habits</div>
      {habits.map(h => <HabitRow key={h.id} habit={h} slot={slot} today={today} />)}
    </div>
  );
}

// One habit: its tick (or, with steps, how many are done today and a fold
// that opens to tick them; Cassidy, Oct 28), its cycle, and what today's
// check-in earns.
function HabitRow({ habit: h, slot, today }) {
  const { toggleDay, habitLogs, toggleHabitStep, habitStreak } = useAppData();
  const streak = habitStreak(h);
  const [open, setOpen] = useState(false);
  const steps = dailySteps(h);
  const multi = !(steps.length === 1 && steps[0].key === "habit");
  const logsToday = habitLogs.filter(l => l.item_id === h.id && l.day === today);
  // Ticked today: a log for today, or (before daily steps) today's check-in.
  const done = logsToday.length > 0 || Boolean(h.days?.[slot] && h.lastCheckin === today);
  const stepsDone = multi ? steps.filter(s => logsToday.some(l => l.step === s.key)).length : 0;
  // A little "+3 XP" rises from the tick the moment the day is checked in.
  const reduce = useReducedMotion();
  const earned = useRef(nextCheckinXp(streak.before));
  const wasDone = useRef(done);
  const [pop, setPop] = useState(null);
  useEffect(() => {
    if (done && !wasDone.current) {
      setPop(earned.current);
      const t = setTimeout(() => setPop(null), 1400);
      wasDone.current = done;
      return () => clearTimeout(t);
    }
    wasDone.current = done;
    if (!done) earned.current = nextCheckinXp(streak.before);
  }, [done]);
  const tick = () => (logsToday.length > 0 || !done
    ? toggleHabitStep(h.id, "habit", steps[0].amount)
    : toggleDay(h.id, slot)).catch(e => console.error("[HabitsToday] tick failed:", e));

  return (
    <div className="py-1">
      <div className="relative flex items-center gap-3 min-h-[44px]">
        <AnimatePresence>
          {pop && (
            <motion.span
              key="pop"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: reduce ? 0 : -22 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute left-0 top-0 text-[11px] font-semibold text-gold"
              aria-live="polite"
            >
              +{pop} XP
            </motion.span>
          )}
        </AnimatePresence>
        {multi ? (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-label={`${h.name}: ${stepsDone} of ${steps.length} steps today. ${open ? "Fold the steps away" : "Show the steps"}`}
            className={`w-6 h-6 flex-none rounded-full border flex items-center justify-center text-[10px] font-semibold ${
              stepsDone === steps.length ? "bg-gold border-gold text-[#19193D]" : stepsDone > 0 ? "border-gold text-gold" : "border-dashed border-borderC text-textMuted"
            }`}
          >
            {stepsDone === steps.length ? <Check size={14} strokeWidth={2.5} /> : `${stepsDone}/${steps.length}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={tick}
            role="checkbox"
            aria-checked={done}
            aria-label={`${h.name}: ${done ? "done today, tap to undo" : "tick off for today"}`}
            className={`w-6 h-6 flex-none rounded-full border flex items-center justify-center transition ${
              done ? "bg-gold border-gold text-[#19193D]" : "border-borderC hover:border-gold"
            }`}
          >
            {done && <Check size={14} strokeWidth={2.5} />}
          </button>
        )}
        {multi ? (
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex-1 min-w-0 flex items-center gap-1.5 text-left text-body text-textPrimary">
            <span className="truncate">{h.name}</span>
            <ChevronDown size={15} strokeWidth={1.75} className={`flex-none text-textMuted transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <Link to="/pursue" className={`flex-1 min-w-0 truncate text-body ${done ? "text-textMuted line-through decoration-1" : "text-textPrimary"}`}>
            {h.name}
          </Link>
        )}
        {!done && (
          <span className="flex-none text-[11px] font-medium text-gold" title="What today's check-in earns">+{nextCheckinXp(streak.before)} XP</span>
        )}
        {Math.max(streak.now, streak.before) > 0 && (
          <span className="flex-none inline-flex items-center gap-1 text-caption text-textSecondary" title={`${Math.max(streak.now, streak.before)} days in a row`}>
            <Flame size={12} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
            {Math.max(streak.now, streak.before)}
          </span>
        )}
        {!multi && <HabitDay item={h} compact />}
      </div>
      {multi && open && <div className="pl-9 pb-1"><HabitDay item={h} /></div>}
    </div>
  );
}
