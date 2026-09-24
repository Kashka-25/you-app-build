import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";

const SECTION_LABELS = [
  ["your_week", "Your week"],
  ["what_mattered", "What mattered"],
  ["accomplished", "What you accomplished"],
  ["challenged", "What challenged you"],
  ["learned", "What you learned"],
  ["patterns", "Patterns that appeared"],
  ["moving_toward", "What you're moving toward"],
  ["question_for_next_week", "A question for next week"],
  ["suggested_focus", "One suggested focus"]
];

function toDateKey(d) {
  return d.toISOString().split("T")[0];
}

// Monday of the week containing `d` — same rule the weekly-reflection Edge
// Function uses server-side, kept in sync deliberately so the week the user
// sees here is always the week that gets generated.
function startOfWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function niceRange(weekStart) {
  const start = new Date(weekStart + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function WeeklyReflectionView() {
  const { weeklyReflections, journalEntries, loadWeeklyReflection, generateWeeklyReflection } = useAppData();
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek(new Date())));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");
  const [checkedWeeks, setCheckedWeeks] = useState({});

  const reflection = weeklyReflections[weekStart];
  const isCurrentWeek = weekStart === toDateKey(startOfWeek(new Date()));
  const hasEntriesThisWeek = journalEntries.some(e => {
    const entryWeekStart = toDateKey(startOfWeek(new Date(e.entry_date + "T00:00:00Z")));
    return entryWeekStart === weekStart;
  });

  useEffect(() => {
    setEmptyMessage("");
    if (checkedWeeks[weekStart]) return;
    setCheckedWeeks(prev => ({ ...prev, [weekStart]: true }));
    loadWeeklyReflection(weekStart).catch(e => console.error("[WeeklyReflectionView] load failed:", e));
  }, [weekStart, checkedWeeks, loadWeeklyReflection]);

  function shiftWeek(days) {
    const next = new Date(weekStart + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + days);
    setWeekStart(toDateKey(next));
  }

  async function generate() {
    setLoading(true);
    setError("");
    setEmptyMessage("");
    try {
      const result = await generateWeeklyReflection(weekStart);
      if (result.empty) setEmptyMessage(result.message);
    } catch (e) {
      console.error("[WeeklyReflectionView] generate failed:", e);
      setError("Couldn't build this week's reflection — check the Edge Function is deployed and try again.");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftWeek(-7)} aria-label="Previous week" className="p-1 text-textMuted hover:text-textPrimary">
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
        <div className="text-bodySm text-textSecondary">{niceRange(weekStart)}</div>
        <button
          onClick={() => shiftWeek(7)}
          disabled={isCurrentWeek}
          aria-label="Next week"
          className="p-1 text-textMuted hover:text-textPrimary disabled:opacity-30"
        >
          <ChevronRight size={18} strokeWidth={1.75} />
        </button>
      </div>

      {!hasEntriesThisWeek && !reflection && (
        <div className="text-bodySm text-textMuted rounded-card border border-dashed border-borderC bg-surface1 p-4 mb-4">
          No journal entries for this week yet.
        </div>
      )}

      {reflection ? (
        <div className="rounded-card bg-surface1 shadow-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <GlowBubble icon={Sparkles} size={36} />
            <div className="text-label uppercase text-gold">Weekly reflection</div>
          </div>
          {SECTION_LABELS.map(([key, label]) =>
            reflection.sections?.[key] ? (
              <div key={key} className="mb-3 last:mb-0">
                <div className="text-label uppercase text-gold mb-1">{label}</div>
                <div className="text-bodySm text-textPrimary whitespace-pre-wrap">{reflection.sections[key]}</div>
              </div>
            ) : null
          )}
          <button onClick={generate} disabled={loading} className="text-caption text-textMuted hover:text-textPrimary mt-2">
            {loading ? "Regenerating…" : "Regenerate this week's reflection"}
          </button>
        </div>
      ) : (
        hasEntriesThisWeek && (
          <Button variant="secondary" icon={Sparkles} onClick={generate} disabled={loading}>
            {loading ? "Reading your week…" : "Reflect on this week"}
          </Button>
        )
      )}

      {emptyMessage && <div className="text-bodySm text-textMuted mt-2">{emptyMessage}</div>}
      {error && <div className="text-bodySm text-red-500 mt-2">{error}</div>}
    </div>
  );
}
