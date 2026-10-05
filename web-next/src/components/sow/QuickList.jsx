import { useState } from "react";
import { Check, X, Plus } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { StepList, stepProgress } from "../ui/StepList";

// The quick list — small things for today only (the `todos` table): no
// Pillar, no XP, no streaks, and whatever's left tonight falls away. Shared
// by the Threshold and Home's Today card, with an inline add so a to-do can
// be jotted down without leaving the screen (the Threshold has no + button).
export default function QuickList({ showLabel = true }) {
  const { todos, addTodo, toggleTodo, deleteTodo, addTodoStep, toggleTodoStep, removeTodoStep } = useAppData();
  const [openId, setOpenId] = useState(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Write something first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addTodo(text.trim());
      setText("");
    } catch (err) {
      console.error("[QuickList] addTodo failed:", err);
      setError("Couldn't add that. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <div>
      {showLabel && <div className="text-label uppercase text-textMuted mb-1">Quick list</div>}
      {todos.map(t => {
        const open = openId === t.id;
        const { total, done } = stepProgress(t.steps);
        return (
          <div key={t.id} className="py-1.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleTodo(t.id)}
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.done ? `Mark "${t.text}" not done` : `Mark "${t.text}" done`}
                className={`w-6 h-6 flex-none rounded-full border flex items-center justify-center ${
                  t.done ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-transparent hover:border-forestAccent"
                }`}
              >
                <Check size={12} strokeWidth={2.5} />
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-body ${t.done ? "text-textMuted line-through" : "text-textPrimary"}`}>{t.text}</div>
                {total > 0 && !open && <div className="text-caption text-textMuted">{done} of {total} {total === 1 ? "step" : "steps"}</div>}
              </div>
              <button
                onClick={() => setOpenId(open ? null : t.id)}
                aria-expanded={open}
                className="flex-none text-caption text-textMuted hover:text-textSecondary px-1"
              >
                {open ? "Done" : "Steps"}
              </button>
              <button onClick={() => deleteTodo(t.id)} aria-label={`Remove "${t.text}"`} className="text-textMuted flex-none">
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>
            {open && (
              <div className="pl-9 pt-1.5">
                <StepList
                  steps={t.steps || []}
                  onToggle={si => toggleTodoStep(t.id, si).catch(e => console.error("[QuickList] step toggle failed:", e))}
                  onAdd={text => addTodoStep(t.id, text)}
                  onRemove={si => removeTodoStep(t.id, si).catch(e => console.error("[QuickList] step remove failed:", e))}
                />
              </div>
            )}
          </div>
        );
      })}
      <form onSubmit={add} className="flex items-center gap-3 py-1.5">
        <span className="w-6 h-6 flex-none rounded-full border border-dashed border-borderC flex items-center justify-center text-textMuted">
          <Plus size={12} strokeWidth={2} />
        </span>
        <input
          value={text}
          onChange={e => { setText(e.target.value); setError(""); }}
          placeholder="Add something for today"
          aria-label="Add something for today"
          disabled={saving}
          className="flex-1 min-w-0 bg-transparent text-body text-textPrimary placeholder:text-textMuted outline-none py-1"
        />
        {text.trim() && (
          <button type="submit" disabled={saving} className="flex-none text-caption text-forestAccent font-medium">
            {saving ? "Adding…" : "Add"}
          </button>
        )}
      </form>
      {error && <div className="text-caption text-error pl-9">{error}</div>}
    </div>
  );
}
