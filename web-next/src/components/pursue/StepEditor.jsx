import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "../ui/Button";
import { newStepId } from "../../lib/habits";

const field = "bg-surface2 border border-borderC rounded-sm px-2.5 py-2 text-bodySm text-textPrimary outline-none focus:border-forestAccent shadow-field";

// Editing a pursuit's steps in place (Cassidy, Nov 2): rename them, move
// them, change a habit step's daily amount, add or remove, then save once.
// A habit step keeps its key so its ticked days stay with it: steps made
// before steps had ids were keyed by their words, so on rename they keep
// that old key as their id (lib/habits.js stepKey).
export default function StepEditor({ steps: initial = [], isHabit, onSave, onCancel }) {
  const [steps, setSteps] = useState(() => initial.map(s => ({ ...s, amount: s.amount ?? "", unit: s.unit || "", _from: s.text })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (i, patch) => setSteps(list => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i, by) => setSteps(list => {
    const next = [...list];
    const [s] = next.splice(i, 1);
    next.splice(i + by, 0, s);
    return next;
  });
  const add = () => setSteps(list => [...list, { text: "", done: false, amount: "", unit: "", ...(isHabit && { id: newStepId() }) }]);

  async function save() {
    const cleaned = steps
      .filter(s => s.text.trim())
      .map(({ _from, ...s }) => {
        const out = { ...s, text: s.text.trim() };
        if (isHabit) {
          if (!out.id && _from && _from !== out.text) out.id = `t:${_from}`;
          const n = out.amount === "" || out.amount == null ? null : Number(out.amount);
          if (n == null || Number.isNaN(n)) delete out.amount; else out.amount = n;
          if (out.unit?.trim()) out.unit = out.unit.trim(); else delete out.unit;
        } else {
          delete out.amount;
          delete out.unit;
        }
        return out;
      });
    setSaving(true);
    setError("");
    try {
      await onSave(cleaned);
    } catch (e) {
      console.error("[StepEditor] save failed:", e);
      setError("Couldn't save the steps. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-borderC bg-surface1 p-2.5">
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={s.id || `n${i}`} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                value={s.text}
                onChange={e => set(i, { text: e.target.value })}
                placeholder={isHabit ? "A step, e.g. Push-ups" : "A smaller step"}
                aria-label={`Step ${i + 1}`}
                className={`${field} flex-1 min-w-0`}
              />
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move step ${i + 1} up`} className="w-8 h-8 flex-none flex items-center justify-center text-textMuted disabled:opacity-30">
                <ArrowUp size={14} strokeWidth={1.75} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label={`Move step ${i + 1} down`} className="w-8 h-8 flex-none flex items-center justify-center text-textMuted disabled:opacity-30">
                <ArrowDown size={14} strokeWidth={1.75} />
              </button>
              <button type="button" onClick={() => setSteps(list => list.filter((_, j) => j !== i))} aria-label={`Remove step ${i + 1}`} className="w-8 h-8 flex-none flex items-center justify-center text-textMuted hover:text-red-500">
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            {isHabit && (
              <div className="flex gap-1.5 pl-0.5">
                <input
                  type="number" inputMode="decimal" min="0"
                  value={s.amount}
                  onChange={e => set(i, { amount: e.target.value })}
                  placeholder="Amount"
                  aria-label={`Daily amount for step ${i + 1} (optional)`}
                  className={`${field} w-24 flex-none`}
                />
                <input
                  value={s.unit}
                  onChange={e => set(i, { unit: e.target.value })}
                  placeholder="Unit, e.g. push-ups"
                  aria-label={`Unit for step ${i + 1} (optional)`}
                  className={`${field} flex-1 min-w-0`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 inline-flex items-center gap-1.5 min-h-[36px] text-caption text-forestAccent font-medium">
        <Plus size={14} strokeWidth={2} /> Add a step
      </button>
      {error && <div className="text-caption text-error mt-1">{error}</div>}
      <div className="flex gap-2 mt-2">
        <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="button" size="sm" className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save steps"}</Button>
      </div>
    </div>
  );
}
