import { useState, useEffect } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent shadow-field";
const labelClass = "text-label uppercase text-textMuted";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// Handles both "add a new vision" and "edit an existing one", same as
// AddMomentModal — prefilled and pointed at editIdentityVision when a
// `vision` is passed in. Category is one of the same Pillars every other
// part of the app groups by, rather than free text — one taxonomy across
// Pursue, Values and Identity instead of three.
export default function IdentityVisionModal({ open, onClose, vision, initialCategory }) {
  const { addIdentityVision, editIdentityVision, deleteIdentityVision } = useAppData();
  const isEdit = Boolean(vision);

  const [category, setCategory] = useState(initialCategory || PILLARS[0]);
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [visionDate, setVisionDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (vision) {
      setCategory(vision.category || PILLARS[0]);
      setTitle(vision.title || "");
      setStatement(vision.statement || "");
      setReflection(vision.reflection || "");
      setReflecting(Boolean(vision.reflection));
      setVisionDate(vision.vision_date || todayKey());
    } else {
      setCategory(initialCategory || PILLARS[0]);
      setTitle("");
      setStatement("");
      setReflection("");
      setReflecting(false);
      setVisionDate(todayKey());
    }
    setError("");
  }, [open, vision, initialCategory]);

  async function submit() {
    if (!title.trim()) {
      setError("Give it a title — what are you calling this vision of yourself?");
      return;
    }
    if (!statement.trim()) {
      setError("Add a short statement — what does this actually mean?");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { category, title, statement, reflection, visionDate };
      if (isEdit) await editIdentityVision(vision.id, payload);
      else await addIdentityVision(payload);
      onClose();
    } catch (e) {
      console.error("[IdentityVisionModal] save failed:", e);
      setError("Couldn't save that — check your connection and try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteIdentityVision(vision.id);
      onClose();
    } catch (e) {
      console.error("[IdentityVisionModal] delete failed:", e);
      setError("Couldn't delete that — try again.");
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} title={isEdit ? "Edit vision" : "A version of yourself"} onClose={onClose}>
      <label className={labelClass}>Which part of life is this</label>
      <select className={fieldClass} value={category} onChange={e => setCategory(e.target.value)}>
        {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <label className={labelClass}>Title</label>
      <input className={fieldClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Philosopher" />

      <label className={labelClass}>Statement</label>
      <textarea
        className={fieldClass}
        rows={2}
        value={statement}
        onChange={e => setStatement(e.target.value)}
        placeholder="Someone who lives their questions rather than resolving them."
      />

      {reflecting ? (
        <>
          <label className={labelClass}>Say more (optional)</label>
          <textarea className={fieldClass} rows={3} value={reflection} onChange={e => setReflection(e.target.value)} />
        </>
      ) : (
        <button type="button" onClick={() => setReflecting(true)} className="block text-bodySm text-forestAccent mb-3">
          + Say more about it
        </button>
      )}

      <label className={labelClass}>Date</label>
      <input
        type="date"
        className={fieldClass}
        value={visionDate}
        max={todayKey()}
        onChange={e => setVisionDate(e.target.value)}
      />

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save vision"}
        </Button>
      </div>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="w-full text-center text-bodySm text-red-500 mt-3"
        >
          {deleting ? "Deleting…" : "Delete this vision"}
        </button>
      )}
    </Modal>
  );
}
