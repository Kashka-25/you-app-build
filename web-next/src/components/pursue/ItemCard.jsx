import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { DAY_LABELS } from "../../constants/app.const";

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
    <div className={`border border-borderC rounded-card bg-surface1 p-3.5 mb-3 ${item.done ? "opacity-60" : ""}`}>
      <div className="flex gap-3">
        <button
          onClick={handleComplete}
          disabled={item.done}
          className={`w-7 h-7 flex-none rounded-full border flex items-center justify-center transition-colors duration-300 ${item.done ? "bg-sage border-sage text-surface2" : "border-borderC text-textMuted"}`}
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
          <div className="text-[14px] font-medium">{item.name}</div>
          <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] text-textSecondary">
            <span className="px-2 py-0.5 rounded-full bg-surface3">{item.type}</span>
            <span className="px-2 py-0.5 rounded-full bg-surface3">{item.cat}</span>
            {(item.tags || []).map(t => <span key={t}>#{t}</span>)}
            {item.type === "habit" && item.streak > 0 && <span>🔥 {item.streak}d</span>}
          </div>

          {item.type === "habit" && !item.done && (
            <div className="flex gap-1.5 mt-2.5">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center">
                  <div
                    onClick={() => toggleDay(item.id, i)}
                    className={`w-5 h-5 rounded-full cursor-pointer border ${item.days[i] ? "bg-gold border-gold" : "border-borderC"}`}
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
              <div className="text-[10px] text-textMuted mt-1">{msDone}/{msTotal} milestones</div>
            </div>
          )}

          {(item.intention || item.note || msTotal > 0) && (
            <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-textSecondary mt-2 underline">
              {expanded ? "collapse" : "expand"}
            </button>
          )}
          {expanded && (
            <div className="mt-2 text-[12px] text-textSecondary space-y-1.5">
              {item.intention && <div className="italic">{item.intention}</div>}
              {item.note && <div>{item.note}</div>}
              {(item.milestones || []).map((m, mi) => (
                <div key={mi} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMilestone(item.id, mi)}
                    className={`w-4 h-4 rounded-full border text-[9px] ${m.done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                  >
                    {m.done ? "✓" : ""}
                  </button>
                  <span className={m.done ? "line-through text-textMuted" : ""}>{m.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-[13px] text-textMuted flex-none">
          {item.done && <button onClick={() => unachieveItem(item.id)} title="Move back to active">↺</button>}
          <button onClick={() => deleteItem(item.id)} title="Delete">×</button>
        </div>
      </div>

      {reflecting && (
        <div className="mt-3 pt-3 border-t border-borderC">
          <textarea
            className="w-full bg-surface2 border border-borderC rounded-lg px-3 py-2 text-[13px] mb-2"
            rows={2}
            placeholder="What has this given you? (optional)"
            value={reflection}
            onChange={e => setReflection(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => confirmComplete(true)} className="flex-1 border border-borderC rounded-lg py-2 text-[13px]">Skip</button>
            <button onClick={() => confirmComplete(false)} className="flex-1 bg-forestAccent text-surface2 rounded-lg py-2 text-[13px]">Complete</button>
          </div>
        </div>
      )}
    </div>
  );
}
