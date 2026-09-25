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

// The branded splash — full wordmark (with "Your Own Universe") + a warm
// invitation line + a gently pulsing status label underneath. Deliberately
// left un-wrapped (no full-viewport container) so it drops into either a
// full-screen boot splash (App.jsx) or a contained preview card
// (Styleguide) without fighting either one's own layout.
export function LoadingScreen({ label = "Gathering your story" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
      <motion.img
        src="/logo-full.png"
        alt="YOU — Your Own Universe"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOut }}
        className="w-full max-w-[240px]"
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
