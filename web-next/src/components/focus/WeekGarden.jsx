import { PILLAR_COLORS } from "../../constants/app.const";
import { addDaysKey, WEEKDAY_SHORT } from "../../lib/week";
import { minutesLabel } from "../../lib/focus";
import { GardenBloom, GardenSeed } from "./FocusFlower";

// One week of focus sessions as a strip of soil: a bloom or a resting seed
// for each, on the day it grew. Counts what happened, never what didn't.
export default function WeekGarden({ sessions, weekStart }) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i));
  const mine = sessions.filter(s => s.date_key >= days[0] && s.date_key <= days[6]);
  if (mine.length === 0) return null;

  const blooms = mine.filter(s => s.outcome === "bloom").length;
  const seeds = mine.length - blooms;
  const total = mine.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const byLabel = {};
  mine.forEach(s => { byLabel[s.label] = (byLabel[s.label] || 0) + (s.minutes || 0); });
  const most = Object.entries(byLabel).sort((a, b) => b[1] - a[1])[0];
  const notes = mine.filter(s => s.note);
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  return (
    <div>
      <div className="rounded-card shadow-card px-3 pt-4 pb-3 grid grid-cols-7 gap-1" style={{ background: "linear-gradient(180deg, #0A0A1C 0%, #0E0E26 55%, #2a1d12 100%)" }}>
        {days.map((d, i) => {
          const today = mine.filter(s => s.date_key === d).reverse();
          return (
            <div key={d} className="flex flex-col items-center">
              <svg viewBox="0 0 40 110" className="w-full h-[104px]" role="img"
                aria-label={`${WEEKDAY_SHORT[i]}: ${today.length ? today.map(s => `${s.outcome === "bloom" ? "a bloom" : "a resting seed"}, ${s.label}`).join("; ") : "no sessions"}`}>
                {today.slice(0, 4).map((s, j) => {
                  const y = 106 - j * 28;
                  return s.outcome === "bloom"
                    ? <GardenBloom key={s.id} x={20} y={y} color={PILLAR_COLORS[s.pillar] || "#C9A24D"} scale={1.15} />
                    : <GardenSeed key={s.id} x={20} y={y} scale={1.6} />;
                })}
              </svg>
              <div className="w-full h-1.5 rounded-full" style={{ background: "#3b2a1c" }} />
              <div className="text-caption mt-1" style={{ color: "#B8B5D6" }}>{WEEKDAY_SHORT[i]}</div>
            </div>
          );
        })}
      </div>
      <p className="text-bodySm text-textPrimary mt-2.5">
        {[blooms && count(blooms, "bloom", "blooms"), seeds && count(seeds, "resting seed", "resting seeds")].filter(Boolean).join(" and ")}.
        <span className="text-textSecondary"> {minutesLabel(total)} of focus{most && mine.length > 1 ? `, mostly on ${most[0]}` : ""}.</span>
      </p>
      {notes.length > 0 && (
        <div className="space-y-2 mt-3">
          {notes.map(s => (
            <div key={s.id} className="rounded-sm bg-surface2 border border-borderC px-3.5 py-2.5">
              <div className="font-serif italic text-h3 text-textPrimary">“{s.note}”</div>
              <div className="text-caption text-textMuted mt-0.5">
                {WEEKDAY_SHORT[(new Date(s.date_key + "T00:00:00").getDay() + 6) % 7]} · {s.label} · {s.outcome === "bloom" ? `${minutesLabel(s.minutes)} bloom` : `resting seed, ${minutesLabel(s.minutes)}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
