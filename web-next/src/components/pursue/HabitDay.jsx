import { useState } from "react";
import { Check } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { dailySteps, formatAmount, isTimeUnit } from "../../lib/habits";
import { localDateKey } from "../../lib/week";

// Today's steps for one habit, each ticked fresh each day, with what was
// actually done (Cassidy, Oct 27). Tap the amount once ticked to change it:
// 150 push-ups instead of 100, an hour instead of 30 minutes.
// `compact` shows a habit with no steps as just its amount, for the Home row
// that already has the habit's own tick.
export default function HabitDay({ item, compact = false }) {
  const { habitLogs, toggleHabitStep, setHabitAmount, setStepUnit } = useAppData();
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
            onUnit={u => setStepUnit(item.id, s.key, u).catch(e => console.error("[HabitDay] unit failed:", e))}
          />
        );
      })}
    </div>
  );
}

// How much can be a plain number, minutes or hours. Time is saved in
// minutes; a step without a unit takes the one chosen the first time.
const KINDS = [
  { key: "count", label: "#" },
  { key: "min", label: "min" },
  { key: "hrs", label: "hrs" }
];

function StepRow({ step, log, hideTick, onToggle, onAmount, onUnit }) {
  const [editing, setEditing] = useState(false);
  const done = Boolean(log);
  const actual = log?.amount != null ? Number(log.amount) : step.amount;
  const [value, setValue] = useState(actual ?? "");
  const unit = step.unit || "";
  const timed = isTimeUnit(unit);
  // A unit like "push-ups" stays as it is; time or nothing can be chosen.
  const canChoose = !unit || timed;
  const [kind, setKind] = useState(timed ? "min" : "count");
  const label = step.key === "habit" ? "" : step.text;

  function start() {
    setKind(timed ? "min" : "count");
    setValue(actual ?? "");
    setEditing(true);
  }

  function save() {
    setEditing(false);
    const v = String(value).trim();
    const n = v === "" ? null : kind === "hrs" ? Math.round(Number(v) * 60) : v;
    if (kind !== "count" && !timed) onUnit("minutes");
    if (kind === "count" && timed) onUnit("");
    if (String(n ?? "") === String(actual ?? "") && (kind === "count") === !timed) return;
    onAmount(n);
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
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              aria-label={`How much ${step.text} today`}
              className="w-16 bg-surface2 border border-borderC rounded-sm px-1.5 py-0.5 text-caption text-textPrimary outline-none focus:border-forestAccent"
            />
            {canChoose ? (
              <span role="radiogroup" aria-label="Count, minutes or hours" className="inline-flex rounded-full border border-borderC overflow-hidden">
                {KINDS.map(k => (
                  <button
                    key={k.key}
                    type="button"
                    role="radio"
                    aria-checked={kind === k.key}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setKind(k.key)}
                    className={`px-1.5 min-h-[24px] text-[11px] ${kind === k.key ? "bg-gold text-[#19193D] font-semibold" : "text-textMuted"}`}
                  >
                    {k.label}
                  </button>
                ))}
              </span>
            ) : (
              <span className="text-caption text-textMuted">{unit}</span>
            )}
            <button type="button" onClick={save} className="min-h-[24px] px-2 rounded-full bg-forestAccent text-onAccent text-[11px] font-medium">Save</button>
          </span>
        ) : (
          <button
            type="button"
            disabled={!done}
            onClick={start}
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
