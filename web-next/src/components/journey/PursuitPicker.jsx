import { Check } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pillarColor } from "../ui/Pillar";

const TYPE = { habit: "Habit", goal: "Goal", dream: "Dream", idea: "Idea" };

// Choose the pursuits that are votes for a vision (Nov 4). Growing ones
// only; those in the vision's own life area come first. `tone="night"`
// for the dark future-self journey.
export default function PursuitPicker({ value, onChange, pillar, tone = "day" }) {
  const { items } = useAppData();
  const night = tone === "night";
  const growing = items
    .filter(i => !i.done && !String(i.id).startsWith("temp_"))
    .sort((a, b) => (a.cat === pillar) === (b.cat === pillar) ? a.name.localeCompare(b.name) : a.cat === pillar ? -1 : 1);

  if (growing.length === 0) {
    return <p className={`text-bodySm m-0 ${night ? "text-white/75" : "text-textMuted"}`}>Nothing growing in PursYOUts yet.</p>;
  }

  function toggle(id) {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  }

  return (
    <div role="group" aria-label="Pursuits that grow this vision" className="flex flex-col gap-1.5">
      {growing.map(item => {
        const on = value.includes(item.id);
        const color = pillarColor(item.cat);
        return (
          <button
            key={item.id}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(item.id)}
            className={`flex items-center gap-3 min-h-[48px] px-3 rounded-sm border text-left transition-colors ${
              night
                ? on ? "bg-white/20 border-white/60" : "bg-white/5 border-white/15 hover:bg-white/10"
                : on ? "bg-surface1 font-medium" : "bg-surface1 border-borderC"
            }`}
            style={!night && on ? { borderColor: color } : undefined}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: color }} aria-hidden="true" />
            <span className="flex-1 min-w-0">
              <span className={`block text-bodySm truncate ${night ? "text-white" : "text-textPrimary"}`}>{item.name}</span>
              <span className={`block text-caption ${night ? "text-white/65" : "text-textMuted"}`}>{TYPE[item.type] || item.type} · {item.cat}</span>
            </span>
            <span
              className={`w-6 h-6 rounded-full flex-none inline-flex items-center justify-center border ${on ? "border-transparent" : night ? "border-white/40" : "border-borderC"}`}
              style={on ? { background: color } : undefined}
              aria-hidden="true"
            >
              {on && <Check size={14} strokeWidth={2.5} className="text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
