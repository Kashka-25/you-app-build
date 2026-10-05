import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { useEscape } from "../ui/useEscape";
import { PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { goBack } from "../../lib/week";
import {
  DURATIONS, readActive, writeActive, growthOf, stageLine, clock, outcomeOf, markersReached,
  minutesLabel, askToNotify, notifyBloom, MARKERS, markerXp
} from "../../lib/focus";
import { FocusFlower, RestingSeed } from "./FocusFlower";
import Memento from "./Memento";

// The Focus session ("Tend" timer). Plant → growing → a bloom or a resting
// seed. Nothing dies, wilts or resets: stopping early still counts, and
// every marker reached stays yours.

const primaryBtn = "w-full min-h-[52px] rounded-sm bg-[#C9A24D] text-[#0F1A14] font-semibold text-body disabled:opacity-50";
const quietBtn = "w-full min-h-[44px] rounded-sm text-body text-[#B8B3A9]";

function newId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
}

export default function FocusScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { items, weekIntentions, saveFocusSession, saveFocusNote } = useAppData();

  const [active, setActive] = useState(() => readActive());
  const [now, setNow] = useState(Date.now());
  const [ended, setEnded] = useState(null); // { session, xp, tendedNow }
  const [confirmRest, setConfirmRest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── What's being tended ──
  const intention = weekIntentions.find(w => w.id === params.get("intention"));
  const presetItem = items.find(i => i.id === (intention?.item_id || params.get("item")));
  const [pickedItemId, setPickedItemId] = useState(null);
  const [freeLabel, setFreeLabel] = useState("");
  const [freePillar, setFreePillar] = useState(null);
  const [planned, setPlanned] = useState(30);
  const [hideClock, setHideClock] = useState(false);
  const item = presetItem || items.find(i => i.id === pickedItemId);
  const pursuits = useMemo(() => items.filter(i => !i.done), [items]);

  // Keep in step with other tabs, and with the pill elsewhere in the app.
  useEffect(() => {
    const sync = () => setActive(readActive());
    window.addEventListener("you-focus-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("you-focus-change", sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const elapsed = active ? now - active.startedAt : 0;
  const minutes = active ? Math.floor(elapsed / 60000) : 0;
  const growth = active ? growthOf(elapsed, active.plannedMinutes) : 0;
  const timeUp = active?.plannedMinutes && elapsed >= active.plannedMinutes * 60000;

  // A timed session finishes on its own, even if the Seeker was away.
  const finishing = useRef(false);
  useEffect(() => {
    if (timeUp && !finishing.current) finish(true);
  }, [timeUp]); // eslint-disable-line react-hooks/exhaustive-deps

  function leave() {
    goBack(navigate);
  }
  useEscape(true, leave);

  async function plant() {
    const label = item ? item.name : freeLabel.trim();
    if (!label) return;
    if (planned) askToNotify(); // asked on this tap, so the browser allows it
    const session = {
      id: newId(), label, itemId: item?.id || null, intentionId: intention?.id || null,
      pillar: item ? item.cat : freePillar, valueName: intention?.value_name || null,
      plannedMinutes: planned, hideClock, startedAt: Date.now(), notified: false
    };
    writeActive(session);
    setActive(session);
    setNow(Date.now());
  }

  async function finish(reachedTime = false) {
    if (!active || finishing.current) return;
    finishing.current = true;
    setSaving(true);
    setError("");
    const mins = reachedTime ? active.plannedMinutes : Math.min(minutes, active.plannedMinutes || Infinity);
    const outcome = reachedTime ? "bloom" : outcomeOf(mins, active.plannedMinutes);
    // Finishing while the Seeker is away: tell them (same tag as the
    // watcher's, so it never shows twice).
    if (reachedTime && document.visibilityState !== "visible") notifyBloom(active.label);
    try {
      const result = await saveFocusSession({ active, minutes: mins, outcome });
      writeActive(null);
      setActive(null);
      setEnded(result);
    } catch (e) {
      console.error("[Focus] save failed:", e);
      setError("Couldn't keep this session just now. It's still growing; try again in a moment.");
      finishing.current = false;
    }
    setSaving(false);
    setConfirmRest(false);
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto text-[#F7F5EF] font-sans" style={{ background: "radial-gradient(circle at 50% 40%, #1E2D22 0%, #0F1A14 65%)" }}>
      <div className="min-h-full max-w-[440px] mx-auto px-6 pt-6 pb-8 flex flex-col">
        {ended ? (
          <Ended ended={ended} onNote={note => saveFocusNote(ended.session.id, note)} onDone={leave} onAnother={() => { setEnded(null); finishing.current = false; }} />
        ) : active ? (
          <Growing
            active={active} elapsed={elapsed} minutes={minutes} growth={growth}
            confirmRest={confirmRest} setConfirmRest={setConfirmRest} onRest={() => finish(false)}
            onLeave={leave} saving={saving} error={error}
          />
        ) : (
          <Setup
            item={item} preset={!!presetItem} intention={intention} pursuits={pursuits}
            pickedItemId={pickedItemId} setPickedItemId={setPickedItemId}
            freeLabel={freeLabel} setFreeLabel={setFreeLabel} freePillar={freePillar} setFreePillar={setFreePillar}
            planned={planned} setPlanned={setPlanned} hideClock={hideClock} setHideClock={setHideClock}
            onPlant={plant} onLeave={leave}
          />
        )}
      </div>
    </div>
  );
}

function Thread({ label, valueName, pillar }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-label uppercase tracking-[0.1em] text-[#C9A24D]">Tending</div>
      <div className="font-serif text-[26px] font-semibold leading-tight">{label}</div>
      {(valueName || pillar) && <div className="text-bodySm text-[#B8B3A9]">{[valueName, pillar].filter(Boolean).join(" · ")}</div>}
    </div>
  );
}

function Setup({
  item, preset, intention, pursuits, pickedItemId, setPickedItemId, freeLabel, setFreeLabel, freePillar, setFreePillar,
  planned, setPlanned, hideClock, setHideClock, onPlant, onLeave
}) {
  const choosing = !preset;
  const canPlant = item || freeLabel.trim();
  return (
    <div className="flex-1 flex flex-col gap-6">
      <button onClick={onLeave} aria-label="Back" className="w-11 h-11 -ml-2.5 flex items-center">
        <ArrowLeft size={22} strokeWidth={1.75} className="text-[#B8B3A9]" />
      </button>

      {item ? (
        <Thread label={item.name} valueName={intention?.value_name} pillar={item.cat} />
      ) : (
        <h1 className="font-serif text-[30px] font-semibold leading-tight m-0 text-center">What would you like to tend?</h1>
      )}

      <div className="flex justify-center"><RestingSeed size={170} /></div>

      {choosing && (
        <div className="flex flex-col gap-2">
          {pursuits.length > 0 && (
            <>
              <div className="text-bodySm text-[#D9D4C8]">One of your pursuits</div>
              <div className="flex flex-wrap gap-2">
                {pursuits.slice(0, 12).map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPickedItemId(pickedItemId === p.id ? null : p.id); setFreeLabel(""); }}
                    aria-pressed={pickedItemId === p.id}
                    className={`min-h-[40px] px-3 rounded-full text-bodySm border ${pickedItemId === p.id ? "bg-[#C9A24D] text-[#0F1A14] border-[#C9A24D]" : "border-white/15 text-[#D9D4C8]"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <label htmlFor="free" className="text-bodySm text-[#D9D4C8] mt-2">Or name it</label>
          <input
            id="free" value={freeLabel} maxLength={80}
            onChange={e => { setFreeLabel(e.target.value); if (e.target.value) setPickedItemId(null); }}
            placeholder="Reading, a letter, tidying…"
            className="min-h-[48px] bg-[#1A1F1D] border border-white/15 rounded-sm px-3.5 text-body text-[#F7F5EF] outline-none focus:border-[#C9A24D] placeholder:text-[#8B8E87]"
          />
          {freeLabel.trim() && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="text-caption text-[#B8B3A9]">Which roots does it feed? (optional)</div>
              <div className="flex flex-wrap gap-1.5">
                {PILLARS.map(p => (
                  <button
                    key={p} onClick={() => setFreePillar(freePillar === p ? null : p)} aria-pressed={freePillar === p}
                    className={`min-h-[36px] px-3 rounded-full text-caption border ${freePillar === p ? "text-[#0F1A14] border-transparent" : "border-white/15 text-[#D9D4C8]"}`}
                    style={freePillar === p ? { background: PILLAR_COLORS[p] } : undefined}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="text-bodySm text-[#D9D4C8]">How long would you like to tend it?</div>
        <div className="grid grid-cols-5 gap-2">
          {[...DURATIONS, null].map(d => (
            <button
              key={d ?? "open"} onClick={() => setPlanned(d)} aria-pressed={planned === d}
              className={`min-h-[48px] rounded-sm text-bodySm ${planned === d ? "bg-[#C9A24D] text-[#0F1A14] font-semibold" : "bg-[#1A1F1D] text-[#EDE6D6] border border-white/10"}`}
            >
              {d ? `${d} min` : "Open"}
            </button>
          ))}
        </div>
        {planned === null && <div className="text-caption text-[#B8B3A9]">No end: it grows until you’re done.</div>}
      </div>

      <label className="flex items-center gap-3 min-h-[44px] text-body text-[#D9D4C8]">
        <input type="checkbox" checked={hideClock} onChange={e => setHideClock(e.target.checked)} className="w-5 h-5 accent-[#C9A24D]" />
        Hide the clock, just let it grow
      </label>

      <div className="flex-1" />
      <button onClick={onPlant} disabled={!canPlant} className={primaryBtn}>Plant and begin</button>
    </div>
  );
}

function Growing({ active, elapsed, minutes, growth, confirmRest, setConfirmRest, onRest, onLeave, saving, error }) {
  const color = PILLAR_COLORS[active.pillar] || "#C9A24D";
  const isOpen = !active.plannedMinutes;
  // Only the markers this session can reach.
  const markers = MARKERS.filter(m => isOpen || m.minutes <= active.plannedMinutes);
  const reached = markersReached(minutes);

  return (
    <div className="flex-1 flex flex-col gap-5 text-center">
      <div className="flex items-center justify-between">
        <button onClick={onLeave} className="min-h-[44px] -ml-1 flex items-center gap-1.5 text-bodySm text-[#B8B3A9]">
          <X size={18} strokeWidth={1.75} /> Leave it growing
        </button>
      </div>
      <Thread label={active.label} valueName={active.valueName} pillar={active.pillar} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <FocusFlower growth={growth} color={color} sway size={230} />
        {!active.hideClock && (
          <div className="font-serif text-[44px] font-medium leading-none" aria-live="off">{clock(elapsed)}</div>
        )}
        <div className="text-bodySm text-[#B8B3A9]">
          {active.hideClock ? stageLine(growth) : isOpen ? `${stageLine(growth)} · open session` : `of ${active.plannedMinutes} minutes · ${stageLine(growth).toLowerCase()}`}
        </div>
        {!isOpen && !active.hideClock && (
          <div className="w-[220px] h-[3px] rounded-full bg-[#2A2F2C]">
            <div className="h-full rounded-full bg-[#7A9B76] transition-[width] duration-1000 ease-linear" style={{ width: `${growth * 100}%` }} />
          </div>
        )}
        <div className="flex gap-2 justify-center" aria-label="Markers">
          {markers.map(m => {
            const got = reached.includes(m);
            return (
              <span key={m.minutes} className={`text-caption px-2.5 py-1 rounded-full border ${got ? "border-[#C9A24D] text-[#C9A24D]" : "border-white/10 text-[#8B8E87]"}`}>
                {m.minutes} min straight · +{m.xp}{got ? " ✓" : ""}
              </span>
            );
          })}
        </div>
        <div className="text-caption text-[#8B8E87]">
          +1 for every 10 minutes
          {markerXp(minutes) > 0 && <span className="text-[#C9A24D]"> · +{markerXp(minutes)} so far</span>}
        </div>
      </div>

      <p className="text-caption text-[#8B8E87] m-0">You can leave the app. It keeps growing while you work.</p>
      {error && <div className="text-bodySm text-[#E9A0A0]">{error}</div>}

      {confirmRest ? (
        <div className="flex flex-col gap-2.5 p-4 rounded-card bg-[#1A1F1D] border border-white/10">
          <div className="text-body text-[#EDE6D6]">
            {isOpen ? "Finish here?" : "Rest here?"} {markerXp(minutes) > 0 ? "What you’ve grown stays yours." : "It still counts as time tended."}
          </div>
          <button onClick={onRest} disabled={saving} className={primaryBtn}>{saving ? "Keeping it…" : isOpen ? "Finish" : "Rest here"}</button>
          <button onClick={() => setConfirmRest(false)} className={quietBtn}>Keep tending</button>
        </div>
      ) : (
        <button onClick={() => setConfirmRest(true)} className="w-full min-h-[48px] rounded-sm border border-white/15 text-body text-[#EDE6D6]">
          {isOpen ? "I’m done" : "Rest here"}
        </button>
      )}
    </div>
  );
}

function Ended({ ended, onNote, onDone, onAnother }) {
  const { session, xp, tendedNow } = ended;
  const bloom = session.outcome === "bloom";
  const color = PILLAR_COLORS[session.pillar] || "#C9A24D";
  // Resting keeps the plant as far as it grew: shrinking back to a seed
  // would read as a loss. (In the garden it's still a resting seed.)
  const reachedGrowth = Math.min(0.79, growthOf(session.minutes * 60000, session.planned_minutes));
  const restingAs = reachedGrowth < 0.15 ? "A resting seed" : reachedGrowth < 0.45 ? "Resting as a sprout" : "Resting as a bud";
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function keep() {
    setSaving(true);
    try { if (note.trim()) await onNote(note); } catch (e) { console.error("[Focus] note failed:", e); }
    onDone();
  }

  const rewards = [
    tendedNow && "Marked as tended today",
    session.pillar && xp > 0 && `your ${session.pillar} roots grew (+${xp})`
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex-1 flex flex-col gap-4 text-center">
      <div className="h-11" />
      <div className="flex-1 flex flex-col items-center justify-center gap-3.5">
        {bloom || reachedGrowth >= 0.15
          ? <FocusFlower growth={bloom ? 1 : reachedGrowth} color={color} sway size={210} />
          : <RestingSeed size={210} />}
        <h1 className="font-serif text-[30px] font-semibold m-0">{bloom ? "It bloomed" : restingAs}</h1>
        <p className="font-serif italic text-[19px] leading-snug text-[#EDE6D6] m-0 max-w-[300px]">
          {bloom
            ? `${minutesLabel(session.minutes)} with ${session.label}.`
            : session.minutes > 0
              ? `You tended ${session.label} for ${minutesLabel(session.minutes)}. That still counts.`
              : `You showed up for ${session.label}. That still counts.`}
        </p>
        {rewards && <div className="text-bodySm text-[#B8B3A9]">{rewards.charAt(0).toUpperCase() + rewards.slice(1)}</div>}
      </div>
      {(session.mementos || []).map(m => <Memento key={m.hour} memento={m} />)}
      <div className="flex flex-col gap-2 text-left">
        <label htmlFor="grew" className="text-bodySm text-[#D9D4C8]">
          {bloom ? "What grew?" : "Anything you want to remember?"} <span className="text-[#8B8E87]">(optional)</span>
        </label>
        <input
          id="grew" value={note} onChange={e => setNote(e.target.value)} maxLength={200}
          className="min-h-[48px] bg-[#1A1F1D] border border-white/15 rounded-sm px-3.5 text-body text-[#F7F5EF] outline-none focus:border-[#C9A24D]"
        />
      </div>
      <button onClick={keep} disabled={saving} className={primaryBtn}>Keep it in my garden</button>
      <button onClick={onAnother} className={quietBtn}>Plant another</button>
    </div>
  );
}
