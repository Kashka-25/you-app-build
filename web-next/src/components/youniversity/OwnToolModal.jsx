import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useAppData } from "../../lib/AppDataContext";

const FIELD = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";

function Field({ label, hint, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-bodySm text-textPrimary font-medium mb-1">{label}</span>
      {hint && <span className="block text-caption text-textMuted mb-1.5">{hint}</span>}
      {children}
    </label>
  );
}

// A tool the Seeker picked up along the way (a breathing technique from a
// therapist, a question from a book), kept in their Library. Add or edit.
export default function OwnToolModal({ open, onClose, tool = null, onSaved }) {
  const { addOwnTool, editOwnTool } = useAppData();
  const [form, setForm] = useState({ name: "", learned_from: "", purpose: "", how: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({
      name: tool?.name || "", learned_from: tool?.learned_from || "",
      purpose: tool?.purpose || "", how: tool?.how || ""
    });
    setError("");
  }, [open, tool]);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const saved = tool ? await editOwnTool(tool.id, form) : await addOwnTool(form);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      console.error("[OwnToolModal] save failed:", err);
      setError("Couldn't save that. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={tool ? "Edit your tool" : "Add a tool of your own"}>
      <form onSubmit={save}>
        {!tool && (
          <div className="text-bodySm text-textSecondary mb-4">
            Something that helps you, picked up along the way. Keep it here with the rest of your Arcana.
          </div>
        )}
        <Field label="What's it called?">
          <input autoFocus required maxLength={120} value={form.name} onChange={set("name")} className={FIELD} placeholder="Box breathing" />
        </Field>
        <Field label="Where did it come from?" hint="Optional: a person, a book, a moment.">
          <input maxLength={200} value={form.learned_from} onChange={set("learned_from")} className={FIELD} placeholder="My counsellor" />
        </Field>
        <Field label="What does it help with?" hint="Optional">
          <textarea rows={2} maxLength={1000} value={form.purpose} onChange={set("purpose")} className={FIELD} placeholder="When my thoughts start racing" />
        </Field>
        <Field label="How do you do it?" hint="Optional. Steps on their own lines if it has them.">
          <textarea rows={5} maxLength={4000} value={form.how} onChange={set("how")} className={FIELD} placeholder={"Breathe in for 4\nHold for 4\nOut for 4\nHold for 4"} />
        </Field>
        {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}
        <div className="flex gap-2.5">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving || !form.name.trim()}>
            {saving ? "Saving…" : tool ? "Save" : "Add to Library"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
