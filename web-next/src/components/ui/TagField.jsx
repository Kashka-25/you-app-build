import { useState } from "react";
import { X } from "lucide-react";

// Tags as chips, with a box to type more (Enter, comma or space adds one;
// a half-typed tag counts when the box loses focus) and up to six of the
// Seeker's own earlier tags to tap. `#` is optional. Used by the quick add.
export function TagField({ tags, onChange, suggestions = [], className = "" }) {
  const [input, setInput] = useState("");

  function commit(raw = input) {
    const typed = raw.split(/[,\s]+/).map(t => t.replace(/^#/, "").trim()).filter(Boolean);
    if (typed.length) onChange([...new Set([...tags, ...typed])]);
    setInput("");
  }

  const offered = suggestions.filter(s => !tags.some(t => t.toLowerCase() === s.toLowerCase())).slice(0, 6);

  return (
    <div className={className}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {tags.map(t => (
            <span key={t} className="text-caption bg-surface3 text-textSecondary pl-2 pr-1 py-1 rounded-full inline-flex items-center gap-1">
              #{t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} aria-label={`Remove tag ${t}`} className="p-0.5">
                <X size={11} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={e => (/[,\s]$/.test(e.target.value) ? commit(e.target.value) : setInput(e.target.value))}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        onBlur={() => commit()}
        enterKeyHint="done"
        aria-label="Tags"
        placeholder="Add tags, e.g. dream or idea"
        className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-2.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent shadow-field"
      />
      {offered.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Your tags">
          {offered.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onChange([...tags, s])}
              className="text-caption text-textMuted border border-dashed border-borderC px-2 py-1 rounded-full hover:text-textPrimary"
            >
              + #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
