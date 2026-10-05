import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useEscape } from "./ui/useEscape";
import { fadeIn, easeOut } from "./ui/motion";

// Journey-before-CommYOUnity is deliberate: the app is about the individual
// first, community second. Don't reorder.
const SITEMAP = [
  { to: "/", label: "Home", end: true },
  { to: "/journey", label: "YOUrney" },
  { to: "/reflections", label: "Reflections" },
  { to: "/community", label: "CommYOUnity" }
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
    isActive ? "border-gold text-forest font-medium bg-surface1" : "border-transparent text-textPrimary"
  }`;

export default function SidebarMenu({ open, onClose, mode, onToggleMode }) {
  const location = useLocation();
  const onComingSoonPage = COMING_SOON.some(i => location.pathname.startsWith(i.to));
  const [soonOpen, setSoonOpen] = useState(onComingSoonPage);
  useEscape(open, onClose);
  // Opening the menu while on one of those pages shows where you are.
  useEffect(() => { if (open && onComingSoonPage) setSoonOpen(true); }, [open, onComingSoonPage]);

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
            <div className="flex-1 overflow-y-auto">
              {SITEMAP.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}

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
                  onClick={onClose}
                  className={({ isActive }) => `${linkClass({ isActive })} text-bodySm ${isActive ? "" : "!text-textSecondary"}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="border-t border-borderC pt-3">
              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  `block px-5 py-2.5 text-body border-l-[3px] mb-2 ${
                    isActive
                      ? "border-gold text-forest font-medium bg-surface1"
                      : "border-transparent text-textPrimary"
                  }`
                }
              >
                Your Own Universe
              </NavLink>
              <div className="px-5">
                <button
                  onClick={onToggleMode}
                  className="text-caption text-textSecondary border border-borderC rounded-full px-3 py-1.5"
                >
                  {mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
