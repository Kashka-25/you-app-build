import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Sprout, Moon, Wind, ArrowRight, Sparkles, Wheat } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { harvestWeekStartKey, weekRangeLabel, addDaysKey, WEEKDAY_SHORT, goBack, isSunday } from "../../lib/week";
import { stepProgress } from "../ui/StepList";
import { Button } from "../ui/Button";

const MAX_SOWN = 3;

// The week carried things land in: next week on Sunday, otherwise the
// week already underway (Harvest is then looking back on last week).
const intoWeek = () => (isSunday() ? "next week" : "this week");

const choicesFor = () => [
  { key: "carried", icon: ArrowRight, label: "Carry forward", desc: `Sow it again ${intoWeek()}` },
  { key: "rested", icon: Moon, label: "Let it rest", desc: "It stays in your pursuits" },
  { key: "released", icon: Wind, label: "Release", desc: "Let it go, with thanks" }
];

// "Tended on Mon and Wed": names what happened, never lists what didn't.
function tendedLabel(w) {
  const days = [...new Set((w.tended_dates || []).map(d => (new Date(d + "T00:00:00").getDay() + 6) % 7))].sort();
  if (days.length === 0) return "Not tended this time. That's allowed.";
  const names = days.map(i => WEEKDAY_SHORT[i]);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Tended on ${list}`;
}

function SectionLabel({ children }) {
  return <div className="text-label uppercase text-textMuted mb-2">{children}</div>;
}

// Harvest — the end-of-week look back that closes Sow · Tend · Harvest.
// Which roots grew, how each sown intention went, one thing YOUnderstanding
// noticed (only if a weekly reflection exists or is asked for), and a
// choice for each intention: carry forward, rest, or release.
export default function HarvestScreen() {
  const navigate = useNavigate();
  const {
    loaded, items, releasedItems, memory, weekIntentions, weekHarvests, harvestWeek,
    journalEntries, weeklyReflections, loadWeeklyReflection, generateWeeklyReflection
  } = useAppData();

  const week = harvestWeekStartKey();
  // On Sunday Harvest closes the week now ending; any other day, last week.
  const which = isSunday() ? "this week" : "last week";
  const weekEnd = addDaysKey(week, 6);
  const nextWeek = addDaysKey(week, 7);
  const allItems = useMemo(() => [...items, ...releasedItems], [items, releasedItems]);
  const sown = weekIntentions
    .filter(w => w.week_start === week)
    .map(w => ({ w, item: allItems.find(i => i.id === w.item_id) }))
    .filter(x => x.item);
  const harvest = weekHarvests.find(h => h.week_start === week);
  const nextWeekRows = weekIntentions.filter(w => w.week_start === nextWeek);

  const [decisions, setDecisions] = useState({});
  const [note, setNote] = useState("");
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [reflecting, setReflecting] = useState(false);
  const [reflectError, setReflectError] = useState("");

  // Re-opening a harvested week shows what was chosen, so it can be changed.
  useEffect(() => {
    if (!loaded || seeded) return;
    setDecisions(Object.fromEntries(weekIntentions.filter(w => w.week_start === week && w.outcome).map(w => [w.id, w.outcome])));
    setNote(harvest?.note || "");
    setSeeded(true);
  }, [loaded, seeded, weekIntentions, week, harvest]);

  useEffect(() => {
    if (!loaded || weeklyReflections[week] !== undefined) return;
    loadWeeklyReflection(week).catch(e => console.error("[Harvest] loadWeeklyReflection failed:", e));
  }, [loaded, week, weeklyReflections, loadWeeklyReflection]);

  // Which roots grew: every bit of XP logged this week, by Pillar.
  const roots = useMemo(() => {
    const byPillar = {};
    memory
      .filter(m => m.date_key >= week && m.date_key <= weekEnd && (m.xp || 0) > 0 && m.cat)
      .forEach(m => { byPillar[m.cat] = (byPillar[m.cat] || 0) + m.xp; });
    return PILLARS.filter(p => byPillar[p]).map(p => ({ name: p, xp: byPillar[p] }));
  }, [memory, week, weekEnd]);

  const reflection = weeklyReflections[week];
  const noticed = reflection?.sections?.patterns || reflection?.sections?.your_week || null;
  const hasJournalThisWeek = journalEntries.some(e => e.entry_date >= week && e.entry_date <= weekEnd);

  // Next week holds 3 at most; carrying can't push past that.
  const carriedCount = Object.entries(decisions).filter(([id, d]) => {
    const row = sown.find(x => x.w.id === id);
    return d === "carried" && row && !nextWeekRows.some(n => n.item_id === row.w.item_id);
  }).length;
  const room = MAX_SOWN - nextWeekRows.length;

  function choose(id, key) {
    setError("");
    setDecisions(prev => ({ ...prev, [id]: prev[id] === key ? undefined : key }));
  }

  async function reflect() {
    setReflecting(true);
    setReflectError("");
    try {
      const result = await generateWeeklyReflection(week);
      if (result?.empty) setReflectError(result.message || "Nothing to reflect on yet.");
    } catch (e) {
      console.error("[Harvest] reflection failed:", e);
      if (e?.code !== "consent_declined") setReflectError("Couldn't reflect on this week just now. Try again later.");
    }
    setReflecting(false);
  }

  async function gather() {
    setSaving(true);
    setError("");
    try {
      const result = await harvestWeek(week, decisions, note);
      setDone(result);
    } catch (e) {
      console.error("[Harvest] harvestWeek failed:", e);
      setError(
        e?.code === "PGRST205" || e?.code === "42P01" || e?.code === "42703"
          ? "Harvest needs its database migration first. Run the harvest migration, then try again."
          : "Couldn't gather the harvest. Check your connection and try again."
      );
    }
    setSaving(false);
  }

  const shell = children => (
    <div className="min-h-dvh bg-bg flex justify-center font-sans">
      <div className="w-full max-w-[640px] px-5 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <button onClick={() => goBack(navigate)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary mb-6">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back
        </button>
        <div className="text-label uppercase text-gold mb-1">Harvest · {weekRangeLabel(week)}</div>
        {children}
      </div>
    </div>
  );

  if (!loaded) return shell(<div className="text-body text-textSecondary">Gathering your week…</div>);

  if (done) {
    const nextSown = weekIntentions.filter(w => w.week_start === nextWeek).length;
    return shell(
      <>
        <h1 className="font-serif text-hero text-textPrimary mb-2">Harvest gathered.</h1>
        <p className="text-body text-textSecondary mb-6">
          {done.carried > 0
            ? `${done.carried} carried into ${intoWeek()}.`
            : `Nothing carried. ${isSunday() ? "Next week" : "This week"} stays open.`}
          {done.skippedForRoom > 0 && ` ${done.skippedForRoom} didn't fit: ${intoWeek()} already holds three.`}
        </p>
        <div className="space-y-2.5">
          {nextSown < MAX_SOWN && (
            <Button className="w-full" icon={Sprout} onClick={() => navigate("/sow", { replace: true })}>
              {nextSown === 0 ? `Sow ${intoWeek()}` : `Add to ${intoWeek()}`}
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={() => navigate("/journey", { state: { tab: "chapters" } })}>
            See what season you're in
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => goBack(navigate)}>Done</Button>
        </div>
      </>
    );
  }

  if (sown.length === 0) {
    return shell(
      <>
        <h1 className="font-serif text-hero text-textPrimary mb-2">Nothing was sown {which}.</h1>
        <p className="text-body text-textSecondary mb-6">A fallow week is part of growing too. There's nothing to harvest.</p>
        <Button className="w-full" icon={Sprout} onClick={() => navigate("/sow", { replace: true })}>Sow a week</Button>
      </>
    );
  }

  return shell(
    <>
      <h1 className="font-serif text-hero text-textPrimary mb-1">What grew {which}?</h1>
      <p className="text-bodySm text-textSecondary mb-7">
        {harvest ? "Already gathered. You can change anything here." : "A few quiet minutes to look back before the next week begins."}
      </p>

      <section className="mb-7">
        <SectionLabel>Your roots</SectionLabel>
        {roots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {roots.map(r => (
              <span
                key={r.name}
                className="inline-flex items-center gap-1.5 text-bodySm px-3 py-1.5 rounded-full text-textPrimary"
                style={{ background: `color-mix(in srgb, ${PILLAR_COLORS[r.name]} 18%, transparent)` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: PILLAR_COLORS[r.name] }} />
                {r.name} grew <span className="text-textSecondary">+{r.xp}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-bodySm text-textSecondary">A quiet week underground. Roots grow in the dark too.</p>
        )}
        <Link to="/journey" state={{ tab: "tree-stars" }} className="inline-block mt-2 text-caption text-textMuted underline underline-offset-2">
          See your Tree
        </Link>
      </section>

      {(noticed || hasJournalThisWeek) && (
        <section className="mb-7">
          <SectionLabel>Noticed</SectionLabel>
          {noticed ? (
            <div className="rounded-card bg-surface1 shadow-card p-4">
              <p className="font-serif text-h3 italic text-textPrimary whitespace-pre-wrap">{noticed}</p>
              <Link to="/reflections" className="inline-block mt-2 text-caption text-textMuted underline underline-offset-2">Read the full weekly reflection</Link>
            </div>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={Sparkles} onClick={reflect} disabled={reflecting}>
                {reflecting ? "Reading your week…" : `Reflect on ${which}`}
              </Button>
              <p className="text-caption text-textMuted mt-1.5">Uses your journal entries from that week. You'll be asked before anything is sent.</p>
            </>
          )}
          {reflectError && <p className="text-caption text-textSecondary mt-1.5">{reflectError}</p>}
        </section>
      )}

      <section className="mb-7">
        <SectionLabel>What you sowed</SectionLabel>
        <div className="space-y-3">
          {sown.map(({ w, item }) => {
            const { total, done: stepsDone } = stepProgress(item.milestones);
            const choice = decisions[w.id];
            const inNextAlready = nextWeekRows.some(n => n.item_id === w.item_id);
            const carryFull = choice !== "carried" && !inNextAlready && carriedCount >= room;
            return (
              <div key={w.id} className="rounded-card bg-surface1 shadow-card p-4">
                <div className="text-body font-medium text-textPrimary">{item.name}</div>
                <div className="text-caption text-textSecondary mt-0.5">
                  {tendedLabel(w)}
                  {total > 0 && ` · ${stepsDone} of ${total} ${total === 1 ? "step" : "steps"}`}
                  {w.value_name && ` · ${w.value_name}`}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3" role="radiogroup" aria-label={`What to do with ${item.name}`}>
                  {choicesFor().map(c => {
                    const on = choice === c.key;
                    const disabled = c.key === "carried" && carryFull;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => choose(w.id, c.key)}
                        className={`rounded-sm border px-2 py-2 text-left transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                          on ? "border-forestAccent bg-[color-mix(in_srgb,var(--forest-accent)_12%,transparent)]" : "border-borderC hover:border-forestAccent"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-caption font-medium text-textPrimary">
                          <c.icon size={13} strokeWidth={1.75} />
                          {c.label}
                        </span>
                        <span className="block text-label leading-tight text-textMuted mt-0.5">{c.desc}</span>
                      </button>
                    );
                  })}
                </div>
                {choice === "carried" && inNextAlready && (
                  <p className="text-caption text-textMuted mt-2">Already sown for {intoWeek()}.</p>
                )}
                {choice === "released" && (
                  <p className="text-caption text-textSecondary mt-2">
                    Released, with thanks. It has done its work. It moves to Released in your pursuits, and you can bring it back any time.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-caption text-textMuted mt-2">
          Anything you don't choose will rest.
          {nextWeekRows.length > 0 && ` ${isSunday() ? "Next week" : "This week"} already holds ${nextWeekRows.length} of ${MAX_SOWN}.`}
        </p>
      </section>

      <section className="mb-7">
        <SectionLabel>Something to remember</SectionLabel>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="A moment, a lesson, a small win. Optional."
          className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field"
        />
      </section>

      {error && <div className="text-bodySm text-error mb-3">{error}</div>}
      <Button className="w-full" icon={Wheat} onClick={gather} disabled={saving}>
        {saving ? "Gathering…" : harvest ? "Update harvest" : "Gather the harvest"}
      </Button>
    </>
  );
}
