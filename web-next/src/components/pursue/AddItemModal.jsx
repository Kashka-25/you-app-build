import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { localDateKey as todayKey } from "../../lib/week";
import { formatAmount, newStepId } from "../../lib/habits";

const INTENTION_PROMPTS = {
  habit: "What will this practice awaken in you?",
  goal: "What will this unlock in you?",
  dream: "What does this dream mean to your soul?"
};

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent shadow-field";
const labelClass = "text-label uppercase text-textMuted";

// Handles both "add a new pursuit" and "edit an existing one" — same form
// either way, prefilled and pointed at editItem when an `item` is passed in
// (same pattern as AddMomentModal/IdentityVisionModal). `prefill` seeds a
// new pursuit (e.g. a dream planted from Freeing the Dream).
export default function AddItemModal({ open, onClose, defaultType = "habit", item, prefill }) {
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
  // Habits: an optional amount for each step (100 push-ups), or for the
  // habit itself when it has no steps (30 minutes).
  const [msAmount, setMsAmount] = useState("");
  const [msUnit, setMsUnit] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
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
      setTargetAmount(item.dailyTarget?.amount ?? "");
      setTargetUnit(item.dailyTarget?.unit || "");
    } else {
      setName(prefill?.name || "");
      setType(defaultType);
      setCat(prefill?.cat || PILLARS[0]);
      setSubcat("");
      setNote(prefill?.note || "");
      setTags([]);
      setMilestones([]);
      setIntention("");
      setCreatedDate(todayKey());
      setTargetAmount("");
      setTargetUnit("");
    }
    setTagInput("");
    setMsText("");
    setMsAmount("");
    setMsUnit("");
  }, [open, item, defaultType, prefill]);

  // Steps and tags used to need the Enter key, which phone keyboards often
  // don't send here (Cassidy, Oct 24: "can't add steps"). Now Enter, the +
  // button, leaving the box, or saving all keep what's been typed.
  const isEnter = e => (e.key === "Enter" || e.keyCode === 13) && !e.nativeEvent?.isComposing;
  function withTag(list = tags) {
    const v = tagInput.trim().replace(/^#/, "").replace(/\s+/g, "-");
    return v && !list.includes(v) ? [...list, v] : list;
  }
  function addTag() {
    setTags(withTag());
    setTagInput("");
  }
  function withMilestone(list = milestones) {
    const v = msText.trim();
    if (!v) return list;
    const step = { text: v, done: false };
    if (type === "habit") {
      step.id = newStepId();
      if (msAmount !== "" && !Number.isNaN(Number(msAmount))) step.amount = Number(msAmount);
      if (msUnit.trim()) step.unit = msUnit.trim();
    }
    return [...list, step];
  }
  function addMilestone() {
    setMilestones(withMilestone());
    setMsText("");
    setMsAmount("");
    setMsUnit("");
  }

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    const steps = withMilestone();
    const dailyTarget = type === "habit" && steps.length === 0 && targetAmount !== "" && !Number.isNaN(Number(targetAmount))
      ? { amount: Number(targetAmount), ...(targetUnit.trim() && { unit: targetUnit.trim() }) }
      : null;
    const payload = { name: name.trim(), type, cat, subcat: subcat.trim(), note: note.trim(), tags: withTag(), milestones: steps, intention: intention.trim(), createdDate, dailyTarget };
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
        onKeyDown={e => { if (isEnter(e)) { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
        enterKeyHint="done"
        placeholder="Type a tag"
      />

      <label className={labelClass}>Steps (optional)</label>
      <div className="mb-1.5">
        {milestones.map((m, i) => (
          <div key={i} className="text-bodySm text-textSecondary flex justify-between items-center py-1">
            <span>{i + 1}. {m.text}{m.amount != null && <span className="text-textMuted"> · {formatAmount(m.amount, m.unit)}</span>}</span>
            <button onClick={() => setMilestones(milestones.filter((_, mi) => mi !== i))} aria-label="Remove step">
              <X size={13} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          className={`${fieldClass} !mb-0 flex-1`}
          value={msText}
          onChange={e => setMsText(e.target.value)}
          onKeyDown={e => { if (isEnter(e)) { e.preventDefault(); addMilestone(); } }}
          onBlur={addMilestone}
          enterKeyHint="enter"
          placeholder={type === "habit" ? "A step, e.g. Push-ups" : "Break it down: a smaller step"}
          aria-label="New step"
        />
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={addMilestone}
          disabled={!msText.trim()}
          aria-label="Add step"
          className="w-11 flex-none rounded-sm border border-borderC bg-surface1 text-textPrimary flex items-center justify-center disabled:opacity-40"
        >
          <Plus size={18} strokeWidth={1.75} />
        </button>
      </div>

      {type === "habit" && (
        <div className="-mt-1 mb-3">
          <div className="flex gap-2">
            <input
              type="number" inputMode="decimal" min="0"
              className={`${fieldClass} !mb-0 w-24 flex-none`}
              value={msAmount}
              onChange={e => setMsAmount(e.target.value)}
              placeholder="Amount"
              aria-label="Amount for this step each day (optional)"
            />
            <input
              className={`${fieldClass} !mb-0 flex-1`}
              value={msUnit}
              onChange={e => setMsUnit(e.target.value)}
              placeholder="Unit, e.g. push-ups or minutes"
              aria-label="Unit (optional)"
            />
          </div>
          <div className="text-caption text-textMuted mt-1">
            Steps start fresh each day, so tick whichever you do. An amount is optional; on the day you can change it to what you really did.
          </div>
        </div>
      )}

      {type === "habit" && milestones.length === 0 && !msText.trim() && (
        <>
          <label className={labelClass}>Each day (optional)</label>
          <div className="flex gap-2 mb-1">
            <input
              type="number" inputMode="decimal" min="0"
              className={`${fieldClass} !mb-0 w-24 flex-none`}
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="30"
              aria-label="Daily amount (optional)"
            />
            <input
              className={`${fieldClass} !mb-0 flex-1`}
              value={targetUnit}
              onChange={e => setTargetUnit(e.target.value)}
              placeholder="minutes"
              aria-label="Daily unit (optional)"
            />
          </div>
          <div className="text-caption text-textMuted mb-3">For a habit without steps, like 30 minutes of reading. YOU adds it up over time.</div>
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
