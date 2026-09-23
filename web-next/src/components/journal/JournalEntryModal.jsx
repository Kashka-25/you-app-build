import { useEffect, useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { MoodSelector } from "../ui/Input";

const labelClass = "block text-label uppercase text-textMuted mb-1.5";
const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// Add and edit share one form, same pattern as AddMomentModal — prefilled
// and pointed at editJournalEntry when an `entry` is passed in.
export default function JournalEntryModal({ open, onClose, entry }) {
  const { addJournalEntry, editJournalEntry, deleteJournalEntry } = useAppData();
  const isEdit = Boolean(entry);

  const [content, setContent] = useState("");
  const [mood, setMood] = useState(null);
  const [entryDate, setEntryDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setContent(entry?.content || "");
    setMood(entry?.mood || null);
    setEntryDate(entry?.entry_date || todayKey());
    setError("");
  }, [open, entry]);

  async function submit() {
    if (!content.trim()) {
      setError("Write something first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await editJournalEntry(entry.id, { content: content.trim(), mood, entryDate });
      } else {
        await addJournalEntry({ content: content.trim(), mood, entryDate });
      }
      onClose();
    } catch (e) {
      console.error("[JournalEntryModal] save failed:", e);
      setError("Couldn't save that entry — check your connection and try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJournalEntry(entry.id);
      onClose();
    } catch (e) {
      console.error("[JournalEntryModal] delete failed:", e);
      setError("Couldn't delete that entry — try again.");
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} title={isEdit ? "Edit entry" : "New journal entry"} onClose={onClose}>
      <label className={labelClass}>Date</label>
      <input
        type="date"
        className={`${fieldClass} mb-3`}
        value={entryDate}
        max={todayKey()}
        onChange={e => setEntryDate(e.target.value)}
      />

      <label className={labelClass}>How are you feeling? (optional)</label>
      <MoodSelector value={mood} onChange={setMood} className="mb-3" />

      <label className={labelClass}>What's on your mind</label>
      <textarea
        autoFocus={!isEdit}
        rows={7}
        className={`${fieldClass} mb-3`}
        placeholder="Write whatever feels true right now…"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </Button>
      </div>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="w-full text-center text-bodySm text-red-500 mt-3"
        >
          {deleting ? "Deleting…" : "Delete this entry"}
        </button>
      )}
    </Modal>
  );
}
