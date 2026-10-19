import { motion } from "framer-motion";
import { easeOut } from "./motion";

export function Skeleton({ className = "" }) {
  return (
    <motion.div
      className={`bg-surface3 rounded-sm ${className}`}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// The branded splash: the YOU app emblem (the same image Android shows as
// it opens the app, so the two read as one load, not two pages; Cassidy,
// Oct 19) + a warm invitation line + a gently pulsing status label.
// Deliberately left un-wrapped (no full-viewport container) so it drops into
// either a full-screen boot splash (App.jsx) or a contained preview card
// (Styleguide) without fighting either one's own layout.
export function LoadingScreen({ label = "Gathering your story" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
      <motion.img
        src="/images/splash-emblem.png"
        alt="YOU — Your Own Universe"
        width="144"
        height="141"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="w-36 h-auto drop-shadow-[0_8px_24px_rgba(58,38,24,0.18)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: easeOut }}
        className="font-serif text-body italic text-textSecondary max-w-[240px]"
      >
        Come back to yourself, whenever you're ready.
      </motion.div>
      {label && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-caption uppercase tracking-wide text-textMuted"
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}
