import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, MessageSquareHeart, Palette, X } from "lucide-react";
import { useEscape } from "./ui/useEscape";
import { useAppData } from "../lib/AppDataContext";
import { fadeIn, easeOut } from "./ui/motion";

// Journey-before-CommYOUnity is deliberate: the app is about the individual
// first, community second. Don't reorder.
// Each place has its emblem from the YOU art set (public/images/icons).
const SITEMAP = [
  { to: "/", label: "Home", end: true, icon: "home" },
  { to: "/journey", label: "YOUrney", icon: "yourney" },
  { to: "/reflections", label: "Reflections", icon: "reflections" },
  { to: "/youniversity", label: "YOUniversity", icon: "youniversity" },
  { to: "/community", label: "CommYOUnity", icon: "community" },
  { to: "/you", label: "YOU", icon: "you" }
];

// Pages that exist but aren't built yet, folded away so the menu stays
// clean. Move one up into SITEMAP when it's real.
const COMING_SOON = [
  { to: "/therapists", label: "Therapists" },
  { to: "/events", label: "Events / Calendar" },
  { to: "/shop", label: "Shop" },
  { to: "/challenges", label: "Challenges" },
  { to: "/saved", label: "Saved" },
  { to: "/review", label: "Review" }
];

const linkClass = ({ isActive }) =>
  `block px-5 py-2.5 text-body border-l-[3px] ${
    isActive ? "border-gold text-forest dark:text-cream font-medium bg-surface1" : "border-transparent text-textPrimary"
  }`;

// Everything the menu lists: the drawer on phones and the fixed sidebar on
// laptops both show this, so they can never drift apart.
export function MenuContents({ onNavigate, mode, onToggleMode, onFeedback, open = true }) {
  const location = useLocation();
  const { isAdmin, codexNew } = useAppData();
  const onComingSoonPage = COMING_SOON.some(i => location.pathname.startsWith(i.to));
  const [soonOpen, setSoonOpen] = useState(onComingSoonPage);
  // Opening the menu while on one of those pages shows where you are.
  useEffect(() => { if (open && onComingSoonPage) setSoonOpen(true); }, [open, onComingSoonPage]);

  return (
    <>
      <nav aria-label="Main" className="flex-1 overflow-y-auto">
        {SITEMAP.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `${linkClass({ isActive })} flex items-center gap-3 !py-1.5`}>
            <img src={`/images/icons/${item.icon}.png`} alt="" width="30" height="30" className="w-[30px] h-[30px] flex-none" />
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/showcase" onClick={onNavigate} className={({ isActive }) => `${linkClass({ isActive })} flex items-center gap-3 !py-1.5`}>
          <span className="w-[30px] h-[30px] flex-none flex items-center justify-center" aria-hidden="true">
            <Palette size={18} strokeWidth={1.5} className="text-gold" />
          </span>
          Showcase
        </NavLink>

        <button
          type="button"
          onClick={() => setSoonOpen(!soonOpen)}
          aria-expanded={soonOpen}
          className="w-full flex items-center gap-1.5 px-5 pt-4 pb-2 text-label uppercase text-textMuted"
        >
          {soonOpen ? <ChevronDown size={13} strokeWidth={1.75} /> : <ChevronRight size={13} strokeWidth={1.75} />}
          Coming soon
          <span className="normal-case tracking-normal">· {COMING_SOON.length}</span>
        </button>
        {soonOpen && COMING_SOON.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `${linkClass({ isActive })} text-bodySm ${isActive ? "" : "!text-textSecondary"}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {isAdmin && (
        <div className="border-t border-borderC pt-2 pb-1">
          <div className="px-5 pb-1 text-label uppercase text-textMuted">For you as creator</div>
          <NavLink to="/codex-requests" onClick={onNavigate} className={linkClass}>
            <span className="flex items-center justify-between gap-2">
              Codex requests
              {codexNew > 0 && (
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-gold text-[#19193D] text-caption font-semibold flex items-center justify-center" aria-label={`${codexNew} new`}>
                  {codexNew}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/showcase-review" onClick={onNavigate} className={linkClass}>
            Showcase review
          </NavLink>
          <NavLink to="/build-notes" onClick={onNavigate} className={linkClass}>
            Build notes
          </NavLink>
        </div>
      )}

      <div className="border-t border-borderC pt-3">
        <NavLink to="/settings" onClick={onNavigate} className={({ isActive }) => `${linkClass({ isActive })} mb-1`}>
          Your Own Universe
        </NavLink>
        {onFeedback && (
          <button
            type="button"
            onClick={() => { onNavigate?.(); onFeedback(); }}
            className="w-full flex items-center gap-2 px-5 py-2.5 mb-2 text-body text-textPrimary border-l-[3px] border-transparent"
          >
            <MessageSquareHeart size={17} strokeWidth={1.75} className="text-gold" />
            Send feedback
          </button>
        )}
        <div className="px-5">
          <button
            onClick={onToggleMode}
            className="text-caption text-textSecondary border border-borderC rounded-full px-3 py-1.5"
          >
            {mode === "light" ? "Switch to Cosmos (dark)" : "Switch to Nature (light)"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function SidebarMenu({ open, onClose, mode, onToggleMode, onFeedback }) {
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div {...fadeIn} className="fixed inset-0 bg-black/80 backdrop-blur-md z-40" onClick={onClose}>
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: easeOut }}
            onClick={e => e.stopPropagation()}
            className="absolute top-0 left-0 h-full w-[240px] bg-surface2 border-r border-borderC py-3.5 flex flex-col"
          >
            <div className="flex justify-end px-3 pb-1">
              <button onClick={onClose} aria-label="Close menu" className="flex items-center gap-1 text-caption text-textMuted hover:text-textPrimary px-2 py-1">
                <X size={16} strokeWidth={1.75} /> Close
              </button>
            </div>
            <MenuContents onNavigate={onClose} mode={mode} onToggleMode={onToggleMode} onFeedback={onFeedback} open={open} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
