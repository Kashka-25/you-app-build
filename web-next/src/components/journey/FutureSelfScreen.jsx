import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Sprout, X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { useAuth } from "../../lib/AuthContext";
import { PILLARS } from "../../constants/app.const";
import { PillarSymbol, pillarColor } from "../ui/Pillar";
import { HORIZONS, horizonPhrase, recurringWords } from "../../lib/visions";
import { localDateKey } from "../../lib/week";
import PursuitPicker from "./PursuitPicker";
import { easeOut } from "../ui/motion";

// Meet your future self (Cassidy, Nov 4). A journey to tap through, built
// on what the research supports:
//  · a day in the life, written as if it's already true (Best Possible
//    Self; scripting; picturing the process, not just the outcome);
//  · through their eyes: what the closest people would say, at their most
//    loving and honest, with a moment they'd tell (self-distancing;
//    Reflected Best Self), then what's already a little true today (so it
//    never becomes an empty affirmation);
//  · a letter back from the future self (future-self continuity);
//  · what stands in the way, and an if-then plan (mental contrasting, WOOP);
//  · the first votes: pursuits that grow this self (identity-based habits).
// Every step but the name can be skipped. The writing is kept on this
// phone until the vision is saved, so nothing is lost by stepping away.

const MAX_VOICES = 5;
const draftKey = userId => `you.future-self-draft.${userId || "anon"}`;

const EMPTY = {
  horizon: "5y", day: "", voices: [{ who: "", says: "" }], title: "", statement: "",
  category: PILLARS[0], already: "", letter: "", obstacle: "", plan: "", itemIds: [], newHabit: ""
};

function loadDraft(userId) {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch { return EMPTY; }
}

const field = "w-full rounded-sm bg-white/10 border border-white/20 focus:border-white/60 outline-none px-3 py-2.5 text-body text-white placeholder:text-white/45";

export default function FutureSelfScreen() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { userId } = useAuth();
  const { profile, addIdentityVision, addItem } = useAppData();
  const [d, setD] = useState(() => loadDraft(userId));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstName = profile?.name?.trim().split(" ")[0] || "";
  const ahead = horizonPhrase(d.horizon);

  useEffect(() => {
    try { localStorage.setItem(draftKey(userId), JSON.stringify(d)); } catch { /* ignore */ }
  }, [d, userId]);

  const set = patch => setD(prev => ({ ...prev, ...patch }));
  const words = useMemo(() => recurringWords(d.voices), [d.voices]);

  function setVoice(i, patch) {
    set({ voices: d.voices.map((v, j) => (j === i ? { ...v, ...patch } : v)) });
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const itemIds = [...d.itemIds];
      if (d.newHabit.trim()) {
        const planted = await addItem({ name: d.newHabit.trim(), type: "habit", cat: d.category });
        if (planted?.id) itemIds.push(planted.id);
      }
      const voices = d.voices.map(v => ({ who: v.who.trim(), says: v.says.trim() })).filter(v => v.who || v.says);
      const journey = {
        horizon: d.horizon,
        ...(d.day.trim() && { day: d.day.trim() }),
        ...(voices.length && { voices }),
        ...(d.already.trim() && { already: d.already.trim() }),
        ...(d.letter.trim() && { letter: d.letter.trim() }),
        ...(d.obstacle.trim() && { obstacle: d.obstacle.trim() }),
        ...(d.plan.trim() && { plan: d.plan.trim() })
      };
      await addIdentityVision({
        category: d.category, title: d.title, statement: d.statement, visionDate: localDateKey(), journey, itemIds
      });
      try { localStorage.removeItem(draftKey(userId)); } catch { /* ignore */ }
      navigate("/journey", { replace: true, state: { tab: "identity" } });
    } catch (e) {
      console.error("[FutureSelf] save failed:", e);
      setError("Couldn't keep this just now. Your words are safe on this phone; check your connection and try again.");
      setSaving(false);
    }
  }

  const steps = [
    // 0 · Arrive
    {
      key: "arrive",
      body: (
        <>
          <h1 className="font-serif text-[38px] leading-[1.1] m-0">Meet your future self</h1>
          <p className="text-body text-white/85 mt-3">
            A quiet walk to the person you're becoming, and back again with something to carry. There are no right answers, and you can skip anything.
          </p>
          <div className="text-label uppercase tracking-[0.18em] text-white/70 mt-7 mb-2">How far ahead are we going?</div>
          <div role="radiogroup" aria-label="How far ahead" className="flex flex-col gap-2">
            {HORIZONS.map(h => (
              <button
                key={h.key}
                type="button"
                role="radio"
                aria-checked={d.horizon === h.key}
                onClick={() => set({ horizon: h.key })}
                className={`min-h-[48px] px-4 rounded-full text-left text-body border transition-colors ${d.horizon === h.key ? "bg-white text-[#24183A] border-white font-medium" : "bg-white/5 border-white/25 text-white hover:bg-white/10"}`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <p className="text-bodySm text-white/70 mt-6">Before we go: one slow breath in… and all the way out.</p>
        </>
      )
    },
    // 1 · A day in your life
    {
      key: "day",
      skip: true,
      body: (
        <>
          <Kicker>A day in your life</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">It's an ordinary day, {ahead} from now.</h2>
          <ul className="text-bodySm text-white/80 mt-3 mb-4 pl-4 space-y-1 list-disc marker:text-white/40">
            <li>Where do you wake up, and who's there?</li>
            <li>What do you do first, and how does your body feel?</li>
            <li>What fills your day: your work, your play, your people?</li>
            <li>As the day ends, what are you quietly proud of?</li>
          </ul>
          <textarea
            className={`${field} min-h-[200px]`}
            value={d.day}
            onChange={e => set({ day: e.target.value })}
            placeholder="I wake to…"
            aria-label="A day in your life"
          />
          <p className="text-caption text-white/60 mt-2">Write as if it's already true: "I wake…", "I spend my mornings…".</p>
        </>
      )
    },
    // 2 · Through their eyes
    {
      key: "voices",
      skip: true,
      body: (
        <>
          <Kicker>Through their eyes</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">The people closest to you gather to celebrate you.</h2>
          <p className="text-bodySm text-white/80 mt-2 mb-4">
            It's {ahead} from now. Picture them at their most loving and honest. What do they say about who you've become, and what's a moment they'd tell? Start with one person; up to five.
          </p>
          {d.voices.map((v, i) => (
            <div key={i} className="rounded-sm bg-white/5 border border-white/15 p-3 mb-2.5">
              <input
                className={`${field} mb-2`}
                value={v.who}
                onChange={e => setVoice(i, { who: e.target.value })}
                placeholder={i === 0 ? "Who? (a friend, Mum, my teacher, my dog…)" : "Who?"}
                aria-label={`Person ${i + 1}`}
              />
              <textarea
                className={`${field} min-h-[96px]`}
                value={v.says}
                onChange={e => setVoice(i, { says: e.target.value })}
                placeholder="They say…"
                aria-label={`What person ${i + 1} says`}
              />
            </div>
          ))}
          {d.voices.length < MAX_VOICES && (
            <button
              type="button"
              onClick={() => set({ voices: [...d.voices, { who: "", says: "" }] })}
              className="inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-white/85"
            >
              <Plus size={16} strokeWidth={1.75} /> Add someone
            </button>
          )}
        </>
      )
    },
    // 3 · Name who you're becoming
    {
      key: "name",
      need: () => d.title.trim() ? "" : "Give who you're becoming a name, even a rough one.",
      body: (
        <>
          <Kicker>Who you're becoming</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">Read their words. What keeps coming up?</h2>
          {words.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3" aria-label="Words that came up">
              {words.map(w => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => set({ title: d.title.trim() ? d.title : w.word[0].toUpperCase() + w.word.slice(1) })}
                  className="min-h-[34px] px-3 rounded-full bg-white/10 border border-white/20 text-bodySm text-white"
                >
                  {w.word}{w.n > 1 && <span className="text-white/60"> ×{w.n}</span>}
                </button>
              ))}
            </div>
          )}
          <label className="block text-label uppercase tracking-[0.14em] text-white/70 mt-5 mb-1.5" htmlFor="fs-title">A name for who you're becoming</label>
          <input id="fs-title" className={field} value={d.title} onChange={e => set({ title: e.target.value })} placeholder="Healer · A steady, present parent · Poet" />
          <label className="block text-label uppercase tracking-[0.14em] text-white/70 mt-4 mb-1.5" htmlFor="fs-statement">In a line, who is that?</label>
          <textarea id="fs-statement" className={`${field} min-h-[72px]`} value={d.statement} onChange={e => set({ statement: e.target.value })} placeholder="Someone who…" />
          <div className="text-label uppercase tracking-[0.14em] text-white/70 mt-4 mb-1.5">Which part of life is this?</div>
          <div role="radiogroup" aria-label="Which part of life is this" className="grid grid-cols-2 gap-1.5">
            {PILLARS.map(p => {
              const on = d.category === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ category: p })}
                  className={`flex items-center gap-2 min-h-[44px] px-2.5 rounded-sm border text-bodySm text-left ${on ? "bg-white/20 text-white font-medium" : "bg-white/5 border-white/15 text-white/85"}`}
                  style={on ? { borderColor: pillarColor(p) } : undefined}
                >
                  <PillarSymbol pillar={p} size={24} /> <span className="truncate">{p}</span>
                </button>
              );
            })}
          </div>
          <label className="block text-label uppercase tracking-[0.14em] text-white/70 mt-5 mb-1.5" htmlFor="fs-already">What would they say is already a little true today?</label>
          <textarea id="fs-already" className={`${field} min-h-[72px]`} value={d.already} onChange={e => set({ already: e.target.value })} placeholder="Already, sometimes, I…" />
        </>
      )
    },
    // 4 · A letter back
    {
      key: "letter",
      skip: true,
      body: (
        <>
          <Kicker>A letter back</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">{d.title.trim() ? `${d.title.trim()} writes back to you, today.` : "Your future self writes back to you, today."}</h2>
          <p className="text-bodySm text-white/80 mt-2 mb-4">What do they want you to know? What are they grateful you did?</p>
          <textarea
            className={`${field} min-h-[220px] font-serif text-[18px] leading-relaxed`}
            value={d.letter}
            onChange={e => set({ letter: e.target.value })}
            placeholder={firstName ? `Dear ${firstName},` : "Dear me,"}
            aria-label="A letter from your future self"
          />
        </>
      )
    },
    // 5 · What stands in the way
    {
      key: "way",
      skip: true,
      body: (
        <>
          <Kicker>What stands in the way</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">What in you, today, gets between you and them?</h2>
          <p className="text-bodySm text-white/80 mt-2 mb-3">A habit, a fear, a story you tell yourself. Naming it gently is what turns a dream into a path.</p>
          <textarea className={`${field} min-h-[96px]`} value={d.obstacle} onChange={e => set({ obstacle: e.target.value })} placeholder="When I'm tired, I…" aria-label="What stands in the way" />
          <label className="block text-label uppercase tracking-[0.14em] text-white/70 mt-5 mb-1.5" htmlFor="fs-plan">When that happens, I will…</label>
          <textarea id="fs-plan" className={`${field} min-h-[80px]`} value={d.plan} onChange={e => set({ plan: e.target.value })} placeholder="…take one small step anyway: write one line." />
        </>
      )
    },
    // 6 · Your first votes
    {
      key: "votes",
      body: (
        <>
          <Kicker>Your first votes</Kicker>
          <h2 className="font-serif text-[30px] leading-tight m-0">Every small action is a vote for who you're becoming.</h2>
          <p className="text-bodySm text-white/80 mt-2 mb-4">Which of your pursuits already grow {d.title.trim() || "this self"}? Choose any, or none.</p>
          <PursuitPicker value={d.itemIds} onChange={ids => set({ itemIds: ids })} pillar={d.category} tone="night" />
          <label className="flex items-center gap-1.5 text-label uppercase tracking-[0.14em] text-white/70 mt-6 mb-1.5" htmlFor="fs-new">
            <Sprout size={14} strokeWidth={1.75} /> Or plant one small new habit
          </label>
          <input id="fs-new" className={field} value={d.newHabit} onChange={e => set({ newHabit: e.target.value })} placeholder="Write one line a day" />
        </>
      )
    }
  ];

  const current = steps[step];
  const last = step === steps.length - 1;
  const blocked = current.need?.() || "";

  function go(delta) {
    if (delta > 0 && blocked) return setError(blocked);
    setError("");
    setDir(delta);
    setStep(n => Math.max(0, Math.min(steps.length - 1, n + delta)));
    window.scrollTo?.(0, 0);
  }

  return (
    <div
      className="min-h-dvh text-white font-sans"
      style={{ background: "linear-gradient(170deg, #F1DFB4 -20%, #B78DA8 22%, #5E4A86 55%, #1B1638 100%)" }}
    >
      <div className="max-w-[560px] mx-auto px-6 pb-36" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <span key={s.key} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close. Your words stay on this phone."
            className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        {/* Each step fades in on its own; nothing waits for the last one to
            leave, so a paused animation can never hold a step back. */}
        <motion.div
          key={current.key}
          initial={reduce ? false : { opacity: 0, x: 24 * dir }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ease: easeOut, duration: 0.45 }}
          className="pt-10"
        >
          {current.body}
        </motion.div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#1B1638] via-[#1B1638]/90 to-transparent pt-10" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
        <div className="max-w-[560px] mx-auto px-6">
          {error && <div className="text-bodySm text-[#FFD9C7] mb-2" role="alert">{error}</div>}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={() => go(-1)} aria-label="Back" className="w-12 h-12 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                <ArrowLeft size={20} strokeWidth={1.75} />
              </button>
            )}
            {current.skip && (
              <button type="button" onClick={() => go(1)} className="min-h-[48px] px-4 text-bodySm text-white/80">Skip</button>
            )}
            <span className="flex-1" />
            {last ? (
              <button type="button" onClick={finish} disabled={saving} className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-white text-[#24183A] font-medium disabled:opacity-60">
                {saving ? "Keeping it…" : "Keep this vision"}
              </button>
            ) : (
              <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-white text-[#24183A] font-medium">
                {step === 0 ? "Begin" : "Next"} <ArrowRight size={18} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kicker({ children }) {
  return <div className="text-label uppercase tracking-[0.2em] text-white/70 mb-2">{children}</div>;
}
