import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import { Button } from "./Button";
import { riseIn } from "./motion";

export function EmptyState({ icon: Icon = Sprout, title, description, actionLabel, onAction }) {
  return (
    <motion.div {...riseIn} className="flex flex-col items-center text-center py-10 px-6">
      <div className="w-14 h-14 rounded-full bg-surface1 flex items-center justify-center mb-4">
        <Icon size={24} strokeWidth={1.75} className="text-sage" />
      </div>
      <div className="font-serif text-h3 text-textPrimary mb-1.5">{title}</div>
      {description && <div className="text-bodySm text-textSecondary max-w-[260px]">{description}</div>}
      {actionLabel && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
