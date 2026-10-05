import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getMemento, creditOf } from "../../constants/mementos";
import { useAppData } from "../../lib/AppDataContext";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// A memento attached to a flower: sealed until the Seeker opens it, then
// the line, credited to its author and work.
export default function Memento({ memento, startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const { highlights } = useAppData();
  // A memento is either from the library, or one of the Seeker's own
  // journal highlights coming back to them.
  let m, author, source;
  if (memento.highlightId) {
    const h = highlights.find(x => x.id === memento.highlightId);
    if (!h) return null;
    m = { text: h.text };
    author = "From your journal";
    source = h.entry_date ? new Date(h.entry_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
  } else {
    m = getMemento(memento.id);
    if (!m) return null;
    ({ author, source } = creditOf(m));
  }
  return (
    <div className="rounded-card border border-[#C9A24D]/40 px-4 py-3 text-left" style={{ background: "rgba(201,162,77,0.06)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-caption uppercase tracking-[0.08em] text-[#C9A24D]">
          A memento for your {ordinal(memento.hour)} hour of focus
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="min-h-[44px] px-3 -mr-2 text-bodySm text-[#EDE6D6] underline underline-offset-4 flex-none">
            Open it
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.figure
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.6 }}
            className="m-0 overflow-hidden"
          >
            <blockquote className="m-0 mt-2 font-serif italic text-[19px] leading-snug text-[#F7F5EF]">“{m.text}”</blockquote>
            <figcaption className="text-caption text-[#B8B5D6] mt-1.5 mb-1">
              {author}{source && <>, <span className="italic">{source}</span></>}
            </figcaption>
          </motion.figure>
        )}
      </AnimatePresence>
    </div>
  );
}
