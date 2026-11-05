import { useEffect, useRef, useState } from "react";
import { Bookmark, ChevronDown, Sparkles, Trash2 } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { AiButton, AiCard, AiLink } from "../ui/Premium";
import DrawsFrom from "../ui/DrawsFrom";
import { Guide } from "../ui/Guide";

const OPEN_KEY = "you.ask-you-open";
// The house gold, bright enough for a short title.
const BRIGHT_GOLD = { backgroundImage: "linear-gradient(100deg, var(--ai-gold-2) 0%, var(--ai-gold-1) 50%, var(--ai-gold-2) 100%)", backgroundSize: "100% 100%" };

const PROMPTS = [
  "What keeps coming back in my dreams?",
  "What am I growing toward?",
  "What do my moods have to say lately?",
  "What have I been afraid to see in myself?"
];

function niceDate(key, year = false) {
  if (!key) return "";
  const d = new Date(String(key).length === 10 ? key + "T00:00:00" : key);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", ...(year && { year: "numeric" }) });
}

// "Drawn from 12 entries (9 dreams), 3 earlier readings and 2 Moments".
function drewFromLine(d) {
  if (!d) return "";
  const parts = [];
  if (d.entries) parts.push(`${d.entries} ${d.entries === 1 ? "entry" : "entries"}${d.dreams ? ` (${d.dreams} ${d.dreams === 1 ? "dream" : "dreams"})` : ""}`);
  if (d.readings) parts.push(`${d.readings} earlier ${d.readings === 1 ? "reading" : "readings"}`);
  if (d.moments) parts.push(`${d.moments} ${d.moments === 1 ? "Moment" : "Moments"}`);
  if (!parts.length) return "";
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  const span = d.first && d.last && d.first !== d.last ? ` · ${niceDate(d.first, true)} – ${niceDate(d.last, true)}` : "";
  return `Drawn from ${list}${span}`;
}

// Ask YOU (Cassidy, Nov 2: "a place someone can go to ask about a
// reflection on themself and everything they have been posting"). Type
// your own question; YOU reads the entries that speak to it, with every
// reading it has already made for you, and answers. Keep what you want
// to come back to; kept readings sit below, newest first.
export default function AskYOU({ prefill = null }) {
  const { askYOUnderstanding, loadKeptUnderstandings, keepUnderstanding, deleteUnderstanding, aiAllowed } = useAppData();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null); // { question, answer, drew_from }
  const [message, setMessage] = useState("");
  const [kept, setKept] = useState([]);
  const [keeping, setKeeping] = useState(false);
  const [keptId, setKeptId] = useState(null);
  // A gold bar that opens and closes (Cassidy, Nov 4), like Read between the
  // lines on Memories: closed to start, remembered on this device.
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(OPEN_KEY) === "1"; } catch { return false; }
  });
  function toggle() {
    setOpen(o => {
      try { localStorage.setItem(OPEN_KEY, o ? "0" : "1"); } catch { /* ignore */ }
      return !o;
    });
  }

  // A thread's "Ask YOU about this" (Nov 4): opens the bar with the
  // question written in, ready to send or change. Nothing is sent until
  // they tap Ask YOU.
  const barRef = useRef(null);
  useEffect(() => {
    if (!prefill?.text) return;
    setOpen(true);
    setResult(null);
    setKeptId(null);
    setMessage("");
    setQuestion(prefill.text);
    requestAnimationFrame(() => {
      barRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("ask-you")?.focus({ preventScroll: true });
    });
  }, [prefill?.nonce]);

  useEffect(() => {
    let live = true;
    loadKeptUnderstandings().then(rows => { if (live) setKept(rows); });
    return () => { live = false; };
  }, []);

  async function ask(q = question) {
    const text = q.trim();
    if (text.length < 3 || asking) return;
    setQuestion(text);
    setAsking(true);
    setMessage("");
    setResult(null);
    setKeptId(null);
    try {
      const r = await askYOUnderstanding(text);
      if (r.empty) setMessage(r.message);
      else setResult(r);
    } catch (e) {
      console.error("[AskYOU] ask failed:", e);
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "YOU couldn't answer just now. Try again in a little while.");
    }
    setAsking(false);
  }

  async function keep() {
    if (!result || keptId) return;
    setKeeping(true);
    try {
      const row = await keepUnderstanding(result);
      setKept(prev => [row, ...prev]);
      setKeptId(row.id);
    } catch (e) {
      console.error("[AskYOU] keep failed:", e);
      setMessage("This reading couldn't be kept just now. Try again in a moment.");
    }
    setKeeping(false);
  }

  async function remove(id) {
    if (!window.confirm("Let this reading go? It can't be brought back.")) return;
    try {
      await deleteUnderstanding(id);
      setKept(prev => prev.filter(k => k.id !== id));
      if (keptId === id) setKeptId(null);
    } catch (e) {
      console.error("[AskYOU] delete failed:", e);
    }
  }

  function askAnother() {
    setResult(null);
    setQuestion("");
    setKeptId(null);
  }

  return (
    <AiCard className="mb-4 scroll-mt-20" ref={barRef}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ask-you-panel"
        className="w-full flex items-center gap-3 text-left -my-1 py-1"
      >
        <Sparkles size={20} strokeWidth={1.5} className="flex-none text-[var(--ai-gold-1)]" aria-hidden="true" />
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-h3 ai-gold-text" style={BRIGHT_GOLD}>Ask YOU</span>
          <span className="block text-caption text-[var(--ai-text-3)]">
            Your own question, answered from all you've shared{kept.length > 0 ? ` · ${kept.length} kept` : ""}
          </span>
        </span>
        <ChevronDown size={20} strokeWidth={1.75} className={`flex-none text-[var(--ai-gold-1)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
      <div id="ask-you-panel" className="mt-4">
        <p className="font-serif text-h3 text-[var(--ai-text)] m-0 leading-snug">What would you like to understand about yourself?</p>

        {!result && (
          <>
            <form onSubmit={e => { e.preventDefault(); ask(); }} className="mt-3">
              <label htmlFor="ask-you" className="sr-only">Your question</label>
              <textarea
                id="ask-you"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask(); }}
                rows={3}
                maxLength={600}
                disabled={asking}
                placeholder="Ask anything about you, in any light. Why do I keep dreaming of water, from a spiritual perspective?"
                className="w-full resize-y bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary placeholder:text-textMuted outline-none focus:border-[#E8C877] shadow-field"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {PROMPTS.map(p => (
                  <button
                    key={p}
                    type="button"
                    disabled={asking}
                    onClick={() => setQuestion(p)}
                    className="min-h-[36px] px-3 rounded-full border border-[#E8C877]/40 text-caption text-[var(--ai-text-2)] hover:border-[#E8C877] hover:text-[var(--ai-text)] transition disabled:opacity-60 text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <AiButton
                full
                busy={asking}
                disabled={!aiAllowed || question.trim().length < 3}
                onClick={() => ask()}
                className="mt-3"
              >
                {asking ? "Reading all you've shared…" : "Ask YOU"}
              </AiButton>
            </form>
            <Guide className="mt-2">
              YOU looks through the entries that speak to your question, the moods around them, and every reading it has already
              made for you, then answers. You'll be asked before anything is sent to AI, and nothing is kept unless you choose to.
            </Guide>
          </>
        )}

        {message && <p className="text-caption text-[var(--ai-text-2)] m-0 mt-2">{message}</p>}

        {result && (
          <div className="mt-3">
            <p className="text-bodySm italic text-[var(--ai-text-2)] m-0">“{result.question}”</p>
            <Reading answer={result.answer} drewFrom={result.drew_from} />
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <AiButton size="sm" onClick={keep} busy={keeping} disabled={Boolean(keptId)}>
                {keptId ? "Kept" : keeping ? "Keeping…" : "Keep this reading"}
              </AiButton>
              <AiLink onClick={askAnother}>Ask something else</AiLink>
            </div>
          </div>
        )}

        <DrawsFrom uses={["journal", "moments", "harvests", "pursuits", "values", "mood"]} className="mt-3" />

      {kept.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <h3 className="flex items-center gap-1.5 text-label uppercase text-[var(--ai-text-2)] m-0 mb-2">
            <Bookmark size={13} strokeWidth={1.75} aria-hidden="true" /> Readings you kept
          </h3>
          <ul className="list-none m-0 p-0 space-y-2">
            {kept.map(k => <KeptReading key={k.id} row={k} onDelete={() => remove(k.id)} />)}
          </ul>
        </div>
      )}
      </div>
      )}
    </AiCard>
  );
}

function KeptReading({ row, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-sm bg-white/5 border border-white/10">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-start gap-3 p-4 text-left min-h-[48px]"
      >
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-body text-[var(--ai-text)]">{row.answer?.title || row.question}</span>
          <span className="block text-caption text-[var(--ai-text-3)] mt-0.5 truncate">{niceDate(row.created_at, true)} · {row.question}</span>
        </span>
        <ChevronDown size={18} strokeWidth={1.75} className={`flex-none text-[var(--ai-text-2)] mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div>
            <p className="text-bodySm italic text-[var(--ai-text-2)] m-0">“{row.question}”</p>
            <Reading answer={row.answer} drewFrom={row.drew_from} />
            <button
              type="button"
              onClick={onDelete}
              className="mt-3 inline-flex items-center gap-1.5 min-h-[40px] text-caption text-[var(--ai-text-2)] hover:text-[#F3DE9C]"
            >
              <Trash2 size={14} strokeWidth={1.75} /> Let this one go
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// One reading from YOU: a title, the heart of it, deeper parts, their own
// words echoed back, a question and a small step.
function Reading({ answer, drewFrom }) {
  if (!answer) return null;
  return (
    <div className="mt-2">
      {answer.title && <h3 className="font-serif text-h2 ai-gold-text m-0 leading-tight">{answer.title}</h3>}
      {answer.opening && <p className="font-serif text-body text-[var(--ai-text)] m-0 mt-2 leading-relaxed">{answer.opening}</p>}

      {(answer.sections || []).map(s => (
        <div key={s.heading} className="mt-4">
          <div className="text-label uppercase tracking-[0.12em] text-[var(--ai-text-2)] mb-1.5">{s.heading}</div>
          {String(s.text || "").split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="text-bodySm text-[var(--ai-text)] m-0 mb-2 leading-relaxed">{para}</p>
          ))}
        </div>
      ))}

      {answer.echoes?.length > 0 && (
        <div className="mt-4">
          <div className="text-label uppercase tracking-[0.12em] text-[var(--ai-text-2)] mb-1.5">In your own words</div>
          <ul className="list-none m-0 p-0 space-y-2">
            {answer.echoes.map((e, i) => (
              <li key={i} className="border-l-2 border-[#E8C877]/60 pl-3">
                <span className="font-serif italic text-bodySm text-[var(--ai-text)]">“{e.words}”</span>
                {/^\d{4}-\d{2}-\d{2}$/.test(e.date || "") && <span className="block text-caption text-[var(--ai-text-3)]">{niceDate(e.date, true)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.question && <p className="font-serif text-body ai-gold-text italic m-0 mt-4">{answer.question}</p>}
      {answer.step && (
        <p className="text-bodySm text-[var(--ai-text)] m-0 mt-2">
          <span className="ai-gold-text font-medium">One small step · </span>{answer.step}
        </p>
      )}
      {drewFromLine(drewFrom) && <p className="text-caption text-[var(--ai-text-3)] m-0 mt-3">{drewFromLine(drewFrom)}</p>}
    </div>
  );
}
