import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { fadeIn, easeOut } from "./ui/motion";

// Journey-before-CommYOUnity is deliberate: the app is about the individual
// first, community second. Don't reorder.
const SITEMAP = [
  { to: "/", label: "Home", end: true },
  { to: "/journey", label: "Journey" },
  { to: "/community", label: "CommYOUnity" },
  { to: "/therapists", label: "Therapists" },
  { to: "/events", label: "Events / Calendar" },
  { to: "/shop", label: "Shop" },
  { to: "/challenges", label: "Challenges" },
  { to: "/saved", label: "Saved" },
  { to: "/review", label: "Review" }
];

export default function SidebarMenu({ open, onClose, mode, onToggleMode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div {...fadeIn} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose}>
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: easeOut }}
            onClick={e => e.stopPropagation()}
            className="absolute top-0 left-0 h-full w-[240px] bg-surface2 border-r border-borderC py-3.5 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              {SITEMAP.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-5 py-2.5 text-body border-l-[3px] ${
                      isActive
                        ? "border-gold text-forest font-medium bg-surface1"
                        : "border-transparent text-textPrimary"
                    }`
                  }
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
                Settings & Account
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
