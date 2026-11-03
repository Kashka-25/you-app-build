import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Compass, Feather, Map as MapIcon, MessageSquareHeart, Sprout, Sun, Puzzle } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useAppData } from "../lib/AppDataContext";
import { PLUGINS, usePlugin, useSetPlugin } from "../lib/plugins";
import { useKronkLink } from "../lib/kronk";
import { easeOut } from "./ui/motion";
import { BetaBadge } from "./SignIn";

// The first-run welcome: once per account (prefs.welcomed), replayable from
// Settings. One idea per page, one action at most, always a way
// out (Skip, Back, Escape). Nothing moves until the Seeker taps.
// Rewritten Nov 3 for the simple-core beta: the five places, XP, values that
// grow, reflections over time and Extras, in the words of the Kronk intro.
const STEPS = [
  {
    key: "welcome",
    image: "/images/home/welcome-day.webp",
    icon: Sun,
    title: "Welcome to Your Own Universe",
    body: "A place to free the dream: to reflect on who you were, who you are, and who you are becoming, and to live it a little more each day."
  },
  {
    key: "places",
    image: "/images/home/welcome-sunrise.webp",
    icon: MapIcon,
    title: "Five places, that's all",
    body: "Everything in YOU lives in five places. You'll find them along the bar at the bottom and in the side menu.",
    points: [
      "Home · check in with how you feel, and see what today holds",
      "YOUrnal · write it down, or photograph a handwritten page",
      "YOUrney · your memories and moments: the story so far",
      "PursYOUts · your habits, goals and dreams in one clear vision",
      "YOU · your values and Pillars: your whole self at a glance"
    ]
  },
  {
    key: "rhythm",
    image: "/images/home/tool-pursuits.webp",
    icon: Sprout,
    title: "Your week, in three steps",
    body: "YOU works in a gentle weekly rhythm, named after a garden. Every step earns XP.",
    points: ["Sow · once a week, choose up to three of your PursYOUts to focus on", "Tend · each day, tick off one small step on Home (+3 XP, with a bonus for each week and month in a row)", "Harvest · at the week's end, look back at what grew", "Finish a habit, goal or dream · +10, +25 or +50 XP"]
  },
  {
    key: "compass",
    image: "/images/home/tool-mirror.webp",
    icon: Compass,
    title: "Live your values",
    body: "Choose the values you want to live by. Small, real-life challenges grow each one from Seed to Luminary, and the XP grows your Pillars too. When values pull against each other, walk the Crossroads to find your True North. You'll find it all under YOU."
  },
  {
    key: "yournal",
    image: "/images/home/tool-journal.webp",
    icon: Feather,
    title: "Find the gold in your own words",
    body: "Your YOUrnal is private to you. Type it, or photograph your handwritten pages. When you're ready, gentle AI reflections show what you've been through and the patterns that keep returning, and the more you live in YOU, the more personal they become.",
    points: ["Off until you say yes, and you can turn it off any time", "You choose what it may read, in Settings → Your data", "Your words are never used to train the AI"]
  },
  {
    key: "yours",
    image: "/images/home/tool-focus.webp",
    icon: Puzzle,
    title: "Start simple. Make it yours.",
    body: "YOU starts with just the five places. When you want more, switch on an Extra any time in Settings → Extras."
  },
  {
    key: "beta",
    image: "/images/home/community.webp",
    icon: MessageSquareHeart,
    title: "We're building this together",
    body: "YOU is in beta, so some things will change and a few may wobble. When something feels off, or wonderful, tell us. Which Extras you switch on helps us know what to grow.",
    points: ["Find your way · a map of YOU, in Settings", "Send feedback · in the side menu", "Download your data · any time, in Settings", "AI · a free allowance each month during the beta"]
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

              {step.key === "yours" && <ExtrasGlimpse />}
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

// The Extras as their emblems (Cassidy, Nov 3: show what's possible rather
// than one choice). Anyone who joined with Kronk is offered KommYOUnity, so
// their Kronk feed is there from the start.
function ExtrasGlimpse() {
  const kronk = useKronkLink();
  return (
    <div>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-3" aria-label="Extras you can switch on">
        {PLUGINS.filter(p => p.key !== "threshold").map(p => (
          <li key={p.key} className="flex flex-col items-center text-center">
            <img src={`/images/icons/${p.icon}.png`} alt="" width="52" height="52" className="w-[52px] h-[52px]" />
            <span className="mt-1 text-caption text-textSecondary leading-tight">{p.title}</span>
          </li>
        ))}
      </ul>
      {kronk && <KommYOUnityChoice />}
    </div>
  );
}

function KommYOUnityChoice() {
  const on = usePlugin("community");
  const setPlugin = useSetPlugin();
  const [error, setError] = useState("");
  async function pick(value) {
    setError("");
    try { await setPlugin("community", value); } catch (e) {
      console.error("[Welcome] plugin change failed:", e);
      setError("Couldn't save that just now. You can switch it on later in Settings → Extras.");
    }
  }
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mt-4">
      <div className="text-body text-textPrimary font-medium mb-0.5">You joined with Kronk. Switch on KommYOUnity?</div>
      <div className="text-caption text-textMuted mb-3">Your Kronk feed, inside YOU. Nothing from YOU is shared unless you share it.</div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="KommYOUnity">
        {[[true, "Yes, please"], [false, "Not now"]].map(([value, label]) => (
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
