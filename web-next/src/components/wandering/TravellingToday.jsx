import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { localDateKey } from "../../lib/week";
import { stopForToday, niceDay } from "../../lib/wandering";
import { StepList } from "../ui/StepList";

// While a Wandering is underway, the Threshold opens on where the Seeker is
// today: the stop, which day of it, that day's plans, and what's next.
// "Today" is the device's local date, so it follows them across timezones.
export default function TravellingToday() {
  const { wanderings, wanderingStops, setStopDayPlan } = useAppData();
  const [error, setError] = useState("");
  const today = localDateKey();

  const byWandering = useMemo(() => {
    const map = {};
    wanderingStops.forEach(s => { (map[s.wandering_id] = map[s.wandering_id] || []).push(s); });
    return map;
  }, [wanderingStops]);

  const here = stopForToday(wanderings, byWandering, today);
  if (!here) return null;
  const { wandering, stop, dayNumber, dayCount, next } = here;
  const plans = (stop.day_plans || {})[today] || [];

  const save = steps => setStopDayPlan(stop.id, today, steps).catch(e => {
    console.error("[TravellingToday] save failed:", e);
    setError("Couldn't save that. Check your connection.");
    throw e;
  });

  return (
    <section>
      <div className="rounded-card bg-surface1 shadow-card p-4">
        <Link to={`/wandering/${wandering.id}`} className="flex items-start gap-2.5">
          <MapPin size={18} strokeWidth={1.75} className="text-gold flex-none mt-0.5" />
          <span className="flex-1 min-w-0">
            <span className="block font-serif text-h2 text-textPrimary">Today in {stop.place_name}</span>
            <span className="block text-caption text-textSecondary">
              Day {dayNumber} of {dayCount} · {wandering.title}
            </span>
          </span>
          <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none mt-1" />
        </Link>
        <div className="mt-3 pl-7">
          <StepList
            steps={plans}
            placeholder="Add something for today here"
            onAdd={text => save([...plans, { text, done: false }])}
            onToggle={i => save(plans.map((s, j) => (j === i ? { ...s, done: !s.done } : s))).catch(() => {})}
            onRemove={i => save(plans.filter((_, j) => j !== i)).catch(() => {})}
          />
          {error && <div className="text-caption text-error mt-1">{error}</div>}
          <div className="text-caption text-textMuted mt-2">
            {next ? `Next: ${next.place_name} on ${niceDay(next.arrive)}` : "The last stop of this wandering."}
          </div>
        </div>
      </div>
    </section>
  );
}
