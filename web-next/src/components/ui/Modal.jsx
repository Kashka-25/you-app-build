import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { fadeIn, sheetIn } from "./motion";

export function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...fadeIn}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            {...sheetIn}
            onClick={e => e.stopPropagation()}
            className="w-full sm:w-[420px] max-h-[85vh] overflow-y-auto bg-surface2 rounded-t-card sm:rounded-card shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-h2">{title}</div>
              <button onClick={onClose} className="text-textMuted hover:text-textPrimary">
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
