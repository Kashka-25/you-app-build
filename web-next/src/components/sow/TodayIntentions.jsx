import { Check, Moon, Sprout, ArrowRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLAR_COLORS } from "../../constants/app.const";
import { isDueToday, localDateKey } from "../../lib/week";
import { stepProgress } from "../ui/StepList";

const TYPE_LABEL = { habit: "Habit", goal: "Goal", dream: "Dream" };

// The thread: why this small action matters. The item's own intention (the
// "why" written when it was planted) if there is one, else its type, then
// the Value it serves.
function Thread({ item, valueName }) {
  const why = item.intention ? (item.intention.length > 48 ? item.intention.slice(0, 48) + "…" : item.intention) : TYPE_LABEL[item.type];
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-caption text-textSecondary">
      <span>{why}</span>
      {valueName && (
        <>
          <ArrowRight size={11} strokeWidth={1.75} className="text-textMuted" />
          <span className="px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-textPrimary">{valueName}</span>
        </>
      )}
    </div>
  );
}

// If the pursuit has been broken into steps, the next unfinished one is
// what today asks for — shown under the thread with its own tick.
function NextStep({ item, onToggle }) {
  const steps = item.milestones || [];
  const { total, done, next } = stepProgress(steps);
  if (total === 0) return null;
  if (next === -1) return <div className="text-caption text-textMuted mt-1">All {total} steps done</div>;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <button
        onClick={() => onToggle(next)}
        role="checkbox"
        aria-checked={false}
        aria-label={`Mark step "${steps[next].text}" done`}
        className="w-4 h-4 flex-none rounded-full border border-borderC hover:border-sage"
      />
      <span className="text-caption text-textSecondary">
        Next step: <span className="text-textPrimary">{steps[next].text}</span>
        <span className="text-textMuted"> · {done + 1} of {total}</span>
      </span>
    </div>
  );
}

// What's on today's sown list, and what's resting. Exposed separately so
// callers can tell whether the list will render anything at all.
export function useTodayList() {
  const { weekIntentions, items } = useAppData();
  const today = localDateKey();
  const withItem = list => list
    .map(w => ({ w, item: items.find(i => i.id === w.item_id) }))
    .filter(x => x.item);
  const due = withItem(weekIntentions.filter(w => isDueToday(w)));
  // Rest is an escape hatch, so it has to be undoable from the same place.
  const restedToday = withItem(weekIntentions.filter(w => (w.rested_dates || []).includes(today)));
  return { due, restedToday, isEmpty: due.length === 0 && restedToday.length === 0 };
}

// Today's sown intentions, shared by the Threshold and Home's Today card.
// Returns null when nothing is due, so callers decide what an empty day
// looks like.
export default function TodayIntentions() {
  const { toggleTended, restIntentionToday, toggleMilestone } = useAppData();
  const today = localDateKey();
  const { due, restedToday, isEmpty } = useTodayList();

  if (isEmpty) return null;

  return (
    <div>
      {due.map(({ w, item }, idx) => {
        const tended = (w.tended_dates || []).includes(today);
        return (
          <div key={w.id} className={`flex items-start gap-3 py-3 ${idx > 0 ? "border-t border-borderC" : ""}`}>
            <button
              onClick={() => toggleTended(w.id)}
              role="checkbox"
              aria-checked={tended}
              aria-label={tended ? `Mark "${item.name}" not tended` : `Mark "${item.name}" tended`}
              className={`w-6 h-6 mt-0.5 flex-none rounded-full border flex items-center justify-center transition-colors duration-200 ${
                tended ? "bg-forestAccent border-forestAccent text-surface2" : "border-borderC text-transparent hover:border-forestAccent"
              }`}
            >
              <Check size={12} strokeWidth={2.5} />
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-body ${tended ? "text-textSecondary" : "text-textPrimary"}`}>{item.name}</div>
              <Thread item={item} valueName={w.value_name} />
              <NextStep item={item} onToggle={mi => toggleMilestone(item.id, mi)} />
              {tended && (
                <div className="flex items-center gap-1.5 mt-1.5 text-caption" style={{ color: PILLAR_COLORS[item.cat] || "var(--forest-accent)" }}>
                  <Sprout size={13} strokeWidth={1.75} />
                  Your {item.cat} roots grew
                </div>
              )}
            </div>
            {!tended && (
              <button
                onClick={() => restIntentionToday(w.id)}
                className="flex-none inline-flex items-center gap-1 text-caption text-textMuted hover:text-textSecondary px-2 py-1 rounded-sm"
              >
                <Moon size={13} strokeWidth={1.75} />
                Rest today
              </button>
            )}
          </div>
        );
      })}
      {restedToday.map(({ w, item }) => (
        <div key={w.id} className="flex items-center gap-3 py-2 border-t border-borderC text-caption text-textMuted">
          <Moon size={13} strokeWidth={1.75} className="flex-none" />
          <span className="flex-1 min-w-0">{item.name} is resting today</span>
          <button onClick={() => restIntentionToday(w.id)} className="flex-none text-textSecondary underline underline-offset-2">
            Bring back
          </button>
        </div>
      ))}
    </div>
  );
}
