import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { easeOut } from "./ui/motion";

export function Placeholder({ label, children, tall, className = "" }) {
  return (
    <div
      className={`border border-dashed border-borderC rounded-card bg-surface1 p-4 mb-4 shadow-card ${tall ? "min-h-[110px]" : ""} ${className}`}
    >
      <div className="text-label uppercase text-gold mb-1.5">{label}</div>
      <div className="text-bodySm text-textMuted">{children}</div>
    </div>
  );
}

export function Pill({ children, muted }) {
  return (
    <span
      className={`inline-block text-label px-2.5 py-1 rounded-full mb-2 ${
        muted ? "bg-surface3 text-textMuted" : "bg-forestAccent text-surface2"
      }`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }) {
  return <div className="font-serif text-h2 font-medium mt-5 mb-2.5 first:mt-0">{children}</div>;
}

// A whole section collapsed behind one tappable header, instead of a
// SectionTitle followed by an always-expanded panel — used where a screen
// has several sizeable panels (e.g. You's Pillars + Values) and showing
// every row of every one at once made the page read as one long wall.
export function DropdownSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-5 first:mt-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-1 mb-2">
        <span className="font-serif text-h2 font-medium">{title}</span>
        <ChevronDown
          size={19}
          strokeWidth={1.75}
          className={`text-textMuted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BackRow() {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-2 mb-2 cursor-pointer text-textSecondary text-bodySm"
      onClick={() => navigate(-1)}
    >
      &larr; back
    </div>
  );
}

export function ParkedScreen({ title, note, children }) {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>{title}</SectionTitle>
      <Pill muted>{note}</Pill>
      {children}
    </div>
  );
}

export function ExploreLink({ to, label, sub }) {
  return (
    <Link to={to} className="block">
      <div className="border border-dashed border-borderC rounded-card bg-surface1 p-4 mb-3 shadow-card cursor-pointer hover:border-borderC/60">
        <div className="text-label uppercase text-gold mb-1.5">{label}</div>
        <div className="text-bodySm text-textMuted">{sub}</div>
      </div>
    </Link>
  );
}
