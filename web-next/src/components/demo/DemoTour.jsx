import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Compass } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { isDemo, demoKind, readTour, writeTour } from "../../lib/demo/mode";
import { localDateKey } from "../../lib/week";
import BetaInvite from "./BetaInvite";

// A short path through Wren's universe, at the top of Home in the example
// demo (Cassidy, Nov 9: "an obvious example journey to follow"). Steps that
// ask the visitor to do something tick themselves when it's done; the rest
// tick when opened. It folds away, and Reset brings it back.
export default function DemoTour() {
  const { moodLog, habitLogs } = useAppData();
  const [tour, setTour] = useState(readTour);
  if (!isDemo() || demoKind() !== "example") return null;

  const today = localDateKey();
  const save = next => { setTour(next); writeTour(next); };
  const visit = key => { if (!tour.seen.includes(key)) save({ ...tour, seen: [...tour.seen, key] }); };

  const steps = [
    { key: "arrive", title: "Say how you're arriving", says: "Answer Wren's check-in, just below.", done: moodLog.some(m => m.date_key === today) },
    { key: "habit", title: "Tick one of Wren's habits", says: "In Today, a walk, morning pages or stillness.", done: habitLogs.some(l => l.day === today) },
    { key: "journal", to: "/reflections", title: "Read six weeks of YOUrnal", says: "Seventeen entries, moods and highlights." },
    { key: "pursue", to: "/pursue", title: "See what Wren is growing", says: "Habits, goals, dreams and ideas, with their steps." },
    { key: "journey", to: "/journey", title: "Walk through Wren's YOUrney", says: "Moments across a life, and its chapters." },
    { key: "you", to: "/you", title: "Meet the YOU behind it", says: "Pillars, values, the compass and Wren's rank." }
  ].map(s => ({ ...s, done: s.done ?? tour.seen.includes(s.key) }));
  const doneCount = steps.filter(s => s.done).length;

  return (
    <section aria-labelledby="demo-tour" className="rounded-card bg-surface1 shadow-card p-4 border border-[color-mix(in_srgb,var(--gold)_35%,transparent)]">
      <button
        type="button"
        onClick={() => save({ ...tour, folded: !tour.folded })}
        aria-expanded={!tour.folded}
        className="w-full flex items-center gap-2.5 text-left"
      >
        <Compass size={18} strokeWidth={1.75} className="flex-none text-gold" aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span id="demo-tour" className="block font-serif text-h3 font-semibold text-textPrimary">A short tour of Wren's universe</span>
          <span className="block text-caption text-textMuted">{doneCount} of {steps.length} · Wren is made up; nothing you do leaves this browser</span>
        </span>
        <ChevronDown size={18} strokeWidth={1.75} className={`flex-none text-textMuted transition-transform ${tour.folded ? "" : "rotate-180"}`} aria-hidden="true" />
      </button>
      {!tour.folded && (
        <ol className="list-none m-0 mt-3 p-0 space-y-1">
          {steps.map((s, i) => {
            const body = (
              <>
                <span className={`w-6 h-6 flex-none rounded-full border flex items-center justify-center text-[11px] font-semibold ${s.done ? "bg-gold border-gold text-[#19193D]" : "border-borderC text-textMuted"}`}>
                  {s.done ? <Check size={13} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-bodySm ${s.done ? "text-textMuted" : "text-textPrimary font-medium"}`}>{s.title}</span>
                  <span className="block text-caption text-textMuted">{s.says}</span>
                </span>
              </>
            );
            return (
              <li key={s.key}>
                {s.to ? (
                  <Link to={s.to} onClick={() => visit(s.key)} className="flex items-start gap-3 min-h-[44px] py-1.5 rounded-sm hover:bg-surface2">{body}</Link>
                ) : (
                  <div className="flex items-start gap-3 min-h-[44px] py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {/* The tour ends with the invitation (Cassidy, Nov 9); folded, it stays out of the way. */}
      {!tour.folded && (
        <>
          {doneCount === steps.length && (
            <p className="text-bodySm text-textPrimary mt-3 mb-0">That's Wren's universe. Yours would start blank and grow the same way.</p>
          )}
          <BetaInvite className="mt-3" />
        </>
      )}
    </section>
  );
}
