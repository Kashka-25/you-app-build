import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export function Skeleton({ className = "" }) {
  return (
    <motion.div
      className={`bg-surface3 rounded-sm ${className}`}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function LoadingScreen({ label = "Gathering your story" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.96, 1, 0.96] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-11 h-11 rounded-full bg-surface1 flex items-center justify-center"
      >
        <Leaf size={20} strokeWidth={1.75} className="text-sage" />
      </motion.div>
      <div className="text-bodySm text-textSecondary">{label}</div>
    </div>
  );
}
