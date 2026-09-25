import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, MessageCircle, Flame, Eye, Shield, Target, Heart,
  Telescope, Moon, ShieldCheck, Paintbrush, Feather, Gem, Sparkles, Users,
  Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun
} from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getTier, VALUE_COLORS, TIERS, prestigeRequirement, getPrestigeStage } from "../../constants/app.const";

// One icon per authored PRESTIGE_LEVELS stage, same order -- a small growth
// arc (point -> shoot -> tree -> blossom x2 -> tended green -> single spark
// -> full sun) that reads distinctly from the VALUE_ICONS glyphs below.
const PRESTIGE_ICONS = [Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun];
import { ALL_VALUES_LIB } from "../../constants/values.const";
import { easeOut } from "../ui/motion";
import { GlowBubble } from "../ui/GlowBubble";

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
  Gratitude: Gem,
  Family: Users
};

export default function ValuesPanel() {
  const { values, addValue, completeChallenge, valueChallenges, completeValueChallenge, generateValueChallenges } = useAppData();
  const [openName, setOpenName] = useState(null);
  const [adding, setAdding] = useState(false);
  const [diff, setDiff] = useState("all");
  const [generating, setGenerating] = useState(null); // value name currently generating, or null
  const [genError, setGenError] = useState("");

  const available = ALL_VALUES_LIB.filter(v => !values.some(x => x.name === v.name));

  async function handleAddValue(name) {
    await addValue(name);
    setOpenName(name);
    setAdding(false);
  }

  async function handleGenerate(name) {
    setGenerating(name);
    setGenError("");
    try {
      await generateValueChallenges(name);
    } catch (e) {
      console.error("[ValuesPanel] generate failed:", e);
      setGenError("Couldn't generate new challenges — check the Edge Function is deployed and try again.");
    }
    setGenerating(null);
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
          const prestige = v.prestige || 0;
          const requirement = prestigeRequirement(prestige);
          const pct = Math.min(100, Math.round((v.rating / requirement) * 100));
          // Tier reads off progress *through the current cycle*, not the raw
          // rating number, so a value that's just prestiged (rating reset to
          // 0 on a bigger requirement) shows as "Awakening" again rather than
          // whatever tier its old high rating used to map to.
          const tier = getTier(Math.min(99, Math.round((v.rating / requirement) * 99)));
          const stage = getPrestigeStage(prestige);
          const StageIcon = PRESTIGE_ICONS[stage.index];
          const stageColor = TIERS[prestige % TIERS.length].color;
          const color = VALUE_COLORS[v.name];
          const Icon = VALUE_ICONS[v.name];
          const open = openName === v.name;
          const lib = ALL_VALUES_LIB.find(l => l.name === v.name);

          return (
            <div key={v.name} className="rounded-card bg-surface1 shadow-card p-3.5 border-l-2" style={{ borderLeftColor: color }}>
              <button onClick={() => setOpenName(open ? null : v.name)} className="w-full flex items-center gap-3">
                {Icon && <GlowBubble icon={Icon} size={40} color={color} />}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-h3 text-textPrimary flex-1 min-w-0 truncate">{v.name}</span>
                    {/* A solid chip (bold, its own background) rather than plain
                        colored text -- next to the tier caption below, plain text
                        of the same weight was easy to read as one blurred phrase
                        instead of two separate signals. */}
                    <span
                      className="flex items-center gap-1 text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-none"
                      style={{ color: stageColor, background: `color-mix(in srgb, ${stageColor} 18%, transparent)` }}
                      title={stage.desc}
                    >
                      {StageIcon && <StageIcon size={11} strokeWidth={2} />}
                      {stage.name}
                    </span>
                  </div>
                  {/* A smooth gradient fill (vs. Pillars' segmented bar) — values are
                      personal and continuous, pillars are a game-like stat track. */}
                  <div className="h-2 rounded-full bg-surface3 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, white), ${color})`
                      }}
                    />
                  </div>
                  <div className="text-caption text-textMuted mt-1">
                    <span style={{ color: tier.color }}>{tier.name}</span> · {v.rating}/{requirement}
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
                          .map((c, idx) => ({ ...c, idx, done: (v.completed || []).includes(idx) }))
                          .filter(c => diff === "all" || c.diff === diff)
                          .map(c => (
                            <div key={`lib-${c.idx}`} className={`flex items-center gap-2.5 p-2.5 rounded-sm bg-surface2 ${c.done ? "opacity-50" : ""}`}>
                              <button
                                onClick={() => !c.done && completeChallenge(v.name, c.idx)}
                                disabled={c.done}
                                className={`w-6 h-6 flex-none rounded-full border text-caption ${c.done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                              >
                                {c.done ? "✓" : ""}
                              </button>
                              <div className="flex-1 text-bodySm">{c.text}</div>
                              <div className="text-caption text-gold flex-none">+{c.pts}</div>
                            </div>
                          ))}

                        {valueChallenges
                          .filter(c => c.value_name === v.name)
                          .filter(c => diff === "all" || c.diff === diff)
                          .map(c => (
                            <div key={c.id} className={`flex items-center gap-2.5 p-2.5 rounded-sm bg-surface2 border border-dashed border-gold/40 ${c.completed ? "opacity-50" : ""}`}>
                              <button
                                onClick={() => !c.completed && completeValueChallenge(c.id)}
                                disabled={c.completed}
                                className={`w-6 h-6 flex-none rounded-full border text-caption ${c.completed ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                              >
                                {c.completed ? "✓" : ""}
                              </button>
                              <div className="flex-1 text-bodySm">
                                {c.text}
                                <span className="text-caption text-gold ml-1.5 align-middle">✨ AI</span>
                              </div>
                              <div className="text-caption text-gold flex-none">+{c.pts}</div>
                            </div>
                          ))}
                      </div>

                      <button
                        onClick={() => handleGenerate(v.name)}
                        disabled={generating === v.name}
                        className="w-full flex items-center justify-center gap-1.5 text-bodySm text-textSecondary border border-borderC rounded-sm px-3 py-2 mt-3"
                      >
                        <Sparkles size={14} strokeWidth={1.75} />
                        {generating === v.name ? "Writing new challenges…" : "Generate more challenges"}
                      </button>
                      {genError && generating === null && (
                        <div className="text-caption text-red-500 mt-1.5">{genError}</div>
                      )}
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
