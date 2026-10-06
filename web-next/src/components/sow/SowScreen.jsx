import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Target, Flame, Sprout, ChevronDown, ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS, PILLAR_COLORS, VALUE_PILLAR, VALUE_PILLAR2 } from "../../constants/app.const";
import { sowWeekStartKey, weekStartKey, weekRangeLabel, WEEKDAY_SHORT, markWeekRested, goBack } from "../../lib/week";
import { Button } from "../ui/Button";

const MAX_SOWN = 3;
const TYPE_LABEL = { habit: "Habit", goal: "Goal", dream: "Dream" };
const TYPE_ICON = { habit: Flame, goal: Target, dream: Star };
// Within a Pillar, the most week-sized things first.
const TYPE_ORDER = { habit: 0, goal: 1, dream: 2 };

// Active values ordered so the ones that draw from this item's Pillar come
// first; tapping the chip cycles through all of them, then "no value".
function valueOptionsFor(item, activeValues) {
  const names = activeValues.map(v => v.name);
  const matching = names.filter(n => VALUE_PILLAR[n] === item.cat || VALUE_PILLAR2[n] === item.cat);
  return [...matching, ...names.filter(n => !matching.includes(n))];
}

// Only default to a value that genuinely draws from this Pillar — never
// guess an unrelated one (a Play dream shouldn't claim to serve Family).
function defaultValueFor(item, activeValues) {
  const match = activeValues.find(v => VALUE_PILLAR[v.name] === item.cat || VALUE_PILLAR2[v.name] === item.cat);
  return match ? match.name : null;
}

function Chip({ on, onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`text-caption px-2.5 py-1 rounded-full border transition-colors duration-150 ${
        on ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary hover:border-forestAccent"
      }`}
    >
      {children}
    </button>
  );
}

// Sow — the weekly ritual. Pick up to three existing pursuits to grow this
// week, place them loosely on days, see the Value each one serves. Its own
// full-screen layer (like the Threshold), not a modal: it's a moment, not
// a form.
export default function SowScreen() {
  const navigate = useNavigate();
  const { items, activeValues, weekIntentions, sowWeek, loaded } = useAppData();
  const weekStart = sowWeekStartKey();
  const isNextWeek = weekStart !== weekStartKey();

  // picks: { [itemId]: { days: number[], valueName: string|null } }
  const [picks, setPicks] = useState({});
  const [seeded, setSeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const candidates = useMemo(() => items.filter(i => !i.done && !String(i.id).startsWith("temp_")), [items]);

  // Grouped by Pillar (in the Pillars' own order) so a long list of
  // pursuits reads as eight short ones. Groups start collapsed — except any
  // already holding this week's picks — to keep choices few at once.
  const groups = useMemo(() => {
    const groupOf = i => i.cat || "Other";
    const names = [...PILLARS, ...new Set(candidates.map(groupOf).filter(c => !PILLARS.includes(c)))];
    return names
      .map(name => ({
        name,
        items: candidates
          .filter(i => groupOf(i) === name)
          .sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3))
      }))
      .filter(g => g.items.length > 0);
  }, [candidates]);
  const [openGroups, setOpenGroups] = useState(() => new Set());

  function toggleGroup(name) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Re-opening Sow edits this week's sowing rather than starting blank.
  useEffect(() => {
    if (!loaded || seeded) return;
    const existing = weekIntentions.filter(w => w.week_start === weekStart);
    setPicks(Object.fromEntries(existing.map(w => [w.item_id, { days: w.days || [], valueName: w.value_name }])));
    setOpenGroups(new Set(existing.map(w => items.find(i => i.id === w.item_id)).filter(Boolean).map(i => i.cat || "Other")));
    setSeeded(true);
  }, [loaded, seeded, weekIntentions, weekStart, items]);

  const count = Object.keys(picks).length;

  function togglePick(item) {
    setError("");
    setPicks(prev => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      if (Object.keys(prev).length >= MAX_SOWN) return prev;
      return { ...prev, [item.id]: { days: [], valueName: defaultValueFor(item, activeValues) } };
    });
  }

  function toggleDay(itemId, d) {
    setPicks(prev => {
      const days = prev[itemId].days.includes(d) ? prev[itemId].days.filter(x => x !== d) : [...prev[itemId].days, d];
      return { ...prev, [itemId]: { ...prev[itemId], days } };
    });
  }

  function setAnyDay(itemId) {
    setPicks(prev => ({ ...prev, [itemId]: { ...prev[itemId], days: [] } }));
  }

  function cycleValue(item) {
    const options = [...valueOptionsFor(item, activeValues), null];
    setPicks(prev => {
      const idx = options.indexOf(prev[item.id].valueName);
      return { ...prev, [item.id]: { ...prev[item.id], valueName: options[(idx + 1) % options.length] } };
    });
  }

  async function plant() {
    setSaving(true);
    setError("");
    try {
      await sowWeek(weekStart, Object.entries(picks).map(([itemId, p]) => ({ itemId, days: p.days, valueName: p.valueName })));
      markWeekRested(weekStart, count === 0);
      goBack(navigate);
    } catch (e) {
      console.error("[Sow] sowWeek failed:", e);
      setError(
        e?.code === "PGRST205" || e?.code === "42P01"
          ? "The week_intentions table doesn't exist yet. Run the week-intentions migration, then try again."
          : "Couldn't save your week. Check your connection and try again."
      );
      setSaving(false);
    }
  }

  function renderItem(item) {
    const pick = picks[item.id];
    const Icon = TYPE_ICON[item.type] || Flame;
    const full = !pick && count >= MAX_SOWN;
    return (
      <div
        key={item.id}
        className={`rounded-card p-4 transition-colors duration-150 ${
          pick ? "bg-surface1 shadow-card ring-1 ring-forestAccent" : "bg-surface1 border border-borderC"
        } ${full ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          onClick={() => togglePick(item)}
          aria-pressed={Boolean(pick)}
          disabled={full}
          className="w-full flex items-start gap-3 text-left disabled:cursor-not-allowed"
        >
          <span
            className="w-8 h-8 flex-none rounded-full flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${PILLAR_COLORS[item.cat] || "var(--sage)"} 20%, transparent)` }}
          >
            <Icon size={15} strokeWidth={1.75} style={{ color: PILLAR_COLORS[item.cat] }} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-body font-medium text-textPrimary">{item.name}</span>
            <span className="block text-caption text-textSecondary">
              {TYPE_LABEL[item.type]} · {item.cat}
            </span>
          </span>
          {pick && <Sprout size={18} strokeWidth={1.75} className="text-forestAccent flex-none" />}
        </button>

        {pick && (
          <div className="mt-3 pl-11">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_SHORT.map((d, i) => (
                <Chip key={d} on={pick.days.includes(i)} onClick={() => toggleDay(item.id, i)}>{d}</Chip>
              ))}
              <Chip on={pick.days.length === 0} onClick={() => setAnyDay(item.id)} label="Sometime this week">Any day</Chip>
            </div>
            <button
              type="button"
              onClick={() => cycleValue(item)}
              className="mt-2.5 text-caption text-textSecondary"
            >
              Serves{" "}
              <span className="px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-textPrimary">
                {pick.valueName || "no value yet"}
              </span>
              <span className="text-textMuted"> · tap to change</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex justify-center font-sans">
      <div className="w-full max-w-[640px] px-5 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <button onClick={() => goBack(navigate)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary mb-6">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back
        </button>

        <div className="text-label uppercase text-gold mb-1">
          Sow · {isNextWeek ? "next week" : "this week"} · {weekRangeLabel(weekStart)}
        </div>
        <h1 className="font-serif text-hero text-textPrimary mb-1">What do you want to plant {isNextWeek ? "next week" : "this week"}?</h1>
        <p className="text-bodySm text-textSecondary mb-6">Pick up to three. Resting is allowed too.</p>

        {!loaded && <div className="text-body text-textSecondary">Gathering your pursuits…</div>}

        {loaded && candidates.length === 0 && (
          <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textSecondary">
            Nothing planted yet. Add a habit, goal or dream first, and it'll appear here to sow.
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => navigate("/pursue")}>Go to Pursue</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {groups.map(group => {
            const open = openGroups.has(group.name);
            const sownHere = group.items.filter(i => picks[i.id]).length;
            return (
              <section key={group.name}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.name)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-2.5 py-2 text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: PILLAR_COLORS[group.name] || "var(--sage)" }} />
                  <span className="font-serif text-h3 text-textPrimary">{group.name}</span>
                  <span className="text-caption text-textMuted">{group.items.length}</span>
                  {sownHere > 0 && (
                    <span className="inline-flex items-center gap-1 text-caption text-forestAccent">
                      <Sprout size={12} strokeWidth={1.75} />
                      {sownHere} sown
                    </span>
                  )}
                  <span className="flex-1" />
                  {open
                    ? <ChevronDown size={16} strokeWidth={1.75} className="text-textMuted" />
                    : <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" />}
                </button>
                {open && <div className="space-y-2.5 mt-1">{group.items.map(renderItem)}</div>}
              </section>
            );
          })}
        </div>

        {loaded && candidates.length > 0 && (
          <div className="mt-6">
            <div className="text-caption text-textSecondary mb-3">
              {count === 0 ? "Nothing sown. That's a choice too." : `${count} of ${MAX_SOWN} sown`}
            </div>
            {error && <div className="text-bodySm text-error mb-3">{error}</div>}
            <Button className="w-full" variant={count === 0 ? "secondary" : "primary"} onClick={plant} disabled={saving}>
              {saving ? "Planting…" : count === 0 ? "Rest this week" : "Plant this week"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
