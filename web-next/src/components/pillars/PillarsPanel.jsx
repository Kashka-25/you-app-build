import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Dumbbell, Brain, Sparkles, HeartHandshake, Briefcase, Compass, Palette, Award } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getPillarLevel, TIERS } from "../../constants/app.const";
import { easeOut } from "../ui/motion";

const SEGMENTS = 10;

const PILLAR_ICONS = {
  Body: Dumbbell,
  Mind: Brain,
  Spirit: Sparkles,
  Relationships: HeartHandshake,
  Work: Briefcase,
  Adventure: Compass,
  Creative: Palette
};

export default function PillarsPanel() {
  const { pillars } = useAppData();
  const [openPillar, setOpenPillar] = useState(null);

  return (
    <div className="space-y-2.5">
      {pillars.map(p => {
        const { level, pct } = getPillarLevel(p.xp);
        const filled = Math.round((pct / 100) * SEGMENTS);
        const Icon = PILLAR_ICONS[p.name];
        const open = openPillar === p.name;
        const badgeColor = level > 0 ? TIERS[(level - 1) % TIERS.length].color : null;
        return (
          <div key={p.name} className="rounded-card bg-surface1 shadow-card p-3.5">
            <button
              onClick={() => setOpenPillar(open ? null : p.name)}
              className="w-full flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-none"
                style={{ background: `${p.color}26`, color: p.color }}
              >
                {Icon && <Icon size={17} strokeWidth={1.75} />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center text-body mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-textPrimary">
                    {p.name}
                    {level > 0 && (
                      <span className="flex items-center gap-0.5 text-caption font-normal" style={{ color: badgeColor }}>
                        <Award size={11} strokeWidth={1.75} />
                        Lv {level}
                      </span>
                    )}
                  </span>
                  <span className="text-textMuted text-bodySm">{p.xp} XP</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: SEGMENTS }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-2 rounded-sm"
                      style={{ background: i < filled ? p.color : "var(--surface-3)" }}
                    />
                  ))}
                </div>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={`text-textMuted flex-none transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-4 text-caption text-textMuted pt-2.5 pl-12">
                    <span>Active: {p.active}</span>
                    <span>Best streak: {p.bestStreak}d</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
