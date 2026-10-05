import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { stopsCoveringDate } from "../../lib/wandering";

// "Where was this?" for a memory or journal entry. Appears only when a
// Wandering stop covers the chosen date (or the memory is already pinned),
// so everyday entries never see it. For a new memory written while
// travelling, the place you're at is chosen for you — one tap to change.
// value: stop id or null. onChange(stopIdOrNull).
export default function PlacePicker({ dateKey, value, onChange, autoSelect = false }) {
  const { wanderingStops, wanderings } = useAppData();
  const touched = useRef(false);
  const covering = stopsCoveringDate(wanderingStops, dateKey);
  const current = value ? wanderingStops.find(s => s.id === value) : null;
  const options = current && !covering.some(s => s.id === current.id) ? [current, ...covering] : covering;

  // Auto-pin new memories to where you are (until the Seeker chooses).
  useEffect(() => {
    if (!autoSelect || touched.current) return;
    const best = covering[0]?.id || null;
    if (best !== value) onChange(best);
  }, [autoSelect, dateKey, covering.map(s => s.id).join()]);

  if (options.length === 0) return null;

  function choose(id) {
    touched.current = true;
    onChange(id);
  }

  const titleOf = s => wanderings.find(w => w.id === s.wandering_id)?.title;

  return (
    <div className="mb-3">
      <span className="block text-label uppercase text-textMuted mb-1.5">Where was this?</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Where was this?">
        {options.map(s => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={value === s.id}
            onClick={() => choose(s.id)}
            className={`inline-flex items-center gap-1 text-caption px-2.5 py-1 rounded-full border ${
              value === s.id ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"
            }`}
          >
            <MapPin size={12} strokeWidth={1.75} />
            {s.place_name}
            {titleOf(s) && <span className="opacity-75">· {titleOf(s)}</span>}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          onClick={() => choose(null)}
          className={`text-caption px-2.5 py-1 rounded-full border ${
            !value ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"
          }`}
        >
          Not pinned
        </button>
      </div>
    </div>
  );
}

// The place a memory is pinned to, as a small tag ("Kyoto"). Renders
// nothing for unpinned memories.
export function PlaceTag({ stopId, className = "" }) {
  const { wanderingStops } = useAppData();
  const stop = stopId && wanderingStops.find(s => s.id === stopId);
  if (!stop) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-caption text-forestAccent ${className}`}>
      <MapPin size={12} strokeWidth={1.75} />
      {stop.place_name}
    </span>
  );
}
