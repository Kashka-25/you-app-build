import { useEffect, useRef, useState } from "react";
import { X, Highlighter, CalendarDays, Pencil } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { MoodDial } from "../home/DailyCheckIn";
import JournalPhotoSection from "./JournalPhotoSection";
import JournalReflectionCard from "./JournalReflectionCard";
import { localDateKey as todayKey, addDaysKey } from "../../lib/week";
import { scoreOf } from "../../lib/mood";
import { stopsCoveringDate } from "../../lib/wandering";
import PlacePicker from "../wandering/PlacePicker";
import KeepHighlight from "./KeepHighlight";

const labelClass = "block text-label uppercase text-textMuted mb-1.5";
const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";

// "Today", "Yesterday", or the date in words.
function dayLabel(key) {
  if (key === todayKey()) return "Today";
  if (key === addDaysKey(todayKey(), -1)) return "Yesterday";
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

// Add and edit share one form, same pattern as AddMomentModal — prefilled
// and pointed at editJournalEntry when an `entry` is passed in. On a
// successful *create*, onSaved hands the new row back to the caller instead
// of just closing — Reflections.jsx uses this to reopen the same modal in
// edit mode, since photos/AI reflection both need a real entry_id to attach
// to and can't exist before the first save.
// `notice` (optional) is shown at the top, e.g. "check the words" after a scan.
//
// Writing comes first (Cassidy, Nov 2): the page opens ready to type, the
// date is a small chip to change it, and the mood is the same 0–100 scale
// as the Home check-in, optional, underneath.
export default function JournalEntryModal({ open, onClose, onSaved, entry, notice }) {
  const { addJournalEntry, editJournalEntry, deleteJournalEntry, wanderingStops, highlights, addHighlight, updateHighlight } = useAppData();
  const isEdit = Boolean(entry);

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(null);
  const [entryDate, setEntryDate] = useState(todayKey());
  const [pickingDate, setPickingDate] = useState(false);
  const dateInput = useRef(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [stopId, setStopId] = useState(null);
  // Highlights: the selected words, the one being kept, the one being
  // edited, and (for a new entry) those waiting for the entry to be saved.
  const [selection, setSelection] = useState("");
  const [keeping, setKeeping] = useState(null);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    if (!open) return;
    setContent(entry?.content || "");
    setMoodScore(scoreOf(entry));
    setEntryDate(entry?.entry_date || todayKey());
    setPickingDate(false);
    setTags(entry?.tags || []);
    setStopId(entry?.stop_id || null);
    setTagInput("");
    setError("");
    // The window is reused for the next entry, so it opens fresh: after a
    // delete it used to keep saying "Deleting…" (Cassidy, Oct 27).
    setSaving(false);
    setDeleting(false);
    setSelection("");
    setKeeping(null);
    setEditing(null);
    setPending([]);
  }, [open, entry]);

  useEffect(() => {
    if (pickingDate) dateInput.current?.showPicker?.();
  }, [pickingDate]);

  function onSelect(e) {
    const { selectionStart: a, selectionEnd: b, value } = e.target;
    setSelection(b - a >= 3 ? value.slice(a, b).trim() : "");
  }

  async function keepHighlight(fields) {
    if (isEdit) await addHighlight({ ...fields, entryId: entry.id, entryDate });
    else setPending(p => [...p, fields]);
    setKeeping(null);
    setSelection("");
  }

  // Editing a kept highlight: saved straight away once the entry exists.
  async function saveEdited(fields) {
    if (editing.id) {
      await updateHighlight(editing.id, { text: fields.text, tags: fields.tags, item_id: fields.itemId, as_memento: fields.asMemento });
    } else {
      setPending(p => p.map(h => (h === editing.pendingOf ? fields : h)));
    }
    setEditing(null);
  }

  const kept = isEdit ? highlights.filter(h => h.entry_id === entry.id) : pending;

  // A tag half-typed when Save is pressed (or when a phone keyboard has no
  // real Enter) still counts. Commas and spaces separate tags too.
  function withTyped(list) {
    const typed = tagInput.split(/[,\s]+/).map(t => t.replace(/^#/, "").trim()).filter(Boolean);
    return [...new Set([...list, ...typed])];
  }

  function commitTags() {
    setTags(withTyped(tags));
    setTagInput("");
  }

  function addTag(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTags();
    }
  }

  async function submit() {
    if (!content.trim()) {
      setError("Write something first.");
      return;
    }
    setSaving(true);
    setError("");
    const allTags = withTyped(tags);
    setTags(allTags);
    setTagInput("");
    // Only send a place when one could be chosen (see AddMomentModal).
    const place = stopId || stopsCoveringDate(wanderingStops, entryDate).length > 0 || entry?.stop_id ? stopId : undefined;
    try {
      if (isEdit) {
        const saved = await editJournalEntry(entry.id, { content: content.trim(), moodScore, entryDate, tags: allTags, stopId: place });
        onSaved ? onSaved(saved) : onClose();
      } else {
        const saved = await addJournalEntry({ content: content.trim(), moodScore, entryDate, tags: allTags, stopId: place });
        for (const h of pending) await addHighlight({ ...h, entryId: saved.id, entryDate });
        onSaved ? onSaved(saved, { wasNew: true }) : onClose();
      }
    } catch (e) {
      console.error("[JournalEntryModal] save failed:", e);
      setError("Couldn't save that entry — check your connection and try again.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJournalEntry(entry.id);
      setDeleting(false);
      onClose();
    } catch (e) {
      console.error("[JournalEntryModal] delete failed:", e);
      setError("Couldn't delete that entry — try again.");
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} title={isEdit ? "Edit entry" : "New journal entry"} onClose={onClose}>
      {notice && <div className="text-bodySm text-textSecondary bg-surface3 rounded-sm p-3 mb-3">{notice}</div>}

      {/* The day it's for: a small chip, a date picker only when asked. */}
      <div className="flex items-center gap-2 mb-2">
        {pickingDate ? (
          <input
            ref={dateInput}
            type="date"
            aria-label="The day this entry is for"
            className="bg-surface1 border border-borderC rounded-full px-3 py-1.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent"
            value={entryDate}
            max={todayKey()}
            onChange={e => e.target.value && setEntryDate(e.target.value)}
            onBlur={() => setPickingDate(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPickingDate(true)}
            aria-label={`${dayLabel(entryDate)}. Change the day this entry is for`}
            className="inline-flex items-center gap-1.5 min-h-[32px] px-3 rounded-full bg-surface1 border border-borderC text-bodySm text-textPrimary hover:border-forestAccent"
          >
            <CalendarDays size={14} strokeWidth={1.75} className="text-textMuted" />
            {dayLabel(entryDate)}
          </button>
        )}
      </div>

      <textarea
        autoFocus={!isEdit}
        rows={8}
        aria-label="What's on your mind"
        className={`${fieldClass} mb-3 font-serif text-[18px] leading-relaxed`}
        placeholder="What's on your mind? Write whatever feels true right now…"
        value={content}
        onChange={e => setContent(e.target.value)}
        onSelect={onSelect}
      />

      {keeping ? (
        <KeepHighlight text={keeping} entryTags={tags} onKeep={keepHighlight} onCancel={() => setKeeping(null)} />
      ) : selection ? (
        <button
          type="button"
          onClick={() => setKeeping(selection)}
          className="w-full flex items-center gap-2 min-h-[44px] px-3 mb-3 rounded-sm border border-gold/60 bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] text-bodySm text-textPrimary text-left"
        >
          <Highlighter size={16} strokeWidth={1.75} className="text-gold flex-none" />
          <span className="min-w-0 truncate">Keep “{selection}” as a highlight</span>
        </button>
      ) : (
        content.trim().length > 20 && (
          <div className="text-caption text-textMuted -mt-1.5 mb-3">Select any words to keep them as a highlight.</div>
        )
      )}

      {kept.length > 0 && (
        <div className="mb-3">
          <div className={labelClass}>Kept from this entry</div>
          <div className="space-y-1.5">
            {kept.map((h, i) => (
              editing && (editing.id ? editing.id === h.id : editing.pendingOf === h) ? (
                <KeepHighlight key={h.id || i} existing={{ ...h, item_id: h.item_id ?? h.itemId, as_memento: h.as_memento ?? h.asMemento }} entryTags={tags} onKeep={saveEdited} onCancel={() => setEditing(null)} />
              ) : (
                <button
                  key={h.id || i}
                  type="button"
                  onClick={() => setEditing(h.id ? { id: h.id } : { pendingOf: h })}
                  aria-label={`Edit the highlight “${h.text}”`}
                  className="group w-full flex items-start gap-2 text-left font-serif italic text-[16px] leading-snug text-textPrimary border-l-2 border-gold pl-2.5"
                >
                  <span className="flex-1">“{h.text}”</span>
                  <Pencil size={13} strokeWidth={1.75} className="flex-none mt-1 text-textMuted group-hover:text-gold" aria-hidden="true" />
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* How you're feeling: optional, the same scale as the Home check-in. */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <span className={labelClass}>How are you feeling? (optional)</span>
          {moodScore != null && (
            <button type="button" onClick={() => setMoodScore(null)} className="text-caption text-textMuted underline underline-offset-2 min-h-[28px]">
              Clear
            </button>
          )}
        </div>
        {moodScore == null ? (
          <button
            type="button"
            onClick={() => setMoodScore(50)}
            className="w-full min-h-[44px] rounded-sm border border-dashed border-borderC text-bodySm text-textSecondary hover:border-forestAccent hover:text-textPrimary"
          >
            Add how you're feeling
          </button>
        ) : (
          <MoodDial score={moodScore} onChange={setMoodScore} compact label="How you're feeling" />
        )}
      </div>

      <PlacePicker dateKey={entryDate} value={stopId} onChange={setStopId} autoSelect={!isEdit} />

      <label className={labelClass}>Tags / themes (optional)</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span key={t} className="text-caption bg-surface3 text-textSecondary px-2 py-1 rounded-full flex items-center gap-1">
            #{t}
            <button onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove tag ${t}`}>
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        ))}
      </div>
      <input
        className={`${fieldClass} mb-3`}
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
        onKeyDown={addTag}
        onBlur={commitTags}
        enterKeyHint="done"
        placeholder="Type a tag, e.g. dream or idea"
      />

      {isEdit && <JournalPhotoSection entryId={entry.id} />}

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save entry"}
        </Button>
      </div>

      {isEdit && <JournalReflectionCard entryId={entry.id} />}

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
