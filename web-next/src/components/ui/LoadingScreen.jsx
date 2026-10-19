import { motion } from "framer-motion";

export function Skeleton({ className = "" }) {
  return (
    <motion.div
      className={`bg-surface3 rounded-sm ${className}`}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// The branded splash: the full YOU logo (with "Your Own Universe"), the one
// Cassidy chose for opening (Oct 19), + a warm invitation line + a gently
// pulsing status label. index.html paints the same logo before the app's
// code arrives, so opening YOU shows one splash, not two pages.
// Deliberately left un-wrapped (no full-viewport container) so it drops into
// either a full-screen boot splash (App.jsx) or a contained preview card
// (Styleguide) without fighting either one's own layout.
export function LoadingScreen({ label = "Gathering your story" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-5 text-center">
      <img
        src="/logo-full.png"
        alt="YOU — Your Own Universe"
        width="720"
        height="621"
        className="w-full max-w-[240px] h-auto"
      />
      {/* Already on screen from index.html's splash, so no fade-in here. */}
      <div className="font-serif text-body italic text-textSecondary max-w-[240px]">
        Come back to yourself, whenever you're ready.
      </div>
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
