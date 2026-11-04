import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Flame, RotateCcw, ChevronDown, Award, Star, Target, Sparkles, Pencil, MapPin, Trash2, Flag, Moon, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../../lib/AppDataContext";
import { DAY_LABELS, TIERS, PILLAR_COLORS } from "../../constants/app.const";
import { riseIn, easeOut } from "../ui/motion";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import { StepList } from "../ui/StepList";
import AddItemModal from "./AddItemModal";
import HabitDay from "./HabitDay";
import HabitTotals from "./HabitTotals";
import StepEditor from "./StepEditor";
import { todaySlot } from "../home/HabitsToday";
import { dailySteps, stepKey } from "../../lib/habits";
import { bonusHint, finishXp, habitDays, nextCheckinXp } from "../../lib/xp";
import { localDateKey as todayKey } from "../../lib/week";
import { useActivePursuits } from "../../lib/activePursuits";
import { PillarChip, pillarColor } from "../ui/Pillar";
import { visionsFor } from "../../lib/visions";

const TYPE_ICON = { dream: Star, goal: Target, habit: Flame, idea: Lightbulb };

// 8 small sparks radiating outward from the checkbox and fading — the one
// moment (right when an item is confirmed complete) that gets an animated
// celebration rather than just a static "done" look, since that's the
// instant it's actually satisfying to see.
const BURST_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

function CompletionBurst() {
  return (
    <motion.div className="absolute left-0 top-0 w-7 h-7 pointer-events-none" style={{ zIndex: 1 }}>
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

// Six days back to today, oldest first, labelled with their weekday letter.
function lastSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: todayKey(d), label: DAY_LABELS[(d.getDay() + 6) % 7], date: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) };
  });
}

// One pursuit, compact until opened (Cassidy, Nov 2). Closed: the circle
// (a habit ticks today; a goal or dream is completed), the name, its Pillar
// and how it's going. Open: today's steps, the week, totals, notes, and the
// things done less often (edit, mark complete, delete). Habits count real
// days in a row only; the old weekly cycle and its "start fresh" are
// retired, and Prestige already earned stays as a quiet mark. An active
// pursuit is highlighted in gold; a resting one is quieter, with Activate
// right on it (lib/activePursuits.js).
export default function ItemCard({ item }) {
  const {
    completeItem, unachieveItem, deleteItem, toggleDay, toggleMilestone, addMilestone, removeMilestone, setMilestones,
    getPrestigeTier, wanderings, wanderingStops, createWandering,
    habitLogs, toggleHabitStep, habitStreak, logPastDay, memory, identityVisions
  } = useAppData();
  const growing = visionsFor(item, identityVisions);
  const isHabit = item.type === "habit";
  const today = todayKey();
  const reduce = useReducedMotion();
  const doneDays = isHabit ? habitDays(item, memory, habitLogs) : null;
  const navigate = useNavigate();
  const { isActive, setActive } = useActivePursuits();
  const active = isActive(item);
  const toggleActive = () => setActive(item, !active).catch(e => console.error("[ItemCard] active failed:", e));
  const [open, setOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [reflecting, setReflecting] = useState(false);
  const [reflection, setReflection] = useState("");
  const [completedDate, setCompletedDate] = useState(todayKey());
  const [celebrating, setCelebrating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingSteps, setEditingSteps] = useState(false);
  // A dream's travel plan, if it has one (Wanderings live inside Dreams).
  const wandering = item.type === "dream" ? wanderings.find(w => w.item_id === item.id) : null;
  const wanderingStopCount = wandering ? wanderingStops.filter(s => s.wandering_id === wandering.id).length : 0;

  const color = PILLAR_COLORS[item.cat] || "var(--gold)";
  const prestigeTier = isHabit ? getPrestigeTier(item) : 0;
  const tierColor = prestigeTier > 0 ? TIERS[(prestigeTier - 1) % TIERS.length].color : null;
  const msTotal = (item.milestones || []).length;
  const msDone = (item.milestones || []).filter(m => m.done).length;
  const msPct = msTotal > 0 ? Math.round((msDone / msTotal) * 100) : 0;

  // A habit's today: ticked, or how many of its steps are done.
  const steps = isHabit ? dailySteps(item) : [];
  const multi = isHabit && !(steps.length === 1 && steps[0].key === "habit");
  const logsToday = isHabit ? habitLogs.filter(l => l.item_id === item.id && l.day === today) : [];
  const slot = todaySlot();
  const doneToday = isHabit && (logsToday.length > 0 || Boolean(item.days?.[slot] && item.lastCheckin === today));
  const stepsDone = multi ? steps.filter(s => logsToday.some(l => l.step === s.key)).length : 0;
  const streak = isHabit ? habitStreak(item) : null;
  const inARow = streak ? Math.max(streak.now, streak.before) : 0;

  function tickToday() {
    if (multi) return setOpen(true);
    (logsToday.length > 0 || !doneToday
      ? toggleHabitStep(item.id, "habit", steps[0].amount)
      : toggleDay(item.id, slot)
    ).catch(e => console.error("[ItemCard] tick failed:", e));
  }

  async function planWandering() {
    setPlanning(true);
    setPlanError("");
    try {
      const w = await createWandering(item);
      navigate(`/wandering/${w.id}`);
    } catch (e) {
      console.error("[ItemCard] createWandering failed:", e);
      setPlanError("Couldn't start the wandering. Check your connection and try again.");
      setPlanning(false);
    }
  }

  function startComplete() {
    if (item.done) return;
    setCompletedDate(todayKey());
    setOpen(true);
    setReflecting(true);
  }
  async function confirmComplete(skip) {
    await completeItem(item.id, skip ? "" : reflection, completedDate);
    setReflecting(false);
    setReflection("");
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 750);
  }

  function confirmDelete() {
    const keep = item.done ? "" : " To keep its story, mark it complete instead, or let it go at Harvest.";
    if (window.confirm(`Delete "${item.name}" for good? Its steps and history go with it.${keep}`)) {
      Promise.resolve(deleteItem(item.id)).catch(e => console.error("[ItemCard] delete failed:", e));
    }
  }

  // What shows under the name while closed.
  const summary = item.done
    ? "Completed"
    : isHabit
      ? inARow > 0 ? `${inARow} ${inARow === 1 ? "day" : "days"} in a row` : "Start a streak today"
      : msTotal > 0 ? `${msDone} of ${msTotal} ${msTotal === 1 ? "step" : "steps"}` : `+${finishXp(item)} XP when it's complete`;

  return (
    <motion.div
      {...riseIn}
      className={`rounded-card shadow-card mb-2.5 relative overflow-hidden transition-colors duration-500 ${
        item.done
          ? "bg-gradient-to-br from-surface1 to-[color-mix(in_srgb,var(--gold)_16%,var(--surface-1))] border border-gold/40"
          : active
            ? "bg-surface1 border border-gold/60 shadow-[0_6px_18px_color-mix(in_srgb,var(--gold)_16%,transparent)]"
            : "bg-surface1 opacity-90"
      }`}
    >
      {/* The Pillar's colour down the left edge. */}
      <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />

      <div className="flex items-center gap-3 pl-4 pr-2 py-2.5 min-h-[60px]">
        <div className="relative flex-none">
          {celebrating && <CompletionBurst />}
          {item.done ? (
            <GlowBubble icon={Check} size={28} color="var(--gold)" animate={false} />
          ) : isHabit ? (
            <button
              type="button"
              onClick={tickToday}
              role={multi ? undefined : "checkbox"}
              aria-checked={multi ? undefined : doneToday}
              aria-label={multi ? `${item.name}: ${stepsDone} of ${steps.length} steps today. Open to tick them` : `${item.name}: ${doneToday ? "done today, tap to undo" : "tick off for today"}`}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-semibold transition ${
                (multi ? stepsDone === steps.length : doneToday)
                  ? "bg-gold border-gold text-[#19193D]"
                  : multi && stepsDone > 0 ? "border-gold text-gold" : "border-borderC text-textMuted hover:border-gold"
              }`}
            >
              {(multi ? stepsDone === steps.length : doneToday) ? <Check size={15} strokeWidth={2.5} /> : multi ? `${stepsDone}/${steps.length}` : null}
            </button>
          ) : (
            <button
              type="button"
              onClick={startComplete}
              aria-label={`Mark "${item.name}" complete`}
              className="w-8 h-8 rounded-full border border-borderC hover:border-gold transition"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
        >
          <GlowBubble icon={TYPE_ICON[item.type] || Flame} size={28} animate={false} color={color} className="flex-none" />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5 text-body font-medium text-textPrimary">
              <span className={`truncate ${item.done ? "line-through decoration-wavy decoration-1 decoration-gold" : ""}`}>{item.name}</span>
              {item.done && <Sparkles size={13} strokeWidth={1.75} className="text-gold flex-none" />}
            </span>
            <span className="flex items-center gap-1.5 text-caption text-textSecondary mt-0.5">
              {isHabit && inARow > 0 && !item.done && <Flame size={12} strokeWidth={1.75} className="text-ember flex-none" aria-hidden="true" />}
              <span className="truncate">{summary}</span>
              {prestigeTier > 0 && (
                <span className="flex-none inline-flex items-center gap-0.5" style={{ color: tierColor }} title={`Prestige ${prestigeTier}, from the weekly cycles`}>
                  <Award size={11} strokeWidth={1.75} aria-hidden="true" /> {prestigeTier}
                </span>
              )}
            </span>
          </span>
          <ChevronDown size={18} strokeWidth={1.75} className={`flex-none text-textMuted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {!item.done && !active && (
          <button
            type="button"
            onClick={toggleActive}
            aria-label={`Make "${item.name}" active`}
            className="flex-none inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-full border border-gold/60 text-caption text-[#7A6024] dark:text-gold hover:bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]"
          >
            <Sparkles size={12} strokeWidth={1.75} /> Activate
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-3.5 pb-3.5 pt-0.5 border-t border-borderC mx-0">
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-caption text-textSecondary">
                <span className="px-2 py-0.5 rounded-full bg-surface3 capitalize">{item.type}</span>
                <PillarChip pillar={item.cat} />
                {item.subcat && <span className="px-2 py-0.5 rounded-full bg-surface3">{item.subcat.split("/").join(" › ")}</span>}
                {(item.tags || []).map(t => <span key={t}>#{t}</span>)}
              </div>

              {item.intention && <p className="font-serif italic text-body text-textPrimary m-0 mt-2.5">{item.intention}</p>}
              {/* The selves this grows (Identity, Nov 4). */}
              {growing.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/journey", { state: { tab: "identity" } })}
                  className="flex flex-wrap items-center gap-1.5 mt-2.5 text-caption text-textSecondary text-left"
                >
                  <Sparkles size={13} strokeWidth={1.75} className="text-gold" aria-hidden="true" /> A vote for
                  {growing.map((v, i) => (
                    <span key={v.id} className="font-medium" style={{ color: pillarColor(v.category) }}>{v.title}{i < growing.length - 1 ? "," : ""}</span>
                  ))}
                </button>
              )}
              {item.note && <p className="text-bodySm text-textSecondary m-0 mt-1.5 whitespace-pre-line">{item.note}</p>}

              {wandering && (
                <button
                  type="button"
                  onClick={() => navigate(`/wandering/${wandering.id}`)}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-caption text-forestAccent font-medium"
                >
                  <MapPin size={13} strokeWidth={1.75} />
                  Wandering · {wanderingStopCount} {wanderingStopCount === 1 ? "stop" : "stops"}
                </button>
              )}

              {isHabit && !item.done && (
                <>
                  {/* Today's steps (or amount), fresh each day. */}
                  {(multi || steps[0]?.amount != null) && (
                    <div className="mt-3">
                      <div className="text-label uppercase text-textMuted mb-1">Today</div>
                      <HabitDay item={item} />
                    </div>
                  )}

                  {/* The last seven real days, today on the right. A missed day
                      can be tapped in afterwards (Cassidy, Oct 27). */}
                  <div className="mt-3">
                    <div className="text-label uppercase text-textMuted mb-1.5">This week</div>
                    <div className="flex gap-2">
                      {lastSevenDays().map(({ key, label, date }) => {
                        const isToday = key === today;
                        const done = doneDays.has(key);
                        return (
                          <div key={key} className="text-center">
                            <button
                              type="button"
                              disabled={isToday}
                              onClick={() => logPastDay(item.id, key).catch(e => console.error("[ItemCard] past day failed:", e))}
                              className={`w-7 h-7 rounded-full border ${done ? "bg-gold border-gold" : "border-borderC"} ${isToday ? "ring-1 ring-offset-1 ring-gold/50 ring-offset-surface1" : "hover:border-gold"}`}
                              aria-label={isToday ? `Today: ${done ? "done" : "not yet"}` : `${label} ${date}: ${done ? "done, tap to take it back" : "tap if you did it"}`}
                            />
                            <div className={`text-[10px] mt-0.5 ${isToday ? "text-gold font-semibold" : "text-textMuted"}`}>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-textMuted mt-1">Forgot a day? Tap it to fill it in.</div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="text-gold">+{nextCheckinXp(streak.before)} XP for today's check-in</span>
                    <span className="text-textMuted">{bonusHint(streak.before)}</span>
                  </div>
                </>
              )}
              {isHabit && <HabitTotals item={item} />}

              {!isHabit && msTotal > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-surface3 overflow-hidden">
                    <div className="h-full bg-forestAccent" style={{ width: `${msPct}%` }} />
                  </div>
                </div>
              )}

              {/* Steps: a habit's daily ones are ticked above, so here they're
                  the list to add to or trim; a goal's are ticked off here. */}
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-label uppercase text-textMuted">{msTotal ? "Steps" : "Break it into steps"}</div>
                  {msTotal > 0 && !item.done && !editingSteps && (
                    <button type="button" onClick={() => setEditingSteps(true)} className="inline-flex items-center gap-1 min-h-[32px] text-caption text-forestAccent font-medium">
                      <Pencil size={12} strokeWidth={1.75} /> Edit steps
                    </button>
                  )}
                </div>
                {editingSteps ? (
                  <StepEditor
                    steps={item.milestones || []}
                    isHabit={isHabit}
                    onCancel={() => setEditingSteps(false)}
                    onSave={async list => { await setMilestones(item.id, list); setEditingSteps(false); }}
                  />
                ) : (
                <StepList
                  steps={isHabit
                    ? (item.milestones || []).map(m => ({ ...m, done: habitLogs.some(l => l.item_id === item.id && l.day === today && l.step === stepKey(m)) }))
                    : item.milestones || []}
                  onToggle={mi => {
                    if (!isHabit) return toggleMilestone(item.id, mi);
                    const m = item.milestones[mi];
                    return toggleHabitStep(item.id, stepKey(m), m.amount ?? null);
                  }}
                  onAdd={item.done ? null : text => addMilestone(item.id, text)}
                  onRemove={item.done ? null : mi => removeMilestone(item.id, mi)}
                />
                )}
              </div>

              {item.type === "dream" && !wandering && !item.done && (
                <div className="mt-2.5">
                  <button type="button" onClick={planWandering} disabled={planning} className="inline-flex items-center gap-1.5 text-caption text-forestAccent font-medium disabled:opacity-60">
                    <MapPin size={13} strokeWidth={1.75} />
                    {planning ? "Unfolding the map…" : "Does this dream take you somewhere? Plan a wandering"}
                  </button>
                  {planError && <div className="text-caption text-error mt-1">{planError}</div>}
                </div>
              )}

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

              {/* The things done less often. */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-2.5 border-t border-borderC text-caption">
                <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 min-h-[36px] text-textSecondary hover:text-textPrimary">
                  <Pencil size={14} strokeWidth={1.75} /> Edit
                </button>
                {!item.done && (
                  <button type="button" onClick={toggleActive} className="inline-flex items-center gap-1.5 min-h-[36px] text-textSecondary hover:text-textPrimary">
                    {active
                      ? <><Moon size={14} strokeWidth={1.75} /> Let it rest</>
                      : <><Sparkles size={14} strokeWidth={1.75} className="text-gold" /> Make active</>}
                  </button>
                )}
                {item.done ? (
                  <button type="button" onClick={() => unachieveItem(item.id)} className="inline-flex items-center gap-1.5 min-h-[36px] text-textSecondary hover:text-textPrimary">
                    <RotateCcw size={14} strokeWidth={1.75} /> Move back to growing
                  </button>
                ) : isHabit && !reflecting && (
                  <button type="button" onClick={startComplete} className="inline-flex items-center gap-1.5 min-h-[36px] text-textSecondary hover:text-textPrimary">
                    <Flag size={14} strokeWidth={1.75} /> Mark this habit complete
                  </button>
                )}
                <button type="button" onClick={confirmDelete} className="inline-flex items-center gap-1.5 min-h-[36px] ml-auto text-textMuted hover:text-red-500">
                  <Trash2 size={14} strokeWidth={1.75} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddItemModal open={editing} item={item} onClose={() => setEditing(false)} />
    </motion.div>
  );
}
