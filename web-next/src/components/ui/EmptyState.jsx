import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import { Button } from "./Button";
import { riseIn } from "./motion";
import { GlowBubble } from "./GlowBubble";

export function EmptyState({ icon: Icon = Sprout, title, description, actionLabel, onAction }) {
  return (
    <motion.div {...riseIn} className="flex flex-col items-center text-center py-10 px-6">
      <GlowBubble icon={Icon} size={56} className="mb-4" />
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
