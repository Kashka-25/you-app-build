import { useState } from "react";
import { Check, X, Plus } from "lucide-react";

// Smaller steps that break something bigger into achievable pieces. One
// recipe for pursuits (stored as `items.milestones`) and quick-list to-dos
// (`todos.steps`), so breaking things down feels the same everywhere.
// steps: [{ text, done }]
export function StepList({ steps = [], onToggle, onAdd, onRemove, placeholder = "Add a smaller step" }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write the step first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onAdd(text.trim());
      setText("");
    } catch (err) {
      console.error("[StepList] add failed:", err);
      setError("Couldn't add that step. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5 py-0.5">
          <button
            type="button"
            onClick={() => onToggle(i)}
            role="checkbox"
            aria-checked={Boolean(s.done)}
            aria-label={s.done ? `Mark step "${s.text}" not done` : `Mark step "${s.text}" done`}
            className={`w-[18px] h-[18px] flex-none rounded-full border flex items-center justify-center ${
              s.done ? "bg-sage border-sage text-surface2" : "border-borderC text-transparent hover:border-sage"
            }`}
          >
            <Check size={10} strokeWidth={2.5} />
          </button>
          <span className={`flex-1 min-w-0 text-bodySm ${s.done ? "line-through decoration-gold text-textMuted" : "text-textPrimary"}`}>{s.text}</span>
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)} aria-label={`Remove step "${s.text}"`} className="flex-none text-textMuted">
              <X size={13} strokeWidth={1.75} />
            </button>
          )}
        </div>
      ))}
      {onAdd && (
        <form onSubmit={add} className="flex items-center gap-2.5 py-0.5">
          <span className="w-[18px] h-[18px] flex-none rounded-full border border-dashed border-borderC flex items-center justify-center text-textMuted">
            <Plus size={10} strokeWidth={2} />
          </span>
          <input
            value={text}
            onChange={e => { setText(e.target.value); setError(""); }}
            placeholder={placeholder}
            aria-label={placeholder}
            disabled={saving}
            className="flex-1 min-w-0 bg-transparent text-bodySm text-textPrimary placeholder:text-textMuted outline-none py-0.5"
          />
          {text.trim() && (
            <button type="submit" disabled={saving} className="flex-none text-caption text-forestAccent font-medium">
              {saving ? "Adding…" : "Add"}
            </button>
          )}
        </form>
      )}
      {error && <div className="text-caption text-error pl-7">{error}</div>}
    </div>
  );
}

export function stepProgress(steps = []) {
  const total = steps.length;
  const done = steps.filter(s => s.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, next: steps.findIndex(s => !s.done) };
}
