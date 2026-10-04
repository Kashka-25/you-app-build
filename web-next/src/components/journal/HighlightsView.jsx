import { useMemo, useState } from "react";
import { Highlighter, Sparkles, Trash2, Star } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { EmptyState } from "../ui/EmptyState";

function niceDate(key) {
  return key ? new Date(key + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

// Every highlight kept from the journal: gathered under the dream it feeds
// (so dream ideas collect in one place), then the rest. Filter by tag.
export default function HighlightsView({ onOpenEntry }) {
  const { highlights, items, journalEntries, updateHighlight, deleteHighlight } = useAppData();
  const [tag, setTag] = useState(null);

  const allTags = useMemo(() => [...new Set(highlights.flatMap(h => h.tags || []))].sort(), [highlights]);
  const shown = tag ? highlights.filter(h => (h.tags || []).includes(tag)) : highlights;
  const byItem = useMemo(() => {
    const groups = {};
    shown.filter(h => h.item_id).forEach(h => { (groups[h.item_id] = groups[h.item_id] || []).push(h); });
    return Object.entries(groups)
      .map(([id, list]) => ({ item: items.find(i => i.id === id), list }))
      .filter(g => g.item)
      .sort((a, b) => (a.item.type === "dream" ? -1 : 1) - (b.item.type === "dream" ? -1 : 1));
  }, [shown, items]);
  const loose = shown.filter(h => !h.item_id || !items.some(i => i.id === h.item_id));

  if (highlights.length === 0) {
    return (
      <EmptyState
        icon={Highlighter}
        title="No highlights yet"
        description="Open an entry and select any words worth keeping, or keep the moments a reflection finds. Link them to a dream and they'll gather here."
      />
    );
  }

  const card = h => {
    const entry = journalEntries.find(e => e.id === h.entry_id);
    return (
      <div key={h.id} className="rounded-card bg-surface1 shadow-card p-4 mb-2.5">
        <div className="font-serif italic text-[18px] leading-snug text-textPrimary">“{h.text}”</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {entry ? (
            <button type="button" onClick={() => onOpenEntry(entry)} className="text-caption text-textSecondary underline underline-offset-2">
              {niceDate(h.entry_date)}
            </button>
          ) : (
            <span className="text-caption text-textMuted">{niceDate(h.entry_date)}</span>
          )}
          {(h.tags || []).map(t => (
            <button type="button" key={t} onClick={() => setTag(tag === t ? null : t)} className="text-caption bg-surface3 text-textSecondary px-2 py-0.5 rounded-full">#{t}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <select
            value={h.item_id || ""}
            onChange={e => updateHighlight(h.id, { item_id: e.target.value || null })}
            aria-label="Dream this feeds"
            className="flex-1 min-w-0 bg-surface2 border border-borderC rounded-sm px-2.5 py-2 text-caption text-textPrimary"
          >
            <option value="">Not linked to a dream</option>
            {items.filter(i => !i.done || i.id === h.item_id).map(i => <option key={i.id} value={i.id}>{i.type === "dream" ? "✦ " : ""}{i.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => updateHighlight(h.id, { as_memento: !h.as_memento })}
            aria-pressed={h.as_memento}
            aria-label={h.as_memento ? "Comes back as a memento. Tap to stop." : "Let it come back as a memento"}
            title={h.as_memento ? "Comes back as a memento" : "Not a memento"}
            className={`w-10 h-10 flex-none rounded-full flex items-center justify-center border ${h.as_memento ? "border-gold text-gold bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]" : "border-borderC text-textMuted"}`}
          >
            <Sparkles size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm("Remove this highlight? The journal entry stays as it is.")) deleteHighlight(h.id); }}
            aria-label="Remove highlight"
            className="w-10 h-10 flex-none rounded-full flex items-center justify-center text-textMuted hover:text-red-500"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button type="button" onClick={() => setTag(null)} aria-pressed={!tag}
            className={`text-caption px-3 py-1.5 rounded-full border ${!tag ? "bg-forestAccent text-surface2 border-forestAccent" : "border-borderC text-textSecondary"}`}>
            All
          </button>
          {allTags.map(t => (
            <button type="button" key={t} onClick={() => setTag(tag === t ? null : t)} aria-pressed={tag === t}
              className={`text-caption px-3 py-1.5 rounded-full border ${tag === t ? "bg-forestAccent text-surface2 border-forestAccent" : "border-borderC text-textSecondary"}`}>
              #{t}
            </button>
          ))}
        </div>
      )}

      {byItem.map(({ item, list }) => (
        <section key={item.id} className="mb-5">
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-label uppercase text-gold">
              <Star size={12} strokeWidth={1.75} />
              {item.type === "dream" ? "For your dream" : `For your ${item.type}`}
            </div>
            <div className="font-serif text-h3 text-textPrimary mt-0.5">{item.name}</div>
          </div>
          {list.map(card)}
        </section>
      ))}

      {loose.length > 0 && (
        <section>
          {byItem.length > 0 && <div className="text-label uppercase text-textMuted mb-2">Everything else</div>}
          {loose.map(card)}
        </section>
      )}

      {shown.length === 0 && <div className="text-bodySm text-textMuted">No highlights with #{tag} yet.</div>}
    </div>
  );
}
