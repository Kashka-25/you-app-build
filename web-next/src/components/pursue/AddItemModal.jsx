import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const INTENTION_PROMPTS = {
  habit: "What will this practice awaken in you?",
  goal: "What will this unlock in you?",
  dream: "What does this dream mean to your soul?"
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent shadow-field";
const labelClass = "text-label uppercase text-textMuted";

// Handles both "add a new pursuit" and "edit an existing one" — same form
// either way, prefilled and pointed at editItem when an `item` is passed in
// (same pattern as AddMomentModal/IdentityVisionModal).
export default function AddItemModal({ open, onClose, defaultType = "habit", item }) {
  const { addItem, editItem, deleteItem } = useAppData();
  const isEdit = Boolean(item);
  const [name, setName] = useState("");
  const [type, setType] = useState(defaultType);
  const [cat, setCat] = useState(PILLARS[0]);
  const [subcat, setSubcat] = useState("");
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [msText, setMsText] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [intention, setIntention] = useState("");
  const [createdDate, setCreatedDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setName(item.name || "");
      setType(item.type || defaultType);
      setCat(item.cat || PILLARS[0]);
      setSubcat(item.subcat || "");
      setNote(item.note || "");
      setTags(item.tags || []);
      setMilestones(item.milestones || []);
      setIntention(item.intention || "");
      setCreatedDate(item.createdDate || todayKey());
    } else {
      setName("");
      setType(defaultType);
      setCat(PILLARS[0]);
      setSubcat("");
      setNote("");
      setTags([]);
      setMilestones([]);
      setIntention("");
      setCreatedDate(todayKey());
    }
    setTagInput("");
    setMsText("");
  }, [open, item, defaultType]);

  function addTag(e) {
    if (e.key && e.key !== "Enter") return;
    const v = tagInput.trim().replace(/^#/, "").replace(/\s+/g, "-");
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagInput("");
  }
  function addMilestone(e) {
    if (e.key && e.key !== "Enter") return;
    const v = msText.trim();
    if (!v) return;
    setMilestones([...milestones, { text: v }]);
    setMsText("");
  }

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), type, cat, subcat: subcat.trim(), note: note.trim(), tags, milestones, intention: intention.trim(), createdDate };
    if (isEdit) await editItem(item.id, payload);
    else await addItem(payload);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteItem(item.id);
    setDeleting(false);
    onClose();
  }

  return (
    <Modal open={open} title={isEdit ? "Edit pursuit" : "Plant something new"} onClose={onClose}>
      <label className={labelClass}>Name</label>
      <input
        className={fieldClass}
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Morning meditation"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Type</label>
          <select className={fieldClass} value={type} onChange={e => setType(e.target.value)}>
            <option value="habit">Habit</option>
            <option value="goal">Goal</option>
            <option value="dream">Dream</option>
          </select>
        </div>
        <div className="flex-1">
          <label className={labelClass}>Life area</label>
          <select className={fieldClass} value={cat} onChange={e => setCat(e.target.value)}>
            {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <label className={labelClass}>Sub-category (optional)</label>
      <input
        className={fieldClass}
        value={subcat}
        onChange={e => setSubcat(e.target.value)}
        placeholder="Music/Songs"
      />
      <div className="text-caption text-textMuted -mt-2 mb-3">Use "/" to nest, e.g. Music/Songs</div>

      <label className={labelClass}>Date</label>
      <input
        type="date"
        className={fieldClass}
        value={createdDate}
        max={todayKey()}
        onChange={e => setCreatedDate(e.target.value)}
      />

      <label className={labelClass}>Note (optional)</label>
      <textarea className={fieldClass} rows={2} value={note} onChange={e => setNote(e.target.value)} />

      <label className={labelClass}>Tags</label>
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
        className={fieldClass}
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
        onKeyDown={addTag}
        placeholder="Type a tag, press enter"
      />

      {type !== "habit" && (
        <>
          <label className={labelClass}>Milestones</label>
          <div className="mb-1.5">
            {milestones.map((m, i) => (
              <div key={i} className="text-bodySm text-textSecondary flex justify-between items-center py-1">
                <span>{i + 1}. {m.text}</span>
                <button onClick={() => setMilestones(milestones.filter((_, mi) => mi !== i))} aria-label="Remove milestone">
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
          <input
            className={fieldClass}
            value={msText}
            onChange={e => setMsText(e.target.value)}
            onKeyDown={addMilestone}
            placeholder="Add a milestone, press enter"
          />
        </>
      )}

      <label className={labelClass}>{INTENTION_PROMPTS[type]}</label>
      <textarea
        className={`${fieldClass} mb-4`}
        rows={2}
        value={intention}
        onChange={e => setIntention(e.target.value)}
      />

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Plant it"}
        </Button>
      </div>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="w-full text-center text-bodySm text-red-500 mt-3"
        >
          {deleting ? "Deleting…" : "Delete this pursuit"}
        </button>
      )}
    </Modal>
  );
}
