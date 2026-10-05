import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { useEscape } from "../ui/useEscape";
import { useAppData } from "../../lib/AppDataContext";
import { fadeIn } from "../ui/motion";
import { VALUE_COLORS, VALUE_ELEMENT } from "../../constants/app.const";
import { getValueEntry } from "../../constants/valueLibrary";
import {
  startCrossroads, answer, isDone, currentPair, promptFor, estimateCrossings, hardestCrossing,
  flatten, regroup, move, ranks
} from "../../lib/crossroads";

// The Crossroads — a night-sky ritual, like Tree & Stars. Two values at a
// time until the order is clear, then the Seeker can nudge it, then write
// their compass line. Nothing here is sent to an AI; the saved compass is
// read (with consent) by the reflections later.

const GOLD = "#C9A24D";

export function NorthStar({ size = 24, filled = false, color = GOLD, strokeWidth = 1.25 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} fillOpacity={filled ? 0.2 : 0}
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 L13.6 10.4 L22 12 L13.6 13.6 L12 22 L10.4 13.6 L2 12 L10.4 10.4 Z" />
    </svg>
  );
}

const STARTERS = ["I want to live", "My life is going well when", "At the end, I hope I", "I steer by"];

function definitionOf(values, name) {
  const v = values.find(x => x.name === name);
  if (v?.definition) return { text: v.definition, own: true };
  const essence = getValueEntry(name)?.tagline;
  return essence ? { text: essence, own: false } : null;
}

const primaryBtn = "w-full min-h-[52px] rounded-sm bg-[#C9A24D] text-[#0B0B1F] font-semibold text-body disabled:opacity-50";
const quietBtn = "min-h-[44px] px-4 rounded-sm border border-white/15 text-[#D6D3EA] text-body";

// mode "walk": the whole ritual. mode "line": only the compass line, for
// writing or rewriting it on the current compass.
export default function Crossroads({ open, onClose, mode = "walk" }) {
  const { activeValues, values, compass, saveCompass, saveCompassLine } = useAppData();
  const names = useMemo(() => activeValues.map(v => v.name), [activeValues]);

  const [view, setView] = useState("intro"); // intro | crossing | order | line
  const [history, setHistory] = useState([]); // crossroads states, for Back
  const [rows, setRows] = useState([]);
  const [line, setLine] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const shownAt = useRef(0);
  const scroller = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    if (mode === "line") {
      setRows(flatten(compass?.ordering || []));
      setLine(compass?.compass_line || `${STARTERS[0]} `);
      setView("line");
    } else {
      setHistory([startCrossroads(names)]);
      setLine(compass?.compass_line || `${STARTERS[0]} `);
      setView("intro");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEscape(open, onClose);

  const state = history[history.length - 1];
  const pair = state && currentPair(state);
  const total = Math.max(estimateCrossings(names.length), 1);
  const hardest = state ? hardestCrossing(state.timings) : null;

  useEffect(() => { shownAt.current = performance.now(); }, [history.length, view]);
  // Each step starts at its top, not wherever the last one was scrolled to.
  useEffect(() => { scroller.current?.scrollTo(0, 0); }, [view]);

  function begin() {
    if (isDone(state)) { setRows(flatten(state.groups)); setView("order"); }
    else setView("crossing");
  }

  function choose(choice) {
    const seconds = (performance.now() - shownAt.current) / 1000;
    const nextState = answer(state, choice, seconds);
    setHistory(h => [...h, nextState]);
    if (isDone(nextState)) { setRows(flatten(nextState.groups)); setView("order"); }
  }

  function back() {
    if (view === "line") { mode === "line" ? onClose() : setView("order"); return; }
    if (view === "order") {
      setHistory(h => (h.length > 1 ? h.slice(0, -1) : h));
      setView(history.length > 1 ? "crossing" : "intro");
      return;
    }
    if (history.length > 1) setHistory(h => h.slice(0, -1));
    else setView("intro");
  }

  async function finish(withLine) {
    setSaving(true);
    setError("");
    const text = withLine ? line.trim() : "";
    // A line that's only a starter isn't a line yet.
    const real = text && !STARTERS.some(s => text === s || text === `${s}…`) ? text : "";
    try {
      if (mode === "line") await saveCompassLine(real);
      else await saveCompass({ ordering: regroup(rows), hardest, crossings: state.answered, compassLine: real });
      onClose();
    } catch (e) {
      console.error("[Crossroads] save failed:", e);
      setError("Couldn't keep your compass just now. Try again in a moment.");
      setSaving(false);
    }
  }

  const rankList = ranks(rows);
  const top = rows.filter((r, i) => rankList[i] === 1).map(r => r.name);
  const topThree = rows.slice(0, 3).map(r => r.name);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...fadeIn}
          role="dialog"
          aria-modal="true"
          aria-label="The Crossroads"
          className="fixed inset-0 z-50 text-[#F7F5EF] font-sans"
          style={{ background: "radial-gradient(circle at 50% 18%, #1B1A48 0%, #0B0B1F 60%)" }}
        >
          <div ref={scroller} className="h-full overflow-y-auto">
          <div className="min-h-full max-w-[440px] mx-auto px-6 pt-6 pb-8 flex flex-col">
            <div className="flex items-center justify-between h-11 mb-2">
              {view === "intro" ? <span /> : (
                <button onClick={back} aria-label="Back" className="w-11 h-11 -ml-2.5 flex items-center">
                  <ArrowLeft size={22} strokeWidth={1.75} className="text-[#B8B5D6]" />
                </button>
              )}
              {view === "crossing" && (
                <div className="text-caption text-[#B8B5D6]">Crossing {state.answered + 1} of about {total}</div>
              )}
              <button onClick={onClose} aria-label="Leave the crossroads" className="w-11 h-11 -mr-2.5 flex items-center justify-end">
                <X size={22} strokeWidth={1.75} className="text-[#B8B5D6]" />
              </button>
            </div>

            {view === "intro" && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center gap-5">
                  <NorthStar size={56} strokeWidth={1} />
                  <h1 className="font-serif font-semibold text-[34px] leading-tight m-0">The Crossroads</h1>
                  <p className="font-serif italic text-[21px] leading-snug text-[#EDE6D6] m-0">
                    Your values rarely argue on a good day. On a hard one, they pull against each other, and something decides. Better that it’s you.
                  </p>
                  <p className="text-body text-[#B8B5D6] m-0">
                    You’ll see two of your values side by side, a few at a time. There are no right answers, only honest ones.
                  </p>
                  <ul className="flex flex-col gap-2.5 text-bodySm text-[#D6D3EA] m-0 p-0 list-none">
                    <li className="flex gap-2.5"><span className="text-[#C9A24D]">·</span>Answer for this season of your life, not forever.</li>
                    <li className="flex gap-2.5"><span className="text-[#C9A24D]">·</span>If two feel truly equal, you can leave them side by side.</li>
                    <li className="flex gap-2.5"><span className="text-[#C9A24D]">·</span>About {total} {total === 1 ? "crossing" : "crossings"}.</li>
                  </ul>
                </div>
                <button onClick={begin} className={`${primaryBtn} mt-8`}>Begin</button>
              </div>
            )}

            {view === "crossing" && pair && (
              <div className="flex-1 flex flex-col gap-5">
                <h2 className="font-serif font-medium text-[26px] leading-snug text-center m-0 mt-2">{promptFor(state.answered)}</h2>
                <div className="flex-1 flex flex-col justify-center gap-3.5">
                  <ValueChoice name={pair.a} def={definitionOf(values, pair.a)} onPick={() => choose("a")} />
                  <div className="flex items-center gap-3 text-caption uppercase tracking-[0.1em] text-[#8A88AE]">
                    <span className="flex-1 h-px bg-white/10" />or<span className="flex-1 h-px bg-white/10" />
                  </div>
                  <ValueChoice name={pair.b} def={definitionOf(values, pair.b)} onPick={() => choose("b")} />
                </div>
                <div className="flex flex-col items-center gap-3.5">
                  <button onClick={() => choose("equal")} className={quietBtn}>They feel equal to me</button>
                  <p className="text-caption text-[#8A88AE] text-center max-w-[290px] m-0">
                    Notice which one you felt a pang about leaving. That pang is worth knowing too.
                  </p>
                </div>
              </div>
            )}

            {view === "order" && (
              <div className="flex-1 flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2.5 text-center mt-2">
                  <NorthStar size={44} filled />
                  <div className="text-label uppercase tracking-[0.12em] text-[#C9A24D]">
                    {top.length > 1 ? "Your True North is shared" : "Your True North"}
                  </div>
                  <h1 className="font-serif font-semibold text-[40px] leading-none m-0">{top.join(" & ")}</h1>
                  {top.length === 1 && definitionOf(values, top[0]) && (
                    <div className="text-body italic text-[#D6D3EA]">“{definitionOf(values, top[0]).text}”</div>
                  )}
                </div>

                <ol className="flex flex-col gap-2 m-0 p-0 list-none">
                  {rows.map((r, i) => (
                    <li key={r.name} className="flex items-center gap-3 pl-3.5 pr-1 py-1 rounded-sm bg-[#19193D]">
                      <span className="w-5 font-serif text-[18px] text-[#B8B5D6] text-center">{rankList[i]}</span>
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: VALUE_COLORS[r.name] }} />
                      <span className="flex-1 text-body">
                        {r.name}
                        {r.tiedWithPrev && <span className="text-caption text-[#8A88AE]"> · equal</span>}
                      </span>
                      <button onClick={() => setRows(move(rows, i, -1))} disabled={i === 0} aria-label={`Move ${r.name} up`}
                        className="w-11 h-11 flex items-center justify-center text-[#B8B5D6] disabled:opacity-25">
                        <ChevronUp size={18} strokeWidth={1.75} />
                      </button>
                      <button onClick={() => setRows(move(rows, i, 1))} disabled={i === rows.length - 1} aria-label={`Move ${r.name} down`}
                        className="w-11 h-11 flex items-center justify-center text-[#B8B5D6] disabled:opacity-25">
                        <ChevronDown size={18} strokeWidth={1.75} />
                      </button>
                    </li>
                  ))}
                </ol>

                {hardest && (
                  <div className="p-4 rounded-[16px] border border-dashed border-[#C9A24D]/40 flex flex-col gap-1.5">
                    <div className="text-caption uppercase tracking-[0.06em] text-[#C9A24D]">The hardest crossing</div>
                    <div className="text-body text-[#D6D3EA]">
                      {hardest.pair[0]} and {hardest.pair[1]}. You took longest here. When two values are this close, both are often carrying something important.
                    </div>
                  </div>
                )}

                <div className="text-caption text-[#B8B5D6] text-center">
                  This is how you lean in this season. Move anything that feels untrue. It’s yours to change any time.
                </div>
                <div className="flex-1" />
                <button onClick={() => setView("line")} className={primaryBtn}>Write your compass line</button>
              </div>
            )}

            {view === "line" && (
              <div className="flex-1 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h1 className="font-serif font-semibold text-[30px] leading-tight m-0">Your compass line</h1>
                  <p className="text-body text-[#B8B5D6] m-0">
                    Bring your top {topThree.length === 1 ? "value" : topThree.length === 2 ? "two" : "three"} into one sentence, in your own words. Someone reading it should know how you want to live.
                  </p>
                </div>

                {topThree.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="text-label uppercase tracking-[0.08em] text-[#8A88AE]">What you’ve already said</div>
                    {topThree.map((name, i) => {
                      const def = definitionOf(values, name);
                      return (
                        <div key={name} className="text-bodySm text-[#D6D3EA]">
                          <span className={i === 0 ? "text-[#C9A24D]" : "text-[#EDE6D6]"}>{name}</span>
                          {def && <> · {def.own ? def.text : <span className="italic">{def.text}</span>}</>}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label htmlFor="compass-line" className="text-bodySm text-[#EDE6D6]">Your compass line</label>
                  <textarea
                    id="compass-line"
                    rows={4}
                    value={line}
                    onChange={e => setLine(e.target.value)}
                    maxLength={280}
                    className="w-full resize-none bg-[#19193D] border border-[#C9A24D] rounded-sm p-3.5 text-[#F7F5EF] font-serif text-[21px] leading-snug outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="text-caption text-[#B8B5D6]">Other ways to begin</div>
                  <div className="flex flex-wrap gap-2">
                    {STARTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setLine(`${s} `)}
                        className="min-h-[36px] px-3 rounded-full border border-white/15 text-bodySm text-[#D6D3EA]"
                      >
                        {s}…
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1" />
                {error && <div className="text-bodySm text-[#E9A0A0]">{error}</div>}
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => finish(true)} disabled={saving} className={primaryBtn}>
                    {saving ? "Keeping it…" : "Keep this as my compass"}
                  </button>
                  {mode === "walk" && (
                    <button onClick={() => finish(false)} disabled={saving} className="min-h-[44px] text-body text-[#B8B5D6]">
                      Write the line another day
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ValueChoice({ name, def, onPick }) {
  const element = VALUE_ELEMENT[name];
  return (
    <button
      onClick={onPick}
      className="text-left flex flex-col gap-2 p-5 rounded-card bg-[#19193D] border border-white/10 hover:border-[#C9A24D] focus-visible:border-[#C9A24D] focus-visible:outline-none transition-colors duration-150"
    >
      <span className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: VALUE_COLORS[name] }} />
        <span className="font-serif text-[28px] font-semibold">{name}</span>
      </span>
      {def && <span className="text-body italic text-[#D6D3EA]">“{def.text}”</span>}
      <span className="text-caption text-[#B8B5D6]">
        {def ? (def.own ? "Your words" : "From the Codex") : ""}{def && element ? " · " : ""}{element || ""}
      </span>
    </button>
  );
}
