import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

// Instructions fold away (Cassidy, Oct 19: "too much writing everywhere").
// A small "How it works" line opens the explanation; screens lead with their
// content instead of a paragraph. `tone="night"` for the dark Cosmos screens.
export function Guide({ label = "How it works", tone = "day", className = "", children }) {
  const [open, setOpen] = useState(false);
  const night = tone === "night";
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 text-caption min-h-[32px] ${night ? "text-[#B8B5D6]" : "text-textMuted hover:text-textSecondary"}`}
      >
        <Info size={13} strokeWidth={1.75} />
        {label}
        <ChevronDown size={13} strokeWidth={1.75} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`text-bodySm mt-1 max-w-[46ch] ${night ? "text-[#B8B5D6]" : "text-textSecondary"}`}>{children}</div>
      )}
    </div>
  );
}
