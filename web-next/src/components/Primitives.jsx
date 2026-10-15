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
        muted ? "bg-surface3 text-textMuted" : "bg-forestAccent text-onAccent"
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
// `level` lets a section nest inside another (e.g. Pursue's Pillar ->
// sub-category -> sub-sub-category) — each level down shrinks the heading
// and adds a left rail so the hierarchy stays legible instead of every
// level looking like the same size heading repeated.
const LEVEL_HEADING = ["font-serif text-h2 font-medium", "font-serif text-h3 font-medium", "text-body font-semibold text-textSecondary"];

export function DropdownSection({ title, defaultOpen = false, level = 0, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const headingClass = LEVEL_HEADING[Math.min(level, LEVEL_HEADING.length - 1)];
  return (
    <div className={`mt-5 first:mt-0 ${level > 0 ? "pl-3.5 border-l border-borderC" : ""}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-1 mb-2">
        <span className={headingClass}>{title}</span>
        <ChevronDown
          size={level > 0 ? 16 : 19}
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

// A section's own card from the YOU art set across the top of its page,
// with the title in dark ink on a parchment fade (cream on a shade in the
// Cosmos). The art carries no words of its own; the title is real text.
export function PageBanner({ title, image, className = "" }) {
  return (
    <div className={`relative h-[150px] rounded-card overflow-hidden shadow-card mb-4 ${className}`}>
      <img src={image} alt="" width="705" height="380" decoding="async" className="absolute inset-0 w-full h-full object-cover object-[center_35%] dark:brightness-[0.65]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/40 via-40% to-transparent dark:from-black/75 dark:via-black/20" />
      <h1 className="absolute left-4 bottom-2.5 m-0 font-serif text-hero text-textPrimary dark:text-cream">{title}</h1>
    </div>
  );
}

export function ParkedScreen({ title, note, image, children }) {
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      {image ? <PageBanner title={title} image={image} className="mt-3" /> : <SectionTitle>{title}</SectionTitle>}
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
