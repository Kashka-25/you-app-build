import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, Pencil, Check, X, Star, Sparkles } from "lucide-react";
import { useAppData, TRAVEL_MEMORY_XP } from "../../lib/AppDataContext";
import { XP_VALS } from "../../constants/app.const";
import { goBack } from "../../lib/week";
import {
  stopDays, stopDateLabel, niceDay, wanderingStatus, wanderingWhenLabel, wanderingRange, isExact
} from "../../lib/wandering";
import { StepList } from "../ui/StepList";
import { Button } from "../ui/Button";
import WanderingMap from "./WanderingMap";
import PlaceSearch from "./PlaceSearch";
import StopMemories from "./StopMemories";

const STATUS_LABEL = { dreaming: "Dreaming", planned: "Planned", travelling: "Travelling", travelled: "Travelled" };
const KINDS = [
  { key: "stay", label: "Stay" },
  { key: "visit", label: "Visit" },
  { key: "transit", label: "Passing through" }
];

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 text-bodySm text-textPrimary outline-none focus:border-forestAccent shadow-field";
const labelClass = "block text-label uppercase text-textMuted mb-1";

// Everything about one stop, opened by tapping it: dates, kind, a note,
// what each day there holds, and reorder/remove.
function StopDetail({ stop, isFirst, isLast }) {
  const { updateWanderingStop, removeWanderingStop, moveWanderingStop, setStopDayPlan } = useAppData();
  const [note, setNote] = useState(stop.note || "");
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);

  async function save(updates) {
    setError("");
    try {
      await updateWanderingStop(stop.id, updates);
    } catch (e) {
      console.error("[Wandering] stop update failed:", e);
      setError("Couldn't save that. Check your connection and try again.");
    }
  }

  function setDate(field, value) {
    const next = { arrive: stop.arrive, depart: stop.depart, [field]: value || null };
    if (next.arrive && next.depart && next.depart < next.arrive) {
      setError("Leaving can't be before arriving.");
      return;
    }
    // Choosing a real date makes the stop exact.
    save({ [field]: value || null, date_precision: "day" });
  }

  const days = stopDays(stop);

  return (
    <div className="mt-3 pt-3 border-t border-borderC space-y-3">
      {!isExact(stop) && stop.arrive && (
        <p className="text-caption text-textSecondary">
          Remembered as <span className="text-textPrimary">{stopDateLabel(stop)}</span>. Set exact dates below if you know them.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className={labelClass} htmlFor={`arrive-${stop.id}`}>Arrive</label>
          <input id={`arrive-${stop.id}`} type="date" className={fieldClass} value={isExact(stop) ? stop.arrive || "" : ""} onChange={e => setDate("arrive", e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor={`depart-${stop.id}`}>Leave</label>
          <input id={`depart-${stop.id}`} type="date" className={fieldClass} value={isExact(stop) ? stop.depart || "" : ""} min={isExact(stop) ? stop.arrive || undefined : undefined} onChange={e => setDate("depart", e.target.value)} />
        </div>
      </div>

      <div>
        <span className={labelClass}>Kind of stop</span>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map(k => (
            <button
              key={k.key}
              type="button"
              aria-pressed={stop.kind === k.key}
              onClick={() => save({ kind: k.key })}
              className={`text-caption px-2.5 py-1 rounded-full border ${
                stop.kind === k.key ? "bg-forestAccent border-forestAccent text-onAccent" : "border-borderC text-textSecondary"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`note-${stop.id}`}>Note</label>
        <textarea
          id={`note-${stop.id}`}
          rows={2}
          className={fieldClass}
          value={note}
          placeholder="Why here? What do you hope to find?"
          onChange={e => setNote(e.target.value)}
          onBlur={() => note !== (stop.note || "") && save({ note: note.trim() || null })}
        />
      </div>

      {days.length > 0 && (
        <div>
          <button type="button" onClick={() => setDaysOpen(!daysOpen)} aria-expanded={daysOpen} className="text-caption text-forestAccent font-medium">
            {daysOpen ? "Hide the days" : `Plan the days (${days.length})`}
          </button>
          {daysOpen && (
            <div className="mt-2 space-y-3">
              {days.map((d, i) => (
                <div key={d}>
                  <div className="text-caption text-textSecondary mb-1">Day {i + 1} · {niceDay(d)}</div>
                  <StepList
                    steps={(stop.day_plans || {})[d] || []}
                    placeholder="Add something for this day"
                    onAdd={text => setStopDayPlan(stop.id, d, [...((stop.day_plans || {})[d] || []), { text, done: false }])}
                    onToggle={si => setStopDayPlan(stop.id, d, ((stop.day_plans || {})[d] || []).map((s, j) => (j === si ? { ...s, done: !s.done } : s))).catch(() => setError("Couldn't save that."))}
                    onRemove={si => setStopDayPlan(stop.id, d, ((stop.day_plans || {})[d] || []).filter((_, j) => j !== si)).catch(() => setError("Couldn't save that."))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <StopMemories stop={stop} />

      {error && <div className="text-caption text-error">{error}</div>}

      <div className="flex items-center gap-2 pt-1">
        <button type="button" disabled={isFirst} onClick={() => moveWanderingStop(stop.id, -1)} className="inline-flex items-center gap-1 text-caption text-textSecondary disabled:opacity-30">
          <ArrowUp size={13} strokeWidth={1.75} /> Earlier
        </button>
        <button type="button" disabled={isLast} onClick={() => moveWanderingStop(stop.id, 1)} className="inline-flex items-center gap-1 text-caption text-textSecondary disabled:opacity-30">
          <ArrowDown size={13} strokeWidth={1.75} /> Later
        </button>
        <span className="flex-1" />
        {confirmRemove ? (
          <span className="text-caption text-textSecondary">
            Remove {stop.place_name}?{" "}
            <button type="button" onClick={() => removeWanderingStop(stop.id).catch(() => setError("Couldn't remove that stop."))} className="text-error font-medium">Remove</button>
            {" · "}
            <button type="button" onClick={() => setConfirmRemove(false)} className="text-textPrimary">Keep</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmRemove(true)} className="text-caption text-textMuted">Remove stop</button>
        )}
      </div>
    </div>
  );
}

// Once a Wandering's dates are behind you, its Dream can be marked lived:
// the usual dream XP, dated to when the journey began (the same date the
// Mirror and Legacy count it in), with an optional line about what it gave.
function MarkLivedCard({ dream, stops, onLived }) {
  const { completeItem } = useAppData();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const start = wanderingRange(stops)?.start;
  const exact = stops.filter(s => s.arrive).every(isExact);
  const whenLabel = start
    ? exact ? niceDay(start, { day: "numeric", month: "long", year: "numeric" }) : niceDay(start, { month: "long", year: "numeric" })
    : null;

  async function markLived() {
    setSaving(true);
    setError("");
    try {
      await completeItem(dream.id, note.trim(), start);
      onLived();
    } catch (e) {
      console.error("[Wandering] mark lived failed:", e);
      setError("Couldn't mark it lived. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-card bg-surface1 border border-gold p-3.5 mt-3">
      <div className="text-bodySm text-textPrimary">You went. Is "{dream.name}" a dream lived?</div>
      <div className="text-caption text-textSecondary mt-0.5">
        Marking it lived gives {XP_VALS.dream} XP to {dream.cat}{whenLabel ? `, dated ${whenLabel}, when you set off` : ""}.
      </div>
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="What did it give you? (optional)"
        aria-label="What did it give you? (optional)"
        maxLength={280}
        className={`${fieldClass} mt-2.5 placeholder:text-textMuted`}
      />
      <Button variant="secondary" size="sm" className="mt-2.5" icon={Star} disabled={saving} onClick={markLived}>
        {saving ? "Marking it lived…" : "Mark it lived"}
      </Button>
      {error && <div className="text-caption text-error mt-1.5">{error}</div>}
    </div>
  );
}

// A Wandering: a Dream's travel plan made visible — the route on a map, the
// stops as a timeline, and what each day holds.
export default function WanderingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loaded, wanderings, wanderingStops, items, releasedItems, renameWandering, addWanderingStop, moments, journalEntries, makeWanderingDream } = useAppData();
  const [makingDream, setMakingDream] = useState(false);
  const [livedNow, setLivedNow] = useState(false);
  const [dreamError, setDreamError] = useState("");
  const memoryCount = stopId => moments.filter(m => m.stop_id === stopId).length + journalEntries.filter(e => e.stop_id === stopId).length;
  const [selectedId, setSelectedId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");

  const wandering = wanderings.find(y => y.id === id);
  const stops = useMemo(
    () => wanderingStops.filter(s => s.wandering_id === id).sort((a, b) => a.position - b.position),
    [wanderingStops, id]
  );
  const dream = wandering && [...items, ...releasedItems].find(i => i.id === wandering.item_id);

  const shell = children => (
    <div className="min-h-dvh bg-bg flex justify-center font-sans">
      <div className="w-full max-w-[640px] px-5 pb-12" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
        <button onClick={() => goBack(navigate)} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary mb-5">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back
        </button>
        {children}
      </div>
    </div>
  );

  if (!loaded) return shell(<div className="text-body text-textSecondary">Unfolding the map…</div>);
  if (!wandering) return shell(<div className="text-body text-textSecondary">This wandering couldn't be found.</div>);

  // A Dream already marked done is a journey taken, whatever its dates say.
  const status = dream?.done ? "travelled" : wanderingStatus(stops);
  const when = wanderingWhenLabel(stops);

  async function saveTitle() {
    if (!title.trim()) { setTitleError("Give it a name."); return; }
    try {
      await renameWandering(wandering.id, title.trim());
      setEditingTitle(false);
    } catch (e) {
      console.error("[Wandering] rename failed:", e);
      setTitleError("Couldn't rename it. Try again.");
    }
  }

  return shell(
    <>
      <div className="text-label uppercase text-gold mb-1">Wandering · {STATUS_LABEL[status]}</div>
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={title}
            onChange={e => { setTitle(e.target.value); setTitleError(""); }}
            onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
            aria-label="Wandering name"
            className="flex-1 min-w-0 font-serif text-hero bg-transparent border-b border-borderC outline-none focus:border-forestAccent text-textPrimary"
          />
          <button onClick={saveTitle} aria-label="Save name" className="text-forestAccent"><Check size={20} strokeWidth={1.75} /></button>
          <button onClick={() => setEditingTitle(false)} aria-label="Cancel rename" className="text-textMuted"><X size={20} strokeWidth={1.75} /></button>
        </div>
      ) : (
        <button onClick={() => { setTitle(wandering.title); setEditingTitle(true); }} className="group flex items-center gap-2 text-left">
          <h1 className="font-serif text-hero text-textPrimary">{wandering.title}</h1>
          <Pencil size={15} strokeWidth={1.75} className="text-textMuted flex-none" aria-hidden="true" />
          <span className="sr-only">Rename</span>
        </button>
      )}
      {titleError && <div className="text-caption text-error mt-1">{titleError}</div>}
      {when && <div className="text-bodySm text-textSecondary mt-1">{when}</div>}
      {dream && (
        <div className="flex items-center gap-1 text-bodySm text-textSecondary mt-0.5">
          <Star size={12} strokeWidth={1.75} className="text-gold" />
          from your dream "{dream.name}"
        </div>
      )}
      {(() => {
        // What this journey has given you: scored by what you carried home.
        const remembered = stops.reduce((n, st) => n + memoryCount(st.id), 0);
        if (!remembered) return null;
        return (
          <div className="text-caption text-textMuted mt-0.5">
            {remembered} {remembered === 1 ? "memory" : "memories"} · +{remembered * TRAVEL_MEMORY_XP} XP
          </div>
        );
      })()}
      {dream && !dream.done && wanderingStatus(stops) === "travelled" && items.some(i => i.id === dream.id) && (
        <MarkLivedCard dream={dream} stops={stops} onLived={() => setLivedNow(true)} />
      )}
      {livedNow && dream?.done && (
        <div className="flex items-center gap-1.5 text-bodySm text-gold mt-3">
          <Sparkles size={14} strokeWidth={1.75} />
          A dream lived · +{XP_VALS.dream} XP to {dream.cat}
        </div>
      )}
      {!dream && (
        <div className="rounded-card bg-surface1 border border-dashed border-borderC p-3.5 mt-3">
          <div className="text-bodySm text-textPrimary">A journey of its own.</div>
          <div className="text-caption text-textSecondary mt-0.5">
            Make it a completed dream to give it its place among your Dreams, with {XP_VALS.dream} XP
            {stops.some(st => st.arrive) ? " dated to when you went" : ""}.
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2.5"
            icon={Star}
            disabled={makingDream}
            onClick={async () => {
              setMakingDream(true);
              setDreamError("");
              try {
                await makeWanderingDream(wandering.id);
              } catch (e) {
                console.error("[Wandering] makeWanderingDream failed:", e);
                setDreamError("Couldn't make it a dream. Check your connection and try again.");
              }
              setMakingDream(false);
            }}
          >
            {makingDream ? "Making it a dream…" : "Make this a dream"}
          </Button>
          {dreamError && <div className="text-caption text-error mt-1.5">{dreamError}</div>}
        </div>
      )}

      <WanderingMap stops={stops} selectedId={selectedId} onSelect={setSelectedId} className="h-64 mt-4 mb-2 shadow-card" />
      {stops.some(s => memoryCount(s.id) > 0) ? (
        <button
          onClick={() => navigate("/journey", { state: { tab: "tree-stars", open: "constellations" } })}
          className="inline-flex items-center gap-1.5 text-caption text-forestAccent font-medium mb-5"
        >
          <Sparkles size={13} strokeWidth={1.75} />
          See it among your Life Constellations
        </button>
      ) : (
        <div className="mb-5" />
      )}

      {stops.length === 0 && (
        <p className="font-serif text-h3 italic text-textSecondary mb-4">Where does this dream take you? Add your first stop.</p>
      )}

      <ol className="mb-4">
        {stops.map((s, i) => {
          const open = selectedId === s.id;
          return (
            <li key={s.id}>
              {i > 0 && <div className="ml-[13px] h-3 border-l-2 border-dashed border-borderC" aria-hidden="true" />}
              <div className={`rounded-card p-3.5 transition-colors duration-150 ${open ? "bg-surface1 shadow-card ring-1 ring-gold" : "bg-surface1"}`}>
                <button type="button" onClick={() => setSelectedId(open ? null : s.id)} aria-expanded={open} className="w-full flex items-start gap-3 text-left">
                  <span className={`w-[26px] h-[26px] flex-none rounded-full text-caption font-semibold flex items-center justify-center text-onAccent ${open ? "bg-gold" : "bg-forestAccent"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-body font-medium text-textPrimary">{s.place_name}</span>
                      <span className="text-label px-2 py-0.5 rounded-full bg-surface3 text-textSecondary">{KINDS.find(k => k.key === s.kind)?.label}</span>
                    </span>
                    {s.place_detail && <span className="block text-caption text-textMuted">{s.place_detail}</span>}
                    <span className="block text-caption text-textSecondary mt-0.5">
                      {stopDateLabel(s)}
                      {memoryCount(s.id) > 0 && ` · ${memoryCount(s.id)} ${memoryCount(s.id) === 1 ? "memory" : "memories"}`}
                    </span>
                    {s.note && !open && <span className="block text-caption text-textSecondary italic mt-0.5">{s.note}</span>}
                  </span>
                </button>
                {open && <StopDetail stop={s} isFirst={i === 0} isLast={i === stops.length - 1} />}
              </div>
            </li>
          );
        })}
      </ol>

      <PlaceSearch onPick={async place => { const s = await addWanderingStop(wandering.id, place); setSelectedId(s.id); }} />

      {dream && (
        <div className="mt-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/pursue")}>See the dream in Pursue</Button>
        </div>
      )}
    </>
  );
}
