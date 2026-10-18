import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { easeOut } from "./motion";
import { AiLabel } from "./Premium";

// A settings section folded into one tidy row: icon, title and a short
// line of what's inside; tap to open, tap again to close. `ai` wears the
// black-and-gold YOU Premium look.
export function Fold({ icon: Icon, image, title, hint, ai = false, defaultOpen = false, className = "", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`${ai ? "ai-card" : "bg-surface1 shadow-card"} rounded-card mt-3 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {ai ? (
          <span className="flex-1 min-w-0">
            <AiLabel>{title}</AiLabel>
            {hint && <span className="block text-caption text-[var(--ai-text-2)] mt-0.5 truncate">{hint}</span>}
          </span>
        ) : (
          <>
            {/* An emblem from the YOU art set, or a line icon on a gold dot. */}
            {image && <img src={image} alt="" width="40" height="40" className="w-10 h-10 flex-none" />}
            {!image && Icon && (
              <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] text-gold flex items-center justify-center flex-none" aria-hidden="true">
                <Icon size={17} strokeWidth={1.75} />
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block text-body text-textPrimary">{title}</span>
              {hint && <span className="block text-caption text-textMuted truncate">{hint}</span>}
            </span>
          </>
        )}
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          className={`flex-none transition-transform duration-200 ${open ? "rotate-180" : ""} ${ai ? "text-[var(--ai-text-2)]" : "text-textMuted"}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
