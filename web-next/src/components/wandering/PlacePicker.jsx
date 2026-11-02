import { useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Plus } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { currentPosition, reversePlace, stopsCoveringDate } from "../../lib/wandering";
import PlaceSearch from "./PlaceSearch";

// "Where was this?" for a memory or journal entry, always offered (Cassidy,
// Nov 2). The places of a trip covering the date come first (and a new
// memory written while travelling is pinned to where you are), then places
// you've saved lately, then "Add a place": where you are now, or a search,
// which saves it under Places I've been. Tap a chosen place to unpin.
// value: stop id or null. onChange(stopIdOrNull).
export default function PlacePicker({ dateKey, value, onChange, autoSelect = false }) {
  const { wanderingStops, wanderings, addOwnPlace } = useAppData();
  const touched = useRef(false);
  const [adding, setAdding] = useState(false);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState("");
  const covering = stopsCoveringDate(wanderingStops, dateKey);
  const current = value ? wanderingStops.find(s => s.id === value) : null;
  // Places of your own saved lately, so the same spot is one tap away.
  const own = new Set(wanderings.filter(w => !w.item_id && w.title === "Places I've been").map(w => w.id));
  const recent = wanderingStops
    .filter(s => own.has(s.wandering_id) && !covering.some(c => c.id === s.id))
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .filter((s, i, a) => a.findIndex(x => x.place_name === s.place_name) === i)
    .slice(0, 4);
  const options = [...(current && !covering.some(s => s.id === current.id) && !recent.some(s => s.id === current.id) ? [current] : []), ...covering, ...recent];

  // Auto-pin new memories to where you are on a trip (until the Seeker chooses).
  useEffect(() => {
    if (!autoSelect || touched.current) return;
    const best = covering[0]?.id || null;
    if (best !== value) onChange(best);
  }, [autoSelect, dateKey, covering.map(s => s.id).join()]);

  function choose(id) {
    touched.current = true;
    onChange(id);
  }

  async function pinPlace(place) {
    setError("");
    const stop = await addOwnPlace(place, dateKey);
    choose(stop.id);
    setAdding(false);
  }

  async function here() {
    setFinding(true);
    setError("");
    try {
      const { lat, lng } = await currentPosition();
      await pinPlace(await reversePlace(lat, lng));
    } catch (e) {
      setError(e.message || "Couldn't find where you are just now.");
    }
    setFinding(false);
  }

  const titleOf = s => {
    const w = wanderings.find(x => x.id === s.wandering_id);
    return w && w.title !== "Places I've been" ? w.title : null;
  };
  const chip = on => `inline-flex items-center gap-1 text-caption px-2.5 min-h-[32px] rounded-full border ${
    on ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"
  }`;

  return (
    <div className="mb-3">
      <span className="block text-label uppercase text-textMuted mb-1.5">Where was this? (optional)</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Where was this?">
        {options.map(s => (
          <button key={s.id} type="button" role="radio" aria-checked={value === s.id} onClick={() => choose(value === s.id ? null : s.id)} className={chip(value === s.id)}>
            <MapPin size={12} strokeWidth={1.75} />
            {s.place_name}
            {titleOf(s) && <span className="opacity-75">· {titleOf(s)}</span>}
          </button>
        ))}
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-caption px-2.5 min-h-[32px] rounded-full border border-dashed border-gold/70 text-textSecondary">
            <Plus size={12} strokeWidth={2} /> {options.length ? "Another place" : "Add a place"}
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 rounded-sm border border-borderC bg-surface1 p-2.5">
          <button
            type="button"
            onClick={here}
            disabled={finding}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[40px] mb-2 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium disabled:opacity-60"
          >
            {finding ? <Loader2 size={15} className="animate-spin" /> : <Crosshair size={15} strokeWidth={1.75} />}
            {finding ? "Finding you…" : "Where I am now"}
          </button>
          <PlaceSearch placeholder="Or search for the place" onPick={pinPlace} />
          {error && <div className="text-caption text-error mt-1.5" role="alert">{error}</div>}
          <button type="button" onClick={() => setAdding(false)} className="mt-1 text-caption text-textMuted min-h-[32px]">Cancel</button>
        </div>
      )}
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
