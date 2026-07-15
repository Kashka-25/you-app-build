import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, MessageCircle, Flame, Eye, Shield, Target, Heart,
  Telescope, Moon, ShieldCheck, Paintbrush, Feather, Gem
} from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getTier } from "../../constants/app.const";
import { ALL_VALUES_LIB } from "../../constants/values.const";
import { easeOut } from "../ui/motion";

const SEGMENTS = 10;

const VALUE_ICONS = {
  Communication: MessageCircle,
  Courage: Flame,
  Presence: Eye,
  Boundaries: Shield,
  Discipline: Target,
  Empathy: Heart,
  Curiosity: Telescope,
  Rest: Moon,
  Integrity: ShieldCheck,
  Creativity: Paintbrush,
  Vulnerability: Feather,
  Gratitude: Gem
};

export default function ValuesPanel() {
  const { values, addValue, completeChallenge } = useAppData();
  const [openName, setOpenName] = useState(null);
  const [adding, setAdding] = useState(false);
  const [diff, setDiff] = useState("all");

  const available = ALL_VALUES_LIB.filter(v => !values.some(x => x.name === v.name));

  async function handleAddValue(name) {
    await addValue(name);
    setOpenName(name);
    setAdding(false);
  }

  if (values.length === 0) {
    return (
      <div>
        <div className="text-bodySm text-textMuted mb-3">No values selected yet.</div>
        <AddValueButton adding={adding} setAdding={setAdding} available={available} onPick={handleAddValue} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2.5 mb-4">
        {values.map(v => {
          const tier = getTier(v.rating);
          const filled = Math.round((v.rating / 99) * SEGMENTS);
          const Icon = VALUE_ICONS[v.name];
          const open = openName === v.name;
          const lib = ALL_VALUES_LIB.find(l => l.name === v.name);

          return (
            <div key={v.name} className="rounded-card bg-surface1 shadow-card p-3.5">
              <button onClick={() => setOpenName(open ? null : v.name)} className="w-full flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-none"
                  style={{ background: `${tier.color}26`, color: tier.color }}
                >
                  {Icon && <Icon size={17} strokeWidth={1.75} />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between text-body mb-1">
                    <span className="font-medium text-textPrimary">{v.name}</span>
                    <span className="text-bodySm" style={{ color: tier.color }}>{tier.name} · {v.rating}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: SEGMENTS }).map((_, si) => (
                      <div key={si} className="flex-1 h-2 rounded-sm" style={{ background: si < filled ? tier.color : "var(--surface-3)" }} />
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
                {open && lib && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: easeOut }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <div className="text-bodySm text-textMuted mb-2">{lib.tagline}</div>
                      <div className="flex gap-1.5 mb-3">
                        {["all", "gentle", "bold", "brave"].map(d => (
                          <button
                            key={d}
                            onClick={() => setDiff(d)}
                            className={`text-caption px-2.5 py-1 rounded-full ${diff === d ? "bg-forestAccent text-surface2" : "bg-surface3 text-textMuted"}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {lib.challenges
                          .map((c, idx) => ({ ...c, idx }))
                          .filter(c => diff === "all" || c.diff === diff)
                          .map(c => {
                            const done = (v.completed || []).includes(c.idx);
                            return (
                              <div key={c.idx} className={`flex items-center gap-2.5 p-2.5 rounded-sm bg-surface2 ${done ? "opacity-50" : ""}`}>
                                <button
                                  onClick={() => !done && completeChallenge(v.name, c.idx)}
                                  disabled={done}
                                  className={`w-6 h-6 flex-none rounded-full border text-caption ${done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                                >
                                  {done ? "✓" : ""}
                                </button>
                                <div className="flex-1 text-bodySm">{c.text}</div>
                                <div className="text-caption text-gold flex-none">+{c.pts}</div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AddValueButton adding={adding} setAdding={setAdding} available={available} onPick={handleAddValue} />
    </div>
  );
}

function AddValueButton({ adding, setAdding, available, onPick }) {
  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} className="text-bodySm border border-borderC rounded-sm px-3 py-2 w-full text-textSecondary">
        + Add a value
      </button>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {available.map(v => (
        <button key={v.name} onClick={() => onPick(v.name)} className="text-bodySm border border-borderC rounded-sm px-3 py-2 text-left">
          {v.name}
        </button>
      ))}
    </div>
  );
}
