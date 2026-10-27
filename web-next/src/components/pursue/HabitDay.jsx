import { useState } from "react";
import { Check } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { dailySteps, formatAmount } from "../../lib/habits";
import { localDateKey } from "../../lib/week";

// Today's steps for one habit, each ticked fresh each day, with what was
// actually done (Cassidy, Oct 27). Tap the amount once ticked to change it:
// 150 push-ups instead of 100, an hour instead of 30 minutes.
// `compact` shows a habit with no steps as just its amount, for the Home row
// that already has the habit's own tick.
export default function HabitDay({ item, compact = false }) {
  const { habitLogs, toggleHabitStep, setHabitAmount } = useAppData();
  const today = localDateKey();
  const steps = dailySteps(item);
  const single = steps.length === 1 && steps[0].key === "habit";
  if (compact && single && steps[0].amount == null) return null;

  return (
    <div className={single && compact ? "" : "mt-1.5 space-y-1"}>
      {steps.map(s => {
        const log = habitLogs.find(l => l.item_id === item.id && l.day === today && l.step === s.key);
        return (
          <StepRow
            key={s.key}
            step={s}
            log={log}
            hideTick={single && compact}
            onToggle={() => toggleHabitStep(item.id, s.key, s.amount).catch(e => console.error("[HabitDay] tick failed:", e))}
            onAmount={v => log && setHabitAmount(log.id, v).catch(e => console.error("[HabitDay] amount failed:", e))}
          />
        );
      })}
    </div>
  );
}

function StepRow({ step, log, hideTick, onToggle, onAmount }) {
  const [editing, setEditing] = useState(false);
  const done = Boolean(log);
  const actual = log?.amount != null ? Number(log.amount) : step.amount;
  const [value, setValue] = useState(actual ?? "");
  const unit = step.unit || "";
  const label = step.key === "habit" ? "" : step.text;

  function save() {
    setEditing(false);
    const v = String(value).trim();
    if (v === String(actual ?? "")) return;
    onAmount(v === "" ? null : v);
  }

  return (
    <div className="flex items-center gap-2.5 min-h-[32px]">
      {!hideTick && (
        <button
          type="button"
          onClick={onToggle}
          role="checkbox"
          aria-checked={done}
          aria-label={`${step.text}: ${done ? "done today, tap to undo" : "tick off for today"}`}
          className={`w-[22px] h-[22px] flex-none rounded-full border flex items-center justify-center transition ${done ? "bg-gold border-gold text-[#19193D]" : "border-borderC hover:border-gold"}`}
        >
          {done && <Check size={12} strokeWidth={2.5} />}
        </button>
      )}
      {label && <span className={`flex-1 min-w-0 truncate text-bodySm ${done ? "text-textMuted" : "text-textPrimary"}`}>{label}</span>}
      {(step.amount != null || done) && (
        editing ? (
          <span className="flex-none inline-flex items-center gap-1">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min="0"
              value={value}
              onChange={e => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
              aria-label={`How much ${step.text} today`}
              className="w-16 bg-surface2 border border-borderC rounded-sm px-1.5 py-0.5 text-caption text-textPrimary outline-none focus:border-forestAccent"
            />
            {unit && <span className="text-caption text-textMuted">{unit}</span>}
          </span>
        ) : (
          <button
            type="button"
            disabled={!done}
            onClick={() => { setValue(actual ?? ""); setEditing(true); }}
            title={done ? "Tap to change how much you did today" : undefined}
            className={`flex-none text-caption rounded-full px-2 min-h-[26px] ${done ? "bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-textPrimary" : "text-textMuted"}`}
          >
            {actual != null ? formatAmount(actual, unit) : done ? "How much?" : ""}
          </button>
        )
      )}
    </div>
  );
}
