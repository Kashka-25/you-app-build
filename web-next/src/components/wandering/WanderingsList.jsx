import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe2, MapPin, Plus, ChevronRight, Star, Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { wanderingStatus, wanderingWhenLabel } from "../../lib/wandering";

// Loaded on demand: the map library only downloads when the world opens.
const EverywhereMap = lazy(() => import("./EverywhereMap"));

const GROUPS = [
  { key: "travelling", label: "Travelling now" },
  { key: "planned", label: "Planned" },
  { key: "dreaming", label: "Dreaming" },
  { key: "travelled", label: "Travelled" }
];

// Every Wandering in one place (Pursuits → Wanderings): where you are, what's
// planned, what you're dreaming of, and where you've been, with the whole
// world one tap away. Trips live inside Dreams; a remembered journey can
// also stand on its own.
export default function WanderingsList() {
  const navigate = useNavigate();
  const { wanderings, wanderingStops, items, releasedItems, moments, journalEntries, createWandering } = useAppData();
  const [worldOpen, setWorldOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const allItems = useMemo(() => [...items, ...releasedItems], [items, releasedItems]);

  const cards = useMemo(() => {
    const memories = {};
    [...moments, ...journalEntries].forEach(m => { if (m.stop_id) memories[m.stop_id] = (memories[m.stop_id] || 0) + 1; });
    return wanderings.map(w => {
      const stops = wanderingStops.filter(s => s.wandering_id === w.id).sort((a, b) => a.position - b.position);
      const dream = allItems.find(i => i.id === w.item_id) || null;
      const status = dream?.done ? "travelled" : wanderingStatus(stops);
      const start = stops.map(s => s.arrive).filter(Boolean).sort()[0] || "";
      return {
        w, stops, dream, status, start,
        when: wanderingWhenLabel(stops),
        memoryCount: stops.reduce((n, s) => n + (memories[s.id] || 0), 0)
      };
    });
  }, [wanderings, wanderingStops, allItems, moments, journalEntries]);

  // Dreams that could become a Wandering: unfinished ones without one yet,
  // travel dreams first.
  const candidates = items
    .filter(i => i.type === "dream" && !i.done && !wanderings.some(w => w.item_id === i.id))
    .sort((a, b) => (b.subcat === "Travel") - (a.subcat === "Travel") || a.name.localeCompare(b.name));

  async function plan(item) {
    setBusy(item.id);
    setError("");
    try {
      const w = await createWandering(item);
      navigate(`/wandering/${w.id}`);
    } catch (e) {
      console.error("[WanderingsList] createWandering failed:", e);
      setError("Couldn't start that wandering. Check your connection and try again.");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <button
          onClick={() => setWorldOpen(true)}
          className="flex items-center gap-2 rounded-card p-3.5 text-left shadow-card"
          style={{ background: "linear-gradient(135deg, #0b1220, #13201f)" }}
        >
          <Globe2 size={20} strokeWidth={1.75} className="text-gold flex-none" />
          <span className="text-bodySm text-cream leading-tight">Everywhere you've been</span>
        </button>
        <button
          onClick={() => setPicking(!picking)}
          aria-expanded={picking}
          className="flex items-center gap-2 rounded-card p-3.5 text-left bg-surface1 shadow-card"
        >
          <Plus size={20} strokeWidth={1.75} className="text-forestAccent flex-none" />
          <span className="text-bodySm text-textPrimary leading-tight">Plan a wandering</span>
        </button>
      </div>

      {picking && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
          <div className="text-label uppercase text-textMuted mb-2">Which dream takes you somewhere?</div>
          {candidates.length === 0 ? (
            <p className="text-bodySm text-textSecondary">Every unfinished dream already has a wandering. Add a new dream with + to plan another.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto -mx-1">
              {candidates.map(i => (
                <button
                  key={i.id}
                  onClick={() => plan(i)}
                  disabled={busy !== null}
                  className="w-full flex items-center gap-2.5 px-1 py-2 text-left rounded-sm hover:bg-surface3 disabled:opacity-60"
                >
                  <Star size={14} strokeWidth={1.75} className="text-gold flex-none" />
                  <span className="flex-1 min-w-0 text-body text-textPrimary">{i.name}</span>
                  {busy === i.id ? <span className="text-caption text-textMuted">Unfolding…</span> : i.subcat === "Travel" && <span className="text-caption text-textMuted">Travel</span>}
                </button>
              ))}
            </div>
          )}
          {error && <div className="text-caption text-error mt-2">{error}</div>}
        </div>
      )}

      {cards.length === 0 && (
        <p className="text-bodySm text-textSecondary">No wanderings yet. Plan one from a dream that takes you somewhere.</p>
      )}

      {GROUPS.map(g => {
        const list = cards
          .filter(c => c.status === g.key)
          .sort((a, b) => (g.key === "travelled" ? (b.start > a.start ? 1 : -1) : a.start > b.start ? 1 : -1));
        if (!list.length) return null;
        return (
          <section key={g.key} className="mb-5">
            <div className="text-label uppercase text-textMuted mb-2">{g.label} · {list.length}</div>
            <div className="space-y-2.5">
              {list.map(({ w, stops, dream, when, memoryCount }) => (
                <button
                  key={w.id}
                  onClick={() => navigate(`/wandering/${w.id}`)}
                  className="w-full flex items-start gap-3 rounded-card bg-surface1 shadow-card p-3.5 text-left"
                >
                  <MapPin size={17} strokeWidth={1.75} className={`flex-none mt-0.5 ${g.key === "travelling" ? "text-gold" : "text-forestAccent"}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-serif text-h3 text-textPrimary">{w.title}</span>
                    {/* Skip the places line when it would just repeat the title ("Japan"). */}
                    {!(stops.length === 1 && stops[0].place_name === w.title) && (
                      <span className="block text-caption text-textSecondary truncate">
                        {stops.length ? stops.map(s => s.place_name).join(" · ") : "No stops yet"}
                      </span>
                    )}
                    <span className="block text-caption text-textMuted mt-0.5">
                      {[when, memoryCount ? `${memoryCount} ${memoryCount === 1 ? "memory" : "memories"}` : null, dream ? null : "A journey of its own"].filter(Boolean).join(" · ")}
                    </span>
                    {/* Dates behind you, dream not yet marked: a quiet nudge. */}
                    {dream && !dream.done && g.key === "travelled" && (
                      <span className="block text-caption text-gold mt-0.5">Ready to mark this dream lived</span>
                    )}
                  </span>
                  {memoryCount > 0 && <Sparkles size={14} strokeWidth={1.75} className="text-gold flex-none mt-1" aria-hidden="true" />}
                  <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted flex-none mt-1" />
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {worldOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[70]" style={{ background: "#07071A" }} />}>
          <EverywhereMap onClose={() => setWorldOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
