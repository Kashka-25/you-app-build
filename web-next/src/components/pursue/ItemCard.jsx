import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, X, RotateCcw, ChevronDown, ChevronUp, Award, Star, Target, Sparkles, Pencil } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { DAY_LABELS, TIERS, PILLAR_COLORS } from "../../constants/app.const";
import { riseIn } from "../ui/motion";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import AddItemModal from "./AddItemModal";

const TYPE_ICON = { dream: Star, goal: Target, habit: Flame };

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// 8 small sparks radiating outward from the checkbox and fading — the one
// moment (right when an item is confirmed complete) that gets an animated
// celebration rather than just a static "done" look, since that's the
// instant it's actually satisfying to see.
const BURST_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function CompletionBurst() {
  return (
    <motion.div className="absolute left-3.5 top-3.5 w-7 h-7 pointer-events-none" style={{ zIndex: 1 }}>
      {BURST_ANGLES.map((angle, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-gold"
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
          animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 26, scale: 0, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.02 }}
        />
      ))}
    </motion.div>
  );
}

export default function ItemCard({ item }) {
  const {
    completeItem, unachieveItem, deleteItem, toggleDay, toggleMilestone,
    getPrestigeTier, prestigeItem
  } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [completedDate, setCompletedDate] = useState(todayKey());
  const [celebrating, setCelebrating] = useState(false);
  const [editing, setEditing] = useState(false);

  const prestigeTier = item.type === "habit" ? getPrestigeTier(item) : 0;
  const tierColor = prestigeTier > 0 ? TIERS[(prestigeTier - 1) % TIERS.length].color : null;
  const cycleComplete = item.type === "habit" && item.streak === 7;

  const msTotal = (item.milestones || []).length;
  const msDone = (item.milestones || []).filter(m => m.done).length;
  const msPct = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  async function handleComplete() {
    if (item.done) return;
    setCompletedDate(todayKey());
    setReflecting(true);
  }
  async function confirmComplete(skip) {
    await completeItem(item.id, skip ? "" : reflection, completedDate);
    setReflecting(false);
    setReflection("");
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 750);
  }

  return (
    <motion.div
      {...riseIn}
      className={`rounded-card shadow-card p-3.5 mb-3 relative transition-colors duration-500 ${
        item.done
          ? "bg-gradient-to-br from-surface1 to-[color-mix(in_srgb,var(--gold)_16%,var(--surface-1))] border border-gold/40"
          : "bg-surface1"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative flex-none">
          {celebrating && <CompletionBurst />}
          {item.done ? (
            <GlowBubble icon={Check} size={28} color="var(--gold)" animate={false} />
          ) : (
            <button
              onClick={handleComplete}
              className="w-7 h-7 rounded-full border border-borderC text-textMuted flex items-center justify-center transition-colors duration-300"
            />
          )}
        </div>
        <GlowBubble
          icon={TYPE_ICON[item.type] || Flame}
          size={32}
          animate={!item.done}
          color={PILLAR_COLORS[item.cat]}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-textPrimary flex items-center gap-1.5">
            <span className={item.done ? "line-through decoration-wavy decoration-1 decoration-gold" : ""}>{item.name}</span>
            {item.done && <Sparkles size={13} strokeWidth={1.75} className="text-gold flex-none" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-caption text-textSecondary">
            <span className="px-2 py-0.5 rounded-full bg-surface3 capitalize">{item.type}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface3">{item.cat}</span>
            {item.subcat && <span className="px-2 py-0.5 rounded-full bg-surface3">{item.subcat.split("/").join(" › ")}</span>}
            {(item.tags || []).map(t => <span key={t}>#{t}</span>)}
            {item.type === "habit" && item.streak > 0 && (
              <span className="flex items-center gap-0.5 text-ember">
                <Flame size={12} strokeWidth={1.75} />
                {item.streak}d
              </span>
            )}
            {prestigeTier > 0 && (
              <span className="flex items-center gap-0.5" style={{ color: tierColor }}>
                <Award size={12} strokeWidth={1.75} />
                Prestige {prestigeTier}
              </span>
            )}
          </div>

          {item.type === "habit" && !item.done && (
            <div className="flex gap-1.5 mt-2.5">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center">
                  <button
                    onClick={() => toggleDay(item.id, i)}
                    className={`w-5 h-5 rounded-full border ${item.days[i] ? "bg-gold border-gold" : "border-borderC"}`}
                    aria-label={`Toggle ${d} check-in`}
                  />
                  <div className="text-[9px] text-textMuted mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          )}

          {cycleComplete && !item.done && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5 w-full"
              icon={Award}
              onClick={() => prestigeItem(item.id)}
            >
              Complete cycle — start fresh
            </Button>
          )}

          {msTotal > 0 && (
            <div className="mt-2.5">
              <div className="h-1.5 rounded-full bg-surface3 overflow-hidden">
                <div className="h-full bg-forestAccent" style={{ width: `${msPct}%` }} />
              </div>
              <div className="text-caption text-textMuted mt-1">{msDone}/{msTotal} milestones</div>
            </div>
          )}

          {(item.intention || item.note || msTotal > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-caption text-textSecondary mt-2"
            >
              {expanded ? "Collapse" : "Expand"}
              {expanded ? <ChevronUp size={13} strokeWidth={1.75} /> : <ChevronDown size={13} strokeWidth={1.75} />}
            </button>
          )}
          {expanded && (
            <div className="mt-2 text-bodySm text-textSecondary space-y-1.5">
              {item.intention && <div className="italic">{item.intention}</div>}
              {item.note && <div>{item.note}</div>}
              {(item.milestones || []).map((m, mi) => (
                <div key={mi} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMilestone(item.id, mi)}
                    className={`w-4 h-4 flex-none rounded-full border text-[9px] ${m.done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                  >
                    {m.done ? "✓" : ""}
                  </button>
                  <span className={m.done ? "line-through decoration-wavy decoration-gold text-textMuted" : ""}>{m.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-textMuted flex-none">
          {item.done && (
            <button onClick={() => unachieveItem(item.id)} aria-label="Move back to active">
              <RotateCcw size={15} strokeWidth={1.75} />
            </button>
          )}
          <button onClick={() => setEditing(true)} aria-label="Edit">
            <Pencil size={15} strokeWidth={1.75} />
          </button>
          <button onClick={() => deleteItem(item.id)} aria-label="Delete">
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <AddItemModal open={editing} item={item} onClose={() => setEditing(false)} />

      {reflecting && (
        <div className="mt-3 pt-3 border-t border-borderC">
          <label className="block text-caption uppercase text-textMuted mb-1">Date completed</label>
          <input
            type="date"
            className="w-full bg-surface2 border border-borderC rounded-sm px-3 py-2 text-bodySm mb-2 outline-none focus:border-forestAccent shadow-field"
            value={completedDate}
            max={todayKey()}
            onChange={e => setCompletedDate(e.target.value)}
          />
          <textarea
            className="w-full bg-surface2 border border-borderC rounded-sm px-3 py-2 text-bodySm mb-2 outline-none focus:border-forestAccent"
            rows={2}
            placeholder="What has this given you? (optional)"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => confirmComplete(true)}>Skip</Button>
            <Button variant="primary" size="sm" className="flex-1" onClick={() => confirmComplete(false)}>Complete</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
