import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, MessageCircle, Flame, Eye, Shield, Target, Heart,
  Telescope, Moon, ShieldCheck, Paintbrush, Feather, Gem, Sparkles, Users,
  Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun, Plus, PenLine, RotateCcw
} from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import {
  getTier, VALUE_COLORS, TIERS, prestigeRequirement, getPrestigeStage,
  ELEMENTS, VALUE_ELEMENT, MAX_VALUE_SLOTS
} from "../../constants/app.const";
import { ALL_VALUES_LIB } from "../../constants/values.const";
import { easeOut } from "../ui/motion";
import { GlowBubble } from "../ui/GlowBubble";
import { Button } from "../ui/Button";
import { DropdownSection } from "../Primitives";

// One icon per authored PRESTIGE_LEVELS stage, same order -- a small growth
// arc (point -> shoot -> tree -> blossom x2 -> tended green -> single spark
// -> full sun) that reads distinctly from the VALUE_ICONS glyphs below.
const PRESTIGE_ICONS = [Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun];

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

const fieldClass =
  "w-full bg-surface2 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";

// Tier reads off progress *through the current cycle*, not the raw rating,
// so a value that's just prestiged shows as "Awakening" again.
function cycleView(v) {
  const prestige = v.prestige || 0;
  const requirement = prestigeRequirement(prestige);
  const pct = Math.min(100, Math.round((v.rating / requirement) * 100));
  const tier = getTier(Math.min(99, Math.round((v.rating / requirement) * 99)));
  return { prestige, requirement, pct, tier };
}

export default function ValuesPanel() {
  const {
    values, activeValues, valueSlots, addValue, setValueStatus, saveValueDefinition,
    completeChallenge, valueChallenges, completeValueChallenge, generateValueChallenges
  } = useAppData();
  const [openName, setOpenName] = useState(null);
  const [adding, setAdding] = useState(false);
  // One brief, kind line when a value first ripens into a new tier. Never
  // confetti. Cleared as soon as the Seeker moves on to another value.
  const [moment, setMoment] = useState(null); // { name, tier, slotsBefore }

  const rested = values.filter(v => v.status === "rested");
  const hasRoom = activeValues.length < valueSlots;
  const available = ALL_VALUES_LIB.filter(v => !values.some(x => x.name === v.name));

  async function handleAddValue(name) {
    await addValue(name);
    setOpenName(name);
    setAdding(false);
  }

  async function withMoment(name, run) {
    const slotsBefore = valueSlots;
    const result = await run();
    if (result?.crossedInto) setMoment({ name, tier: result.crossedInto, slotsBefore });
  }

  function toggleOpen(name) {
    setOpenName(openName === name ? null : name);
    if (moment && moment.name !== name) setMoment(null);
  }

  return (
    <div>
      <div className="text-bodySm text-textSecondary mb-3">
        {activeValues.length} of {valueSlots} in focus
        <span className="text-textMuted"> · every value is always yours to choose</span>
      </div>

      {activeValues.length === 0 && (
        <div className="text-bodySm text-textMuted mb-3">No values in focus yet.</div>
      )}

      <div className="space-y-2.5 mb-4">
        {activeValues.map(v => (
          <ValueCard
            key={v.name}
            v={v}
            open={openName === v.name}
            onToggle={() => toggleOpen(v.name)}
            moment={moment?.name === v.name ? { ...moment, slotGrew: valueSlots > moment.slotsBefore } : null}
            valueChallenges={valueChallenges.filter(c => c.value_name === v.name)}
            onCompleteLib={idx => withMoment(v.name, () => completeChallenge(v.name, idx))}
            onCompleteAi={id => withMoment(v.name, () => completeValueChallenge(id))}
            onGenerate={() => generateValueChallenges(v.name)}
            onSaveDefinition={text => saveValueDefinition(v.name, text)}
            onRest={async () => { await setValueStatus(v.name, "rested"); setOpenName(null); }}
          />
        ))}
      </div>

      {hasRoom ? (
        <AddValuePicker
          adding={adding}
          setAdding={setAdding}
          available={available}
          activeValues={activeValues}
          onPick={handleAddValue}
        />
      ) : (
        <div className="text-bodySm text-textMuted border border-dashed border-borderC rounded-sm px-3.5 py-3">
          All {valueSlots} places for focus are in use. Rest a value to make room — it keeps everything it has grown.
          {valueSlots < MAX_VALUE_SLOTS && " More room opens as your values ripen."}
        </div>
      )}

      {rested.length > 0 && (
        <DropdownSection title={`Resting (${rested.length})`} level={1}>
          <div className="text-caption text-textMuted mb-2">
            Resting values keep their growth. Return one whenever it calls you.
          </div>
          <div className="space-y-2">
            {rested.map(v => {
              const { tier } = cycleView(v);
              return (
                <div key={v.name} className="flex items-center gap-3 rounded-sm bg-surface1 px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-body text-textPrimary">{v.name}</div>
                    <div className="text-caption" style={{ color: tier.color }}>{tier.name}</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    disabled={!hasRoom}
                    onClick={() => setValueStatus(v.name, "active")}
                  >
                    Return to focus
                  </Button>
                </div>
              );
            })}
          </div>
          {!hasRoom && (
            <div className="text-caption text-textMuted mt-2">Rest a value in focus first to make room.</div>
          )}
        </DropdownSection>
      )}
    </div>
  );
}

function ValueCard({
  v, open, onToggle, moment, valueChallenges,
  onCompleteLib, onCompleteAi, onGenerate, onSaveDefinition, onRest
}) {
  const [diff, setDiff] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const { prestige, requirement, pct, tier } = cycleView(v);
  const stage = getPrestigeStage(prestige);
  const StageIcon = PRESTIGE_ICONS[stage.index];
  const stageColor = TIERS[prestige % TIERS.length].color;
  const color = VALUE_COLORS[v.name];
  const Icon = VALUE_ICONS[v.name];
  const lib = ALL_VALUES_LIB.find(l => l.name === v.name);

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      await onGenerate();
    } catch (e) {
      console.error("[ValuesPanel] generate failed:", e);
      setGenError("Couldn't generate new challenges — check the Edge Function is deployed and try again.");
    }
    setGenerating(false);
  }

  return (
    <div className="rounded-card bg-surface1 shadow-card p-3.5 border-l-2" style={{ borderLeftColor: color }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3">
        {Icon && <GlowBubble icon={Icon} size={40} color={color} />}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif text-h3 text-textPrimary flex-1 min-w-0 truncate">{v.name}</span>
            {/* A solid chip rather than plain colored text -- next to the tier
                caption below, plain text read as one blurred phrase. */}
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
            {VALUE_ELEMENT[v.name] && <> · {VALUE_ELEMENT[v.name]}</>}
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`text-textMuted flex-none transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {moment && (
        <div className="font-serif italic text-body text-textPrimary mt-3 pl-1">
          {v.name} has ripened into {moment.tier}.
          {moment.slotGrew && " There's room for one more value in your focus, whenever you're ready."}
        </div>
      )}

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
              <Definition v={v} tagline={lib.tagline} onSave={onSaveDefinition} />

              <div className="flex gap-1.5 mb-3 mt-4">
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
                        onClick={() => !c.done && onCompleteLib(c.idx)}
                        disabled={c.done}
                        aria-label={c.done ? "Done" : "Mark done"}
                        className={`w-6 h-6 flex-none rounded-full border text-caption ${c.done ? "bg-sage border-sage text-surface2" : "border-borderC"}`}
                      >
                        {c.done ? "✓" : ""}
                      </button>
                      <div className="flex-1 text-bodySm">{c.text}</div>
                      <div className="text-caption text-gold flex-none">+{c.pts}</div>
                    </div>
                  ))}

                {valueChallenges
                  .filter(c => diff === "all" || c.diff === diff)
                  .map(c => (
                    <div key={c.id} className={`flex items-center gap-2.5 p-2.5 rounded-sm bg-surface2 border border-dashed border-gold/40 ${c.completed ? "opacity-50" : ""}`}>
                      <button
                        onClick={() => !c.completed && onCompleteAi(c.id)}
                        disabled={c.completed}
                        aria-label={c.completed ? "Done" : "Mark done"}
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
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-1.5 text-bodySm text-textSecondary border border-borderC rounded-sm px-3 py-2 mt-3"
              >
                <Sparkles size={14} strokeWidth={1.75} />
                {generating ? "Writing new challenges…" : "Generate more challenges"}
              </button>
              {genError && <div className="text-caption text-red-500 mt-1.5">{genError}</div>}

              <button
                onClick={onRest}
                className="w-full flex items-center justify-center gap-1.5 text-bodySm text-textMuted mt-3 py-1"
              >
                <Moon size={14} strokeWidth={1.75} />
                Rest this value (it keeps its growth)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// The Seeker's own words come first; YOU's perspective is revealed after,
// so it can't anchor what they write.
function Definition({ v, tagline, onSave }) {
  const [editing, setEditing] = useState(!v.definition);
  const [skipped, setSkipped] = useState(false);
  const [text, setText] = useState(v.definition || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(text);
      setEditing(false);
    } catch (e) {
      console.error("[ValuesPanel] definition save failed:", e);
    }
    setSaving(false);
  }

  const showPerspective = !!v.definition || skipped;

  return (
    <div>
      {editing && !skipped ? (
        <div>
          <div className="text-bodySm text-textPrimary mb-2">
            {v.definition ? `How would you put ${v.name} now?` : `What does ${v.name} mean to you, in your own words?`}
          </div>
          <textarea rows={3} value={text} onChange={e => setText(e.target.value)} className={`${fieldClass} mb-2`} />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => { if (v.definition) { setText(v.definition); setEditing(false); } else setSkipped(true); }}
            >
              {v.definition ? "Cancel" : "Not now"}
            </Button>
            <Button variant="primary" size="sm" className="flex-1" disabled={!text.trim() || saving} onClick={save}>
              {saving ? "Saving…" : "Save my words"}
            </Button>
          </div>
        </div>
      ) : v.definition ? (
        <div>
          <div className="text-label uppercase text-textMuted mb-1">In your words</div>
          <div className="font-serif italic text-body text-textPrimary">{v.definition}</div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-caption text-textSecondary mt-1.5"
          >
            <PenLine size={12} strokeWidth={1.75} />
            Revisit
          </button>
        </div>
      ) : (
        <button onClick={() => setSkipped(false)} className="flex items-center gap-1 text-caption text-textSecondary">
          <PenLine size={12} strokeWidth={1.75} />
          Write what {v.name} means to you
        </button>
      )}

      {showPerspective && (
        <div className="mt-3">
          <div className="text-label uppercase text-textMuted mb-1">YOU's perspective</div>
          <div className="text-bodySm text-textSecondary">{tagline}</div>
        </div>
      )}
    </div>
  );
}

function AddValuePicker({ adding, setAdding, available, activeValues, onPick }) {
  const [view, setView] = useState("element"); // "element" | "az"

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center justify-center gap-1.5 text-bodySm border border-borderC rounded-sm px-3 py-2 w-full text-textSecondary"
      >
        <Plus size={14} strokeWidth={1.75} />
        Add a value
      </button>
    );
  }

  // Gentle invitation toward one value per Element — never a requirement.
  const heldElements = new Set(activeValues.map(v => VALUE_ELEMENT[v.name]).filter(Boolean));
  const missing = ELEMENTS.filter(e => !heldElements.has(e));

  const choice = name => (
    <button key={name} onClick={() => onPick(name)} className="text-bodySm border border-borderC rounded-sm px-3 py-2 text-left bg-surface1">
      {name}
    </button>
  );

  return (
    <div className="rounded-card bg-surface1 shadow-card p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {[["element", "By Element"], ["az", "A–Z"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`text-caption px-2.5 py-1 rounded-full ${view === key ? "bg-forestAccent text-surface2" : "bg-surface3 text-textMuted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setAdding(false)} className="text-caption text-textSecondary">Close</button>
      </div>

      {missing.length > 0 && missing.length < ELEMENTS.length && (
        <div className="text-caption text-textMuted mb-3">
          Not yet in your focus: {missing.join(", ")}. A value from each can bring balance — only if it calls you.
        </div>
      )}

      {available.length === 0 && <div className="text-bodySm text-textMuted">Every value in the library is already yours.</div>}

      {view === "az" ? (
        <div className="grid grid-cols-2 gap-2">
          {[...available].sort((a, b) => a.name.localeCompare(b.name)).map(v => choice(v.name))}
        </div>
      ) : (
        <div className="space-y-3">
          {ELEMENTS.map(el => {
            const list = available.filter(v => VALUE_ELEMENT[v.name] === el);
            if (list.length === 0) return null;
            return (
              <div key={el}>
                <div className="text-label uppercase text-textMuted mb-1.5">{el}</div>
                <div className="grid grid-cols-2 gap-2">{list.map(v => choice(v.name))}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
