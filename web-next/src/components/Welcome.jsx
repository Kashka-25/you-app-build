import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Feather, MessageSquareHeart, Sprout, Sun, Puzzle } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useAppData } from "../lib/AppDataContext";
import { usePlugin, useSetPlugin } from "../lib/plugins";
import { easeOut } from "./ui/motion";
import { BetaBadge } from "./SignIn";

// The first-run welcome: once per account (prefs.welcomed), replayable from
// Your Own Universe. One idea per page, one action at most, always a way
// out (Skip, Back, Escape). Nothing moves until the Seeker taps.
const STEPS = [
  {
    key: "welcome",
    image: "/images/home/welcome-day.webp",
    icon: Sun,
    title: "Welcome to Your Own Universe",
    body: "A quiet place to grow into who you already are. No streaks to keep, nothing to catch up on. Just you, a little at a time."
  },
  {
    key: "rhythm",
    image: "/images/home/tool-pursuits.webp",
    icon: Sprout,
    title: "Sow, tend, harvest",
    body: "Once a week, choose up to three things to grow: habits, goals or dreams. Each day, tend them with one small step. At the week's end, look back at what grew.",
    points: ["Sow · about five minutes, once a week", "Tend · a moment each day", "Harvest · a gentle look back"]
  },
  {
    key: "compass",
    image: "/images/home/yourney.webp",
    icon: Compass,
    title: "Your values, your compass",
    body: "Bring a few values into focus, in your own words. When they pull against each other, walk the Crossroads to find your True North. You'll find them under YOU."
  },
  {
    key: "yournal",
    image: "/images/home/tool-journal.webp",
    icon: Feather,
    title: "Write it down",
    body: "Your YOUrnal holds whatever's on your mind: entries, ideas, dreams. It's private to you.",
    points: ["AI reflections are off until you say yes", "You can turn them off again any time"]
  },
  {
    key: "yours",
    image: "/images/home/tool-focus.webp",
    icon: Puzzle,
    title: "Make it yours",
    body: "Keep only what helps. You can change this any time in Your Own Universe."
  },
  {
    key: "beta",
    image: "/images/home/community.webp",
    icon: MessageSquareHeart,
    title: "We're building this together",
    body: "YOU is in beta, so some things will change and a few may wobble. When something feels off, or wonderful, tell us.",
    points: ["Find your way · a map of YOU, in the side menu", "Send feedback · in the side menu", "Download your data · any time, in Your Own Universe", "AI · a small free allowance each month"]
  }
];

export default function Welcome({ onDone }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { setPrefs } = useAuth();
  const { profile, saveProfile } = useAppData();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const headingRef = useRef(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  useEffect(() => { if (profile?.name) setName(n => n || profile.name); }, [profile?.name]);
  // Screen readers hear each new page; keyboards start from its heading.
  useEffect(() => { headingRef.current?.focus(); }, [i]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") finish("/"); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function saveName() {
    const clean = name.trim();
    if (clean && clean !== (profile?.name || "")) {
      try { await saveProfile({ name: clean }); } catch (e) { console.error("[Welcome] name save failed:", e); }
    }
  }

  function go(delta) {
    if (step.key === "welcome") saveName();
    setDir(delta);
    setI(n => Math.min(STEPS.length - 1, Math.max(0, n + delta)));
  }

  async function finish(to) {
    if (step.key === "welcome") saveName();
    // Let them in even if the preference can't be saved right now.
    onDone();
    navigate(to, { replace: true });
    try { await setPrefs({ welcomed: true }); } catch (e) { console.error("[Welcome] couldn't remember welcome:", e); }
  }

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, x: 28 * dir },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 * dir },
        transition: { duration: 0.32, ease: easeOut }
      };

  return (
    <div className="min-h-dvh you-sky flex justify-center font-sans" role="dialog" aria-modal="true" aria-label="Welcome to YOU">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col px-5" style={{ paddingTop: "max(env(safe-area-inset-top), 16px)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
        <div className="flex items-center justify-between h-11">
          <span className="flex items-center gap-2">
            <img src="/logo-wordmark.png" alt="YOU" className="h-8 w-auto" />
            <BetaBadge className="!text-[9px] !px-1.5" />
          </span>
          {!last && (
            <button type="button" onClick={() => finish("/")} className="text-bodySm text-textSecondary px-2 min-h-[44px]">
              Skip
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step.key} {...slide}>
              <div className="relative rounded-card overflow-hidden shadow-card mb-6 aspect-[705/380]">
                <img src={step.image} alt="" width="705" height="380" decoding="async" className="absolute inset-0 w-full h-full object-cover dark:brightness-[0.7]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--surface-1)_55%,transparent)] to-transparent to-50%" />
                <span className="absolute left-3.5 bottom-3 w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--surface-1)_90%,transparent)] shadow-card flex items-center justify-center">
                  <step.icon size={19} strokeWidth={1.75} className="text-gold" aria-hidden="true" />
                </span>
              </div>

              <div className="text-label uppercase text-textMuted mb-1.5">{i + 1} of {STEPS.length}</div>
              <h1 ref={headingRef} tabIndex={-1} className="font-serif text-h1 text-textPrimary leading-tight mb-3 outline-none">
                {step.title}
              </h1>
              <p className="text-body text-textSecondary mb-4">{step.body}</p>

              {step.points && (
                <ul className="space-y-2 mb-4">
                  {step.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-bodySm text-textPrimary">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gold flex-none" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              {step.key === "welcome" && (
                <div className="mt-2">
                  <label htmlFor="welcome-name" className="block text-label uppercase text-textMuted mb-1.5">What would you like to be called?</label>
                  <input
                    id="welcome-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") go(1); }}
                    maxLength={60}
                    autoComplete="given-name"
                    placeholder="Optional"
                    className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field"
                  />
                </div>
              )}

              {step.key === "yours" && <TodoChoice />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div>
          <div className="flex justify-center gap-1.5 mb-5" aria-hidden="true">
            {STEPS.map((s, n) => (
              <span key={s.key} className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-6 bg-gold" : n < i ? "w-1.5 bg-[color-mix(in_srgb,var(--gold)_60%,transparent)]" : "w-1.5 bg-borderC"}`} />
            ))}
          </div>
          {last ? (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => finish("/sow")} className="min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium inline-flex items-center justify-center gap-2">
                <Sprout size={18} strokeWidth={1.75} /> Plant your first seeds
              </button>
              <button type="button" onClick={() => finish("/")} className="min-h-[44px] text-bodySm text-textSecondary">
                Look around first
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {i > 0 && (
                <button type="button" onClick={() => go(-1)} aria-label="Back" className="min-h-[50px] w-[50px] flex-none rounded-sm border border-borderC text-textPrimary inline-flex items-center justify-center">
                  <ArrowLeft size={18} strokeWidth={1.75} />
                </button>
              )}
              <button type="button" onClick={() => go(1)} className="flex-1 min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium inline-flex items-center justify-center gap-2">
                {i === 0 ? "Begin" : "Next"} <ArrowRight size={18} strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// The one optional part so far: Today's to-do list (lib/plugins.js).
function TodoChoice() {
  const on = usePlugin("todo_list");
  const setPlugin = useSetPlugin();
  const [error, setError] = useState("");
  async function pick(value) {
    setError("");
    try { await setPlugin("todo_list", value); } catch (e) {
      console.error("[Welcome] plugin change failed:", e);
      setError("Couldn't save that just now. You can set it later in Your Own Universe.");
    }
  }
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4">
      <div className="text-body text-textPrimary font-medium mb-0.5">A to-do list for today?</div>
      <div className="text-caption text-textMuted mb-3">For small things that aren't part of what you're growing. Whatever's left tonight falls away.</div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Today's to-do list">
        {[[true, "Yes, please"], [false, "Not for me"]].map(([value, label]) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={on === value}
            onClick={() => pick(value)}
            className={`min-h-[44px] rounded-sm border text-bodySm ${on === value ? "border-forestAccent bg-forestAccent text-onAccent font-medium" : "border-borderC text-textSecondary"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <div className="text-caption text-red-500 mt-2">{error}</div>}
    </div>
  );
}
