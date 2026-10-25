import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

// The tags, folded away under one line, with a search inside (Cassidy,
// Oct 24: "make the tabs collapsible and searchable"). `tags` is
// [[name, count]] or [name]; `value` is the tag showing, or null for all.
export default function TagFilter({ tags, value, onChange, label = "Tags" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  if (tags.length === 0) return null;

  const list = tags.map(t => (Array.isArray(t) ? t : [t, null]));
  const q = query.trim().replace(/^#/, "").toLowerCase();
  const shown = q ? list.filter(([t]) => t.toLowerCase().includes(q)) : list;

  return (
    <div className="mb-3 rounded-card border border-borderC bg-surface1">
      <div className="flex items-center gap-2 px-3 min-h-[44px]">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-1.5 text-left text-bodySm text-textSecondary min-h-[44px]"
        >
          <ChevronDown size={15} strokeWidth={1.75} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          {label} <span className="text-textMuted">· {list.length}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-caption px-2.5 py-1 rounded-full bg-forestAccent text-onAccent"
            aria-label={`Showing #${value} only. Tap to show everything`}
          >
            #{value} <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {open && (
        <div className="px-3 pb-3">
          <label className="flex items-center gap-2 mb-2.5 bg-surface2 border border-borderC rounded-sm px-2.5">
            <Search size={14} strokeWidth={1.75} className="text-textMuted flex-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find a tag"
              aria-label="Find a tag"
              className="flex-1 min-w-0 bg-transparent py-2 text-bodySm text-textPrimary outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
            {shown.map(([t, n]) => {
              const on = t === value;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { onChange(on ? null : t); setOpen(false); setQuery(""); }}
                  aria-pressed={on}
                  className={`text-caption px-2.5 py-1 rounded-full border ${on ? "border-forestAccent bg-forestAccent text-onAccent" : "border-borderC text-textSecondary hover:text-textPrimary"}`}
                >
                  #{t}{n != null && ` · ${n}`}
                </button>
              );
            })}
            {shown.length === 0 && <span className="text-caption text-textMuted">No tag matches “{query}”.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
