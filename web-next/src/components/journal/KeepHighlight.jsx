import { useMemo, useState } from "react";
import { X, Highlighter } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";

const fieldClass = "w-full bg-surface2 border border-borderC rounded-sm px-3 py-2.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent shadow-field";

// Keeping some words from an entry: trim them if you like, tag them, link
// them to a dream, and choose whether they may return as a memento.
// onKeep receives the highlight's fields; the caller decides when it's
// saved (straight away, or once a new entry exists).
export default function KeepHighlight({ text: initial, entryTags = [], onKeep, onCancel }) {
  const { items, highlights } = useAppData();
  const [text, setText] = useState(initial);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [itemId, setItemId] = useState("");
  const [asMemento, setAsMemento] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dreams = items.filter(i => i.type === "dream" && !i.done);
  const others = items.filter(i => i.type !== "dream" && !i.done);
  // Tags already in use first, so dream ideas gather under the same words.
  const suggested = useMemo(() => {
    const used = [...new Set([...highlights.flatMap(h => h.tags || []), ...entryTags])];
    return used.filter(t => !tags.includes(t)).slice(0, 8);
  }, [highlights, entryTags, tags]);

  function addTag(raw) {
    const v = (raw ?? tagInput).trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagInput("");
  }

  async function keep() {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onKeep({ text: text.trim(), tags, itemId: itemId || null, asMemento });
    } catch (e) {
      console.error("[KeepHighlight] save failed:", e);
      setError("Couldn't keep that just now. Try again in a moment.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-card border border-gold/50 bg-surface1 p-3.5 mb-3">
      <div className="flex items-center gap-2 text-label uppercase text-textSecondary mb-2">
        <Highlighter size={13} strokeWidth={1.75} className="text-gold" />
        Keep as a highlight
      </div>
      <textarea
        rows={3} value={text} onChange={e => setText(e.target.value)} maxLength={600}
        aria-label="Highlighted words"
        className={`${fieldClass} font-serif italic text-[17px] leading-snug mb-2.5`}
      />

      <div className="text-caption text-textSecondary mb-1">Tags (optional)</div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map(t => (
          <span key={t} className="text-caption bg-surface3 text-textPrimary px-2 py-1 rounded-full flex items-center gap-1">
            #{t}
            <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove tag ${t}`}><X size={11} strokeWidth={2} /></button>
          </span>
        ))}
        {suggested.map(t => (
          <button type="button" key={t} onClick={() => addTag(t)} className="text-caption border border-dashed border-borderC text-textSecondary px-2 py-1 rounded-full">
            + #{t}
          </button>
        ))}
      </div>
      <input
        value={tagInput} onChange={e => setTagInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        onBlur={() => tagInput && addTag()}
        placeholder="idea, music, travel… press enter"
        aria-label="Add a tag"
        className={`${fieldClass} mb-2.5`}
      />

      {(dreams.length > 0 || others.length > 0) && (
        <>
          <label htmlFor="hl-dream" className="block text-caption text-textSecondary mb-1">Feeds a dream? (optional)</label>
          <select id="hl-dream" value={itemId} onChange={e => setItemId(e.target.value)} className={`${fieldClass} mb-2.5`}>
            <option value="">Not linked</option>
            {dreams.length > 0 && (
              <optgroup label="Dreams">{dreams.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Other pursuits">{others.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
            )}
          </select>
        </>
      )}

      <label className="flex items-center gap-2.5 min-h-[40px] text-bodySm text-textPrimary mb-2">
        <input type="checkbox" checked={asMemento} onChange={e => setAsMemento(e.target.checked)} className="w-4 h-4 accent-[#C9A24D]" />
        Let it come back to me as a memento
      </label>

      {error && <div className="text-caption text-red-500 mb-2">{error}</div>}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="sm" className="flex-1" onClick={keep} disabled={saving || !text.trim()}>
          {saving ? "Keeping…" : "Keep it"}
        </Button>
      </div>
    </div>
  );
}
