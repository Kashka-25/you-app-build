import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, X, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { DAY_LABELS } from "../../constants/app.const";
import { riseIn } from "../ui/motion";
import { Button } from "../ui/Button";

export default function ItemCard({ item }) {
  const { completeItem, unachieveItem, deleteItem, toggleDay, toggleMilestone, editItem } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");

  const msTotal = (item.milestones || []).length;
  const msDone = (item.milestones || []).filter(m => m.done).length;
  const msPct = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  async function handleComplete() {
    if (item.done) return;
    setReflecting(true);
  }
  async function confirmComplete(skip) {
    await completeItem(item.id, skip ? "" : reflection);
    setReflecting(false);
    setReflection("");
  }

  return (
    <motion.div {...riseIn} className={`rounded-card bg-surface1 shadow-card p-3.5 mb-3 ${item.done ? "opacity-60" : ""}`}>
      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          disabled={item.done}
          className={`w-7 h-7 flex-none rounded-full border flex items-center justify-center transition-colors duration-300 ${
            item.done ? "bg-sage border-sage text-surface2" : "border-borderC text-textMuted"
          }`}
        >
          <AnimatePresence>
            {item.done && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check size={14} strokeWidth={2.5} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-body font-medium text-textPrimary">{item.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-caption text-textSecondary">
            <span className="px-2 py-0.5 rounded-full bg-surface3 capitalize">{item.type}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface3">{item.cat}</span>
            {(item.tags || []).map(t => <span key={t}>#{t}</span>)}
            {item.type === "habit" && item.streak > 0 && (
              <span className="flex items-center gap-0.5 text-ember">
                <Flame size={12} strokeWidth={1.75} />
                {item.streak}d
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
                  <span className={m.done ? "line-through text-textMuted" : ""}>{m.text}</span>
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
          <button onClick={() => deleteItem(item.id)} aria-label="Delete">
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {reflecting && (
        <div className="mt-3 pt-3 border-t border-borderC">
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
