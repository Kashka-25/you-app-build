import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Moon, Sparkles, Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun,
  Plus, PenLine, RotateCcw, SunMoon
} from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import {
  getTier, VALUE_COLORS, TIERS, prestigeRequirement, getPrestigeStage,
  ELEMENTS, VALUE_ELEMENT, MAX_VALUE_SLOTS, START_VALUE_SLOTS, VALUE_PILLAR, VALUE_PILLAR2
} from "../../constants/app.const";
import { VALUE_LIBRARY, VALUE_ICONS, getValueEntry, valueNameForSlug } from "../../constants/valueLibrary";
import { easeOut } from "../ui/motion";
import { GlowBubble } from "../ui/GlowBubble";
import { Button } from "../ui/Button";
import { DropdownSection } from "../Primitives";
import { Guide } from "../ui/Guide";
import { Check } from "lucide-react";
import QuestionnaireFlow from "../questionnaires/QuestionnaireFlow";
import { AiButton, AiCard } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";
import TrueNorthCard from "./TrueNorthCard";
import { NorthStar } from "./Crossroads";
import ValuesSky from "./ValuesSky";
import { XpBar } from "../ui/XpBar";
import ShareToKronk from "../ShareToKronk";
import { valueShade } from "../../lib/elements";
import { findInCodex, closestValues, displayWord, validWord } from "../../lib/valueWords";

// One icon per authored PRESTIGE_LEVELS stage, same order -- a small growth
// arc (point -> shoot -> tree -> blossom x2 -> tended green -> single spark
// -> full sun) that reads distinctly from the VALUE_ICONS glyphs below.
const PRESTIGE_ICONS = [Dot, Sprout, TreeDeciduous, Flower, Flower2, LeafyGreen, Sparkle, Sun];


// A first choice for an empty account (Nov 5: "clearer Values"): ten values
// most people recognise straight away, each shown with its one-line meaning.
const STARTERS = ["Love", "Freedom", "Peace", "Courage", "Kindness", "Honesty", "Creativity", "Presence", "Gratitude", "Joy"];

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
    values, activeValues, valueSlots, addValue, addOwnValue, setValueStatus, saveValueDefinition,
    completeChallenge, valueChallenges, completeValueChallenge, generateValueChallenges
  } = useAppData();
  const [openName, setOpenName] = useState(null);
  const [adding, setAdding] = useState(false);
  // One brief, kind line when a value first ripens into a new tier. Never
  // confetti. Cleared as soon as the Seeker moves on to another value.
  const [moment, setMoment] = useState(null); // { name, tier, slotsBefore }

  const rested = values.filter(v => v.status === "rested");
  const hasRoom = activeValues.length < valueSlots;
  const available = VALUE_LIBRARY.filter(v => !values.some(x => x.name === v.name));

  async function handleAddValue(name) {
    await addValue(name);
    if (values.length + 1 >= 3) setOpenName(name);
    setAdding(false);
  }

  async function handleAddOwn(text) {
    const name = await addOwnValue(text);
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

  // A newcomer chooses a few first; the welcome stays until three are held.
  const empty = values.length === 0;
  const beginning = values.length < 3;

  return (
    <div>
      {/* What values are, and how they grow, said plainly (Nov 5). */}
      <p className="text-bodySm text-textSecondary m-0">
        The qualities you want to live by. Choose a few to grow, and they grow as you live them.
      </p>
      <Guide className="mb-2">
        <span className="block">
          <b className="font-medium text-textPrimary">In focus</b> are the values you're growing now. You start with room
          for {START_VALUE_SLOTS}; more room opens as they ripen, up to {MAX_VALUE_SLOTS}.
          <b className="font-medium text-textPrimary"> Resting</b> values are set down for a while and keep everything they've grown.
        </span>
        <span className="block mt-1.5">
          Each value has small challenges, gentle, bold and brave. Doing one grows the value, and the Pillar it belongs to.
        </span>
        <span className="block mt-1.5">
          Its bar fills through four tiers: Awakening, Practising, Embodying, Mastering. Each time it fills, the value reaches
          a new stage, from Seed and Sprout through to Luminary, and begins again a little deeper.
        </span>
      </Guide>

      {beginning && <FirstValues onPick={handleAddValue} onSeeAll={() => setAdding(true)} picked={values} />}

      {/* Values in focus open first; True North folds away below (Cassidy, Oct 18). */}
      {!empty && (
      <DropdownSection title={`In focus (${activeValues.length} of ${valueSlots})`} level={1} defaultOpen>
        <p className="text-caption text-textMuted m-0 -mt-1 mb-3">The values you're growing now. Tap one to see its challenges.</p>
        {/* Your values sky (Cassidy, Oct 19): the values in focus as a
            constellation; tap a star to open its card below. */}
        <ValuesSky
          total={valueSlots}
          open={openName}
          onSelect={name => toggleOpen(name)}
          onAdd={() => setAdding(true)}
          stars={activeValues.map(v => {
            const { pct, tier } = cycleView(v);
            return {
              name: v.name,
              color: valueShade(v.name, VALUE_ELEMENT) || VALUE_COLORS[v.name] || "#C9A24D",
              pct,
              tier: tier.name,
              tierColor: tier.color
            };
          })}
        />

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
            onPickOwn={handleAddOwn}
            held={values}
          />
        ) : (
          <div className="text-bodySm text-textMuted border border-dashed border-borderC rounded-sm px-3.5 py-3">
            All {valueSlots} places for focus are in use. Rest a value to make room — it keeps everything it has grown.
            {valueSlots < MAX_VALUE_SLOTS && " More room opens as your values ripen."}
          </div>
        )}
      </DropdownSection>
      )}

      {empty && adding && (
        <AddValuePicker
          adding={adding}
          setAdding={setAdding}
          available={available}
          activeValues={activeValues}
          onPick={handleAddValue}
          onPickOwn={handleAddOwn}
          held={values}
        />
      )}

      <TrueNorthInvite />


      {rested.length > 0 && (
        <DropdownSection title={`Resting (${rested.length}) · set down, nothing lost`} level={1}>
          <div className="text-caption text-textMuted mb-2">
            Resting values keep their growth. Return one whenever it calls you.
          </div>
          <div className="space-y-2">
            {rested.map(v => {
              const { tier, pct, prestige } = cycleView(v);
              const color = valueShade(v.name, VALUE_ELEMENT) || VALUE_COLORS[v.name] || "#C9A24D";
              const Icon = VALUE_ICONS[v.name] || Sparkles;
              const meaning = v.definition || getValueEntry(v.name)?.essence;
              return (
                <div
                  key={v.name}
                  className="flex items-center gap-3 rounded-card p-3 border"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
                    background: `linear-gradient(105deg, color-mix(in srgb, ${color} 10%, var(--surface-1)) 0%, var(--surface-1) 60%)`
                  }}
                >
                  <span className="w-10 h-10 rounded-full flex-none flex items-center justify-center opacity-80" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, color: deep(color) }}>
                    <Moon size={16} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-serif text-h3 text-textPrimary">
                      {Icon && <Icon size={14} strokeWidth={1.75} style={{ color: deep(color) }} aria-hidden="true" />}{v.name}
                    </div>
                    {meaning && <div className="font-serif italic text-caption text-textSecondary line-clamp-1">{meaning}</div>}
                    <div className="text-caption text-textMuted">
                      Resting at <span className="font-semibold" style={{ color: deep(tier.color) }}>{tier.name}</span>
                      {pct > 0 ? `, ${pct}% through` : ""} · {getPrestigeStage(prestige).name}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    disabled={!hasRoom}
                    onClick={() => setValueStatus(v.name, "active")}
                  >
                    Return
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

// Stage and tier colours, deepened toward the text colour so they read on
// the beige cards (Nov 5).
const deep = c => `color-mix(in srgb, ${c} 62%, var(--text-primary, #2B2118))`;

// The Pillar a value's challenges grow, and the one it feeds a little (at
// half), the same rule as awardValuePillarXP. A value in the Seeker's own
// words grows Spirit. Said on the card so values and Pillars visibly connect.
function valuePillars(name) {
  return { main: VALUE_PILLAR[name] || "Spirit", also: VALUE_PILLAR2[name] || null };
}

// "9% of the way to Practising": a value's growth said in words, toward
// its next tier, or its next stage once it's Mastering (Nov 5).
function growthWords(pct, tier, prestige) {
  const i = TIERS.findIndex(t => t.name === tier.name);
  const next = i < TIERS.length - 1 ? TIERS[i + 1].name : getPrestigeStage(prestige + 1).name;
  if (pct <= 0) return "just planted";
  return `${pct}% of the way to ${next}`;
}

function ValueCard({
  v, open, onToggle, moment, valueChallenges,
  onCompleteLib, onCompleteAi, onGenerate, onSaveDefinition, onRest
}) {
  const [diff, setDiff] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [exploring, setExploring] = useState(false);
  // A challenge just ticked stays a moment, filled in the value's colour,
  // before it folds into Done (Nov 5).
  const [justDone, setJustDone] = useState(null); // { key, pts }

  const { prestige, requirement, pct, tier } = cycleView(v);
  const stage = getPrestigeStage(prestige);
  const StageIcon = PRESTIGE_ICONS[stage.index];
  const stageColor = TIERS[prestige % TIERS.length].color;
  // A value in the Seeker's own words has no Codex entry: it gets gold,
  // a spark, and no fixed challenges (it can still generate its own).
  // Each value wears its own Element (design/yin-yang); own values keep gold.
  const color = valueShade(v.name, VALUE_ELEMENT) || VALUE_COLORS[v.name] || "#C9A24D";
  const Icon = VALUE_ICONS[v.name] || Sparkles;
  const lib = getValueEntry(v.name);
  const own = !lib;
  const fixedChallenges = lib?.challenges || [];
  const grows = valuePillars(v.name);

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      await onGenerate();
    } catch (e) {
      console.error("[ValuesPanel] generate failed:", e);
      setGenError(e?.friendly || "Couldn't suggest new challenges right now. Try again in a little while.");
    }
    setGenerating(false);
  }

  return (
    // A soft wash of the value's Element across the card, and its growth as a
    // ring around its emblem (Cassidy, Oct 19: a pleasure to look at).
    <div
      className="rounded-card shadow-card p-3.5 border"
      style={{
        borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
        background: `linear-gradient(105deg, color-mix(in srgb, ${color} 16%, var(--surface-1)) 0%, var(--surface-1) 62%)`
      }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3">
        {Icon && <GlowBubble icon={Icon} size={44} color={color} />}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-serif text-h3 text-textPrimary flex-1 min-w-0 truncate">{v.name}</span>
            {/* A solid chip rather than plain colored text -- next to the tier
                caption below, plain text read as one blurred phrase. */}
            <span
              className="flex items-center gap-1 text-caption font-semibold px-2 py-0.5 rounded-full flex-none"
              style={{ color: deep(stageColor), background: `color-mix(in srgb, ${stageColor} 22%, transparent)` }}
              title={stage.desc}
            >
              {StageIcon && <StageIcon size={11} strokeWidth={2} />}
              {stage.name}
            </span>
          </div>
          {/* What it means, on the card itself (Nov 5: friendlier cards). */}
          {(v.definition || lib?.essence) && (
            <div className="font-serif italic text-bodySm text-textSecondary leading-snug mt-0.5 line-clamp-1">{v.definition || lib.essence}</div>
          )}
          {/* The Fallout-style XP bar through this cycle (Cassidy, Oct 19),
              read in words rather than numbers. */}
          <XpBar pct={pct} color={color} className="mt-1.5" />
          <div className="text-caption text-textMuted mt-1">
            <span className="font-semibold" style={{ color: deep(tier.color) }}>{tier.name}</span>
            {" · "}{growthWords(pct, tier, prestige)}
            {VALUE_ELEMENT[v.name] ? <> · {VALUE_ELEMENT[v.name]}</> : own ? <> · your own</> : null}
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
          <div>
            <ShareToKronk text={`${v.name} has ripened into ${moment.tier} for me. 🌿`} className="not-italic font-sans" />
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <Definition v={v} entry={lib} onSave={onSaveDefinition} />
              {own && (
                <div className="text-caption text-textMuted mt-2">
                  A value in your own words. It isn't in the Codex yet, so YOU's perspective will come once it's written.
                </div>
              )}

              {/* Challenges, calmer (Nov 5): what's left to try, the done ones
                  folded away, difficulty as chips with counts. */}
              {(() => {
                const all = [
                  ...fixedChallenges.map((c, idx) => ({ key: `lib-${idx}`, text: c.text, pts: c.pts, diff: c.diff, done: (v.completed || []).includes(idx), complete: () => onCompleteLib(idx) })),
                  ...valueChallenges.map(c => ({ key: c.id, text: c.text, pts: c.pts, diff: c.diff, done: c.completed, ai: true, complete: () => onCompleteAi(c.id) }))
                ];
                const shown = all.filter(c => diff === "all" || c.diff === diff);
                const toTry = shown.filter(c => !c.done || c.key === justDone?.key);
                const done = shown.filter(c => c.done && c.key !== justDone?.key);
                const count = d => all.filter(c => !c.done && (d === "all" || c.diff === d)).length;
                return (
                  <>
                    <div className="flex items-baseline justify-between mt-4 mb-1">
                      <div className="text-label uppercase text-textMuted">Challenges</div>
                    </div>
                    {/* What a challenge grows, and what the number means (C3). */}
                    <p className="text-caption text-textMuted m-0 mb-2">
                      Each one you do grows {v.name} and your {grows.main} Pillar
                      {grows.also ? <> (and {grows.also}, a little)</> : null} by the points shown.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3" role="radiogroup" aria-label="How big a step">
                      {[["all", "All"], ["gentle", "Gentle"], ["bold", "Bold"], ["brave", "Brave"]].map(([d, label]) => (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={diff === d}
                          onClick={() => setDiff(d)}
                          className={`text-caption min-h-[30px] px-3 rounded-full border ${diff === d ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC bg-surface1 text-textSecondary"}`}
                        >
                          {label} <span className="opacity-70">· {count(d)}</span>
                        </button>
                      ))}
                    </div>
                    {all.length === 0 && (
                      <div className="text-bodySm text-textMuted mb-2">No challenges written for {v.name} yet. Generate a few below to begin.</div>
                    )}
                    {all.length > 0 && toTry.length === 0 && (
                      <div className="text-bodySm text-textMuted mb-2">Nothing left to try here{diff !== "all" ? ` at ${diff}` : ""}. Generate a few more below.</div>
                    )}
                    <ul className="list-none m-0 p-0 space-y-2">
                      {toTry.map(c => {
                        const celebrating = justDone?.key === c.key;
                        return (
                        <li key={c.key} className="flex items-start gap-3 p-3 rounded-sm bg-surface2 transition-colors duration-500" style={celebrating ? { background: `color-mix(in srgb, ${color} 14%, var(--surface-2))` } : undefined}>
                          <button
                            type="button"
                            disabled={celebrating}
                            onClick={() => {
                              setJustDone({ key: c.key, pts: c.pts });
                              c.complete();
                              setTimeout(() => setJustDone(j => (j?.key === c.key ? null : j)), 1800);
                            }}
                            aria-label={`Mark done: ${c.text}`}
                            className="w-6 h-6 mt-0.5 flex-none rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--forest-accent)_12%,transparent)]"
                            style={celebrating
                              ? { borderColor: color, background: color, transform: "scale(1.1)" }
                              : { borderColor: `color-mix(in srgb, ${color} 70%, var(--border-c, #ccc))` }}
                          >
                            {celebrating && <Check size={14} strokeWidth={2.75} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-bodySm text-textPrimary ${celebrating ? "line-through decoration-1" : ""}`}>{c.text}</div>
                            {celebrating && (
                              <div className="text-caption font-medium mt-0.5" style={{ color: deep(color) }} role="status">
                                +{c.pts} · {v.name} and {grows.main} grew
                              </div>
                            )}
                            <div className="text-caption text-textMuted mt-0.5 capitalize">
                              {c.diff}{c.ai && <span className="normal-case"> · <span className="text-gold">✦ written for you</span></span>}
                            </div>
                          </div>
                          <div className="text-caption font-medium flex-none mt-0.5" style={{ color: deep(color) }}>+{c.pts}</div>
                        </li>
                        );
                      })}
                    </ul>
                    {done.length > 0 && (
                      <details className="mt-2.5 group">
                        <summary className="cursor-pointer list-none inline-flex items-center gap-1 min-h-[32px] text-caption text-textMuted">
                          <ChevronDown size={14} strokeWidth={1.75} className="transition-transform group-open:rotate-180" /> Done · {done.length}
                        </summary>
                        <ul className="list-none m-0 p-0 mt-1.5 space-y-1.5">
                          {done.map(c => (
                            <li key={c.key} className="flex items-start gap-2.5 px-3 py-2 rounded-sm text-bodySm text-textMuted">
                              <Check size={14} strokeWidth={2.25} className="mt-0.5 flex-none text-forestAccent" />
                              <span className="flex-1 line-through decoration-1 decoration-[color-mix(in_srgb,var(--text-muted,#999)_60%,transparent)]">{c.text}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </>
                );
              })()}

              <AiButton size="sm" full onClick={handleGenerate} busy={generating} className="mt-3">
                {generating ? "Writing new challenges…" : "Generate more challenges"}
              </AiButton>
              <DrawsFrom uses={["journal", "pursuits", "values"]} className="mt-1.5" />
              {genError && <div className="text-caption text-red-500 mt-1.5">{genError}</div>}

              {/* Quieter ways on, at the foot */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mt-4 pt-3 border-t border-borderC">
                <button type="button" onClick={() => setExploring(true)} className="inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-textSecondary hover:text-textPrimary">
                  <SunMoon size={14} strokeWidth={1.75} /> Explore its light &amp; shadow
                </button>
                <button type="button" onClick={onRest} className="inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-textMuted hover:text-textSecondary">
                  <Moon size={14} strokeWidth={1.75} /> Rest this value
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionnaireFlow
        open={exploring}
        onClose={() => setExploring(false)}
        questionnaire="light_shadow"
        valueName={v.name}
      />
    </div>
  );
}

// The Seeker's own words come first; YOU's perspective is revealed after,
// so it can't anchor what they write.
function Definition({ v, entry, onSave }) {
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

      {showPerspective && entry && <Perspective entry={entry} />}
    </div>
  );
}

// Naming a value in your own words. If the word already lives in the Codex
// (as a value, a synonym or a sub-value) that's offered first; the Seeker
// can still keep their own word.
function NameYourOwn({ held, available, onPick, onPickOwn }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const word = displayWord(text);
  const home = text.trim() ? findInCodex(text) : null;
  const close = text.trim() && !home ? closestValues(text).filter(v => available.some(a => a.name === v.name)) : [];
  const already = held.some(v => v.name.toLowerCase() === word.toLowerCase());
  const homeHeld = home && held.some(v => v.name === home.value.name);

  async function run(fn) {
    setBusy(true);
    setError("");
    try { await fn(); setText(""); } catch (e) {
      console.error("[ValuesPanel] add own value failed:", e);
      setError(e?.message === "You already hold this value" ? "You already hold this value." : "Couldn't add it just now. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mb-4 pb-4 border-b border-borderC">
      <div className="text-label uppercase text-textMuted mb-1.5">Name your own</div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={30}
        placeholder="A value in your own words…"
        className={fieldClass}
      />
      {text.trim() && (
        <div className="mt-2.5 space-y-2">
          {home && !homeHeld && (
            <div className="text-bodySm text-textPrimary">
              {home.via === "name" ? `${home.value.name} is in the Codex.` : `"${word}" lives in the Codex as ${home.via === "synonym" ? "another word for" : "part of"} ${home.value.name}.`}{" "}
              <button disabled={busy} onClick={() => run(() => onPick(home.value.name))} className="text-forestAccent font-medium underline underline-offset-2">
                Add {home.value.name}
              </button>
            </div>
          )}
          {home && homeHeld && <div className="text-bodySm text-textMuted">"{word}" lives in the Codex as {home.value.name}, which is already yours.</div>}
          {close.length > 0 && (
            <div className="text-bodySm text-textSecondary">
              Close in the Codex:{" "}
              {close.map((v, i) => (
                <span key={v.name}>
                  {i > 0 && ", "}
                  <button disabled={busy} onClick={() => run(() => onPick(v.name))} className="text-forestAccent underline underline-offset-2">{v.name}</button>
                </span>
              ))}
            </div>
          )}
          {home?.via !== "name" && (
            already ? (
              <div className="text-caption text-textMuted">You already hold {word}.</div>
            ) : validWord(text) ? (
              <Button variant="secondary" size="sm" className="w-full" disabled={busy} onClick={() => run(() => onPickOwn(text))}>
                {busy ? "Adding…" : `Keep "${word}" as my own value`}
              </Button>
            ) : (
              <div className="text-caption text-textMuted">A value can be 2 to 30 letters, with spaces or hyphens.</div>
            )
          )}
          {error && <div className="text-caption text-red-500">{error}</div>}
        </div>
      )}
    </div>
  );
}

// An empty account's first step (Nov 5): a few values to choose from, each
// with its meaning, and the way into the whole library.
export function FirstValues({ onPick, onSeeAll, picked }) {
  const [busy, setBusy] = useState(null);
  const starters = STARTERS.map(name => ({ name, entry: getValueEntry(name) })).filter(s => s.entry);
  async function pick(name) {
    setBusy(name);
    try { await onPick(name); } finally { setBusy(null); }
  }
  return (
    <section aria-labelledby="first-values" className="rounded-card bg-surface1 shadow-card p-4 mb-4 mt-2" style={{ borderLeft: "3px solid color-mix(in srgb, var(--gold) 70%, transparent)" }}>
      <h3 id="first-values" className="font-serif text-h3 text-textPrimary m-0">{picked.length ? "Choose a few more" : "Choose your first values"}</h3>
      <p className="text-bodySm text-textSecondary m-0 mt-1 mb-3">
        {picked.length ? "One or two more that feel true right now, if they call you." : "Start with two or three that feel true right now. You can change them any time."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {starters.map(({ name, entry }) => {
          const has = picked.some(v => v.name === name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => !has && pick(name)}
              disabled={has || busy === name}
              aria-pressed={has}
              className={`text-left rounded-sm border px-3 py-2 transition-colors ${has ? "border-forestAccent bg-[color-mix(in_srgb,var(--forest-accent)_10%,var(--surface-1))]" : "border-borderC bg-surface2 hover:border-forestAccent"}`}
            >
              <span className="flex items-center gap-1.5 text-bodySm font-medium text-textPrimary">
                {has && <Check size={14} strokeWidth={2.25} className="text-forestAccent" />}{name}
              </span>
              <span className="block text-caption text-textMuted leading-snug mt-0.5 line-clamp-3">{entry.essence}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onSeeAll} className="mt-3 inline-flex items-center gap-1 min-h-[40px] text-bodySm font-medium text-forestAccent">
        <Plus size={14} strokeWidth={1.75} /> See all the values, or name your own
      </button>
    </section>
  );
}

function AddValuePicker({ adding, setAdding, available, activeValues, onPick, onPickOwn, held }) {
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

  // Each value with its one-line meaning, so choosing is about the meaning (Nov 5).
  const choice = name => (
    <button key={name} onClick={() => onPick(name)} className="border border-borderC rounded-sm px-3 py-2 text-left bg-surface1 hover:border-forestAccent">
      <span className="block text-bodySm font-medium text-textPrimary">{name}</span>
      {getValueEntry(name)?.essence && <span className="block text-caption text-textMuted leading-snug mt-0.5 line-clamp-3">{getValueEntry(name).essence}</span>}
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
              className={`text-caption px-2.5 py-1 rounded-full ${view === key ? "bg-forestAccent text-onAccent" : "bg-surface3 text-textMuted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setAdding(false)} className="text-caption text-textSecondary">Close</button>
      </div>

      <NameYourOwn held={held} available={available} onPick={onPick} onPickOwn={onPickOwn} />

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

// YOU's perspective, from The ValYOU's Codex: the essence line first, the
// fuller picture (light, shadow, void, what keeps it whole) one tap deeper.
function Perspective({ entry }) {
  const [more, setMore] = useState(false);
  const kin = list => list.map(valueNameForSlug).join(", ");
  return (
    <div className="mt-3">
      <div className="text-label uppercase text-textMuted mb-1">YOU's perspective</div>
      <div className="font-serif text-body text-textPrimary">{entry.essence}</div>
      {more && (
        <div className="space-y-2.5 mt-2.5">
          {[["Light", entry.light], ["Shadow", entry.shadow], ["Void", entry.void], ["What keeps it whole", entry.whole]]
            .filter(([, text]) => text)
            .map(([label, text]) => (
              <div key={label}>
                <div className="text-label uppercase text-textMuted mb-0.5">{label}</div>
                <div className="text-bodySm text-textSecondary">{text}</div>
              </div>
            ))}
          {(entry.balancingKin.length > 0 || entry.nourishingKin.length > 0) && (
            <div className="text-caption text-textMuted">
              {entry.balancingKin.length > 0 && <>Balanced by {kin(entry.balancingKin)}</>}
              {entry.balancingKin.length > 0 && entry.nourishingKin.length > 0 && " · "}
              {entry.nourishingKin.length > 0 && <>Nourished by {kin(entry.nourishingKin)}</>}
            </div>
          )}
        </div>
      )}
      <button onClick={() => setMore(m => !m)} className="flex items-center gap-1 text-caption text-textSecondary mt-1.5">
        <ChevronDown size={12} strokeWidth={1.75} className={`transition-transform duration-200 ${more ? "rotate-180" : ""}`} />
        {more ? "Show less" : "Read the fuller picture"}
      </button>
    </div>
  );
}

// True North, made easy to find and inviting (Cassidy, Oct 19): a starlit
// card that names your North (or invites you to find it) and opens the
// Crossroads and compass beneath.
function TrueNorthInvite() {
  const { compass } = useAppData();
  const [open, setOpen] = useState(false);
  const north = compass?.ordering?.[0]?.join(" & ");
  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3.5 rounded-card p-4 text-left text-[#F7F5EF] shadow-cardDark overflow-hidden relative"
        style={{ background: "radial-gradient(120% 140% at 85% -20%, rgba(108,104,182,0.55) 0%, rgba(108,104,182,0) 55%), radial-gradient(90% 120% at 0% 120%, rgba(201,162,77,0.28) 0%, rgba(201,162,77,0) 60%), #0B0B1F" }}
      >
        <span className="w-12 h-12 rounded-full flex-none flex items-center justify-center border border-[#C9A24D]/50 bg-[#C9A24D]/10">
          <NorthStar size={26} strokeWidth={1.5} filled={Boolean(north)} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-label uppercase tracking-[0.12em] text-[#C9A24D]">{north ? "Your True North" : "True North"}</span>
          <span className="block font-serif text-[21px] leading-tight mt-0.5 truncate">{north || "Find which way you lean"}</span>
          {/* One line on what it is before you tap in, or your own compass line
              once you have one (Nov 5). */}
          <span className={`block mt-0.5 ${north && compass?.compass_line ? "font-serif italic text-bodySm text-[#EDE6D6] line-clamp-2" : "text-caption text-[#B8B5D6]"}`}>
            {north
              ? compass?.compass_line || "Open your compass"
              : "Choose between your values two at a time, to see which you lean toward when they pull apart."}
          </span>
        </span>
        <ChevronDown size={18} strokeWidth={1.75} className={`flex-none text-[#C9A24D] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
            <div className="pt-2.5"><TrueNorthCard /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
