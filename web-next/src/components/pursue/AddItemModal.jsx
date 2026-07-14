import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";

const INTENTION_PROMPTS = {
  habit: "What will this practice awaken in you?",
  goal: "What will this unlock in you?",
  dream: "What does this dream mean to your soul?"
};

export default function AddItemModal({ onClose }) {
  const { addItem } = useAppData();
  const [name, setName] = useState("");
  const [type, setType] = useState("habit");
  const [cat, setCat] = useState(PILLARS[0]);
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [msText, setMsText] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [intention, setIntention] = useState("");
  const [saving, setSaving] = useState(false);

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
    await addItem({ name: name.trim(), type, cat, note: note.trim(), tags, milestones, intention: intention.trim() });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-20" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[390px] bg-surface2 rounded-t-[24px] p-5 max-h-[85vh] overflow-y-auto">
        <div className="font-serif text-[19px] font-medium mb-3">Plant something new</div>

        <label className="text-[11px] uppercase tracking-wide text-textMuted">Name</label>
        <input
          className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 mb-3 text-[14px]"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Morning meditation"
        />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-[11px] uppercase tracking-wide text-textMuted">Type</label>
            <select className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 text-[14px]" value={type} onChange={e => setType(e.target.value)}>
              <option value="habit">Habit</option>
              <option value="goal">Goal</option>
              <option value="dream">Dream</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[11px] uppercase tracking-wide text-textMuted">Life area</label>
            <select className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 text-[14px]" value={cat} onChange={e => setCat(e.target.value)}>
              {PILLARS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <label className="text-[11px] uppercase tracking-wide text-textMuted">Note (optional)</label>
        <textarea
          className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 mb-3 text-[14px]"
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <label className="text-[11px] uppercase tracking-wide text-textMuted">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {tags.map(t => (
            <span key={t} className="text-[11px] bg-surface3 text-textSecondary px-2 py-1 rounded-full">
              #{t} <span className="cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))}>&times;</span>
            </span>
          ))}
        </div>
        <input
          className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 mb-3 text-[14px]"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag, press enter"
        />

        {type !== "habit" && (
          <>
            <label className="text-[11px] uppercase tracking-wide text-textMuted">Milestones</label>
            <div className="mb-1.5">
              {milestones.map((m, i) => (
                <div key={i} className="text-[13px] text-textSecondary flex justify-between items-center py-1">
                  <span>{i + 1}. {m.text}</span>
                  <button onClick={() => setMilestones(milestones.filter((_, mi) => mi !== i))}>&times;</button>
                </div>
              ))}
            </div>
            <input
              className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 mb-3 text-[14px]"
              value={msText}
              onChange={e => setMsText(e.target.value)}
              onKeyDown={addMilestone}
              placeholder="Add a milestone, press enter"
            />
          </>
        )}

        <label className="text-[11px] uppercase tracking-wide text-textMuted">{INTENTION_PROMPTS[type]}</label>
        <textarea
          className="w-full bg-surface1 border border-borderC rounded-lg px-3 py-2 mb-4 text-[14px]"
          rows={2}
          value={intention}
          onChange={e => setIntention(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-borderC rounded-lg py-2.5 text-[14px] text-textSecondary">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-forestAccent text-surface2 rounded-lg py-2.5 text-[14px]">
            {saving ? "Planting…" : "Plant it"}
          </button>
        </div>
      </div>
    </div>
  );
}
