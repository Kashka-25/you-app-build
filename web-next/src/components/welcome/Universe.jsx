import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Compass, Feather, Flower2, Sparkles, Sprout, Users, X } from "lucide-react";
import { BetaBadge } from "../SignIn";
import { InstallCard, SharePointer, markIntroSeen } from "../Intro";
import { easeOut } from "../ui/motion";
import { GlimpseFlower, GlimpseJournal, GlimpseSeeds, GlimpseSky } from "./glimpses";

// The welcome page (Cassidy, Oct 23: "make it alluring"): Your Own Universe
// as a night sky. The stars wake one by one, then every one of them is a
// part of YOU to tap and explore; visited stars ring gold and the threads
// between them light up, and once all six are found the whole constellation
// glows. Then: create an account, and keep YOU on your phone.
// Always night here, in either mode: data-mode="dark" scopes the Cosmos
// colours to this page.
const PLACES = [
  { key: "sow", name: "Sow & Harvest", Icon: Sprout, x: 24, y: 20, color: "#7a8c5e",
    line: "Each week, choose up to three things to grow: a habit, a goal, a dream. Tend them with one small step a day, then look back at what grew.", Glimpse: GlimpseSeeds },
  { key: "pillars", name: "Your Pillars", Icon: Flower2, x: 74, y: 14, color: "#d4a85a",
    line: "Body, Heart, Mind, Spirit and four more. Everything you do feeds one of them, and each grows a petal as it levels up.", Glimpse: GlimpseFlower },
  { key: "values", name: "Values", Icon: Compass, x: 50, y: 43, color: "#a06490",
    line: "Choose the values you want to live by. When two pull against each other, walk the Crossroads to find your True North.", Glimpse: GlimpseSky },
  { key: "yournal", name: "YOUrnal", Icon: Feather, x: 18, y: 64, color: "#b85f6e",
    line: "Write whatever's on your mind, or photograph a handwritten page. It's private to you, and AI reflections only happen if you say yes.", Glimpse: GlimpseJournal },
  { key: "youniversity", name: "YOUniversity", Icon: BookOpen, x: 80, y: 60, color: "#5f7f72",
    line: "Short guided courses and tools for when you want to go deeper: habits, healing, purpose, and more on the way." },
  { key: "kommyounity", name: "KommYOUnity", Icon: Users, x: 50, y: 80, color: "#c98e6b",
    line: "A calm window onto Kronk, our small social space. Share what you choose, and only if you want to." }
];
const THREADS = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [0, 3], [1, 4]];

// When the opening finishes, in seconds: logo, words, then the stars wake.
const WAKE = 1.1;
const STAGGER = 0.16;
const SETTLED = WAKE + PLACES.length * STAGGER + 0.6;

export default function Universe({ onContinue }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const place = PLACES.find(p => p.key === open);
  const all = seen.size === PLACES.length;
  const nextUnseen = PLACES.find(p => !seen.has(p.key) && p.key !== open);
  const t = s => (reduceMotion ? 0 : s);

  function visit(key) {
    setOpen(key);
    setSeen(s => new Set(s).add(key));
  }
  function go(mode) {
    markIntroSeen();
    onContinue(mode);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div data-mode="dark" className="relative min-h-dvh flex justify-center font-sans text-textPrimary bg-[#0A0A1C]">
      <NightSky reduceMotion={reduceMotion} glow={all} />

      <main
        className="relative w-full max-w-[480px] px-6 flex flex-col"
        style={{ paddingTop: "max(env(safe-area-inset-top), 36px)", paddingBottom: "calc(max(env(safe-area-inset-bottom), 16px) + 132px)" }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: t(1.1), ease: easeOut }}
        >
          <img
            src="/logo-full.png"
            alt="YOU — Your Own Universe"
            width="720"
            height="621"
            className="w-full max-w-[150px] h-auto mx-auto [filter:drop-shadow(0_0_24px_rgba(201,162,77,0.35))]"
          />
          <BetaBadge className="mt-2" />
        </motion.div>

        <motion.div
          className="text-center mt-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: t(0.8), delay: t(0.5), ease: easeOut }}
        >
          <h1 className="font-serif text-[28px] leading-tight">Explore Your Own Universe</h1>
          <p className="text-bodySm text-textSecondary mt-1.5">Every star is a part of YOU. Tap one to see what lives there.</p>
        </motion.div>

        <div className="relative w-full aspect-[4/5] mt-3" role="group" aria-label="Places in YOU">
          {/* A soft bloom behind the constellation once every star is found. */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-[-10%] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(closest-side, rgba(201,162,77,0.28), rgba(201,162,77,0))" }}
            initial={false}
            animate={{ opacity: all ? 1 : 0, scale: all ? 1 : 0.8 }}
            transition={{ duration: 1.4, ease: easeOut }}
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            {THREADS.map(([a, b], i) => {
              const lit = seen.has(PLACES[a].key) && seen.has(PLACES[b].key);
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={PLACES[a].x} y1={PLACES[a].y} x2={PLACES[b].x} y2={PLACES[b].y}
                  stroke="#C9A24D"
                  strokeWidth={lit ? 0.45 : 0.3}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: lit ? (all ? 0.95 : 0.7) : 0.16 }}
                  transition={{ pathLength: { duration: t(1.2), delay: t(SETTLED - 0.5 + i * 0.06), ease: "easeInOut" }, opacity: { duration: 0.8 } }}
                />
              );
            })}
          </svg>

          {PLACES.map((p, i) => (
            <Star
              key={p.key}
              place={p}
              index={i}
              seen={seen.has(p.key)}
              hint={!reduceMotion && seen.size === 0 && i === 2}
              reduceMotion={reduceMotion}
              onTap={() => visit(p.key)}
            />
          ))}
        </div>

        <Found count={seen.size} all={all} delay={t(SETTLED)} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: t(0.8), delay: t(SETTLED) }}>
          <InstallCard />
          <a href="/privacy" className="block text-center text-caption text-textMuted mt-6 underline underline-offset-2">
            Privacy &amp; beta terms
          </a>
        </motion.div>
      </main>

      <BeginBar all={all} onGo={go} delay={t(SETTLED - 0.3)} />
      <SharePointer lift={124} />

      <AnimatePresence>
        {place && (
          <PlaceSheet
            key={place.key}
            place={place}
            all={all}
            next={nextUnseen}
            reduceMotion={reduceMotion}
            onClose={() => setOpen(null)}
            onNext={() => (nextUnseen ? visit(nextUnseen.key) : setOpen(null))}
            onBegin={() => go("signup")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// One place in the sky: wakes with a flare, breathes gently, rings gold
// once visited. The first one to try pulses until anything is tapped.
function Star({ place, index, seen, hint, reduceMotion, onTap }) {
  const { Icon } = place;
  const wake = reduceMotion ? 0 : WAKE + index * STAGGER;
  return (
    <motion.button
      type="button"
      onClick={onTap}
      aria-label={`${place.name}${seen ? ", explored" : ""}`}
      className="absolute flex flex-col items-center gap-1.5 outline-none group"
      // The orb's centre (not the label's) sits on the point the threads meet.
      style={{ left: `${place.x}%`, top: `${place.y}%`, x: "-50%", y: -28 }}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay: wake, ease: [0.34, 1.56, 0.64, 1] }}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
    >
      <span className="relative w-14 h-14">
        {/* The flare as it wakes. */}
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, color-mix(in srgb, ${place.color} 80%, #FFF6DC) 0%, transparent 70%)` }}
            initial={{ opacity: 0.9, scale: 0.4 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 1.1, delay: wake, ease: "easeOut" }}
          />
        )}
        {hint && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#F3DE9C]"
            animate={{ opacity: [0.8, 0], scale: [1, 1.9] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: SETTLED, ease: "easeOut" }}
          />
        )}
        <motion.span
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${place.color} 65%, #FFF6DC) 0%, ${place.color} 55%, color-mix(in srgb, ${place.color} 40%, #0B0B1F) 100%)`,
            boxShadow: `0 0 ${seen ? 30 : 18}px color-mix(in srgb, ${place.color} ${seen ? 80 : 50}%, transparent)`,
            outline: seen ? "1.5px solid #C9A24D" : "1px solid rgba(255,246,220,0.18)",
            outlineOffset: 3,
            transition: "box-shadow 0.6s, outline-color 0.6s"
          }}
          animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 3.2 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: wake + 1 }}
        >
          <Icon size={22} strokeWidth={1.75} className="text-[#FBF3DF]" />
        </motion.span>
      </span>
      <span className="font-serif text-[14.5px] font-semibold whitespace-nowrap text-[#F2F1FA] [text-shadow:0_1px_6px_rgba(0,0,0,0.95)] group-focus-visible:underline">
        {place.name}
      </span>
      {hint && (
        <motion.span
          className="absolute top-full mt-1 text-[11px] text-[#F3DE9C] whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: SETTLED + 0.4 }}
          aria-hidden="true"
        >
          Tap me
        </motion.span>
      )}
    </motion.button>
  );
}

// Six small stars that fill gold as places are found.
function Found({ count, all, delay }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 mt-9 mb-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay }}
      aria-live="polite"
    >
      <div className="flex gap-2" aria-hidden="true">
        {PLACES.map((p, i) => (
          <motion.span
            key={p.key}
            className="w-2 h-2 rotate-45 rounded-[1px]"
            animate={{
              backgroundColor: i < count ? "#E5C470" : "rgba(242,241,250,0.18)",
              boxShadow: i < count ? "0 0 8px rgba(229,196,112,0.8)" : "0 0 0px rgba(0,0,0,0)"
            }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={all ? "all" : "some"}
          className={`text-center ${all ? "font-serif italic text-body text-[#F3DE9C]" : "text-caption text-textSecondary"}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.5 }}
        >
          {all ? "You've found every star. Your universe is waiting for you." : `${count} of ${PLACES.length} stars explored`}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// Always within reach: begin, or sign in. Shimmers once the sky is found.
function BeginBar({ all, onGo, delay }) {
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: easeOut }}
    >
      <div
        className="w-full max-w-[480px] px-6 pt-8 bg-gradient-to-t from-[#0A0A1C] via-[#0A0A1Cee] to-transparent"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
      >
        <button
          type="button"
          onClick={() => onGo("signup")}
          className="relative overflow-hidden w-full min-h-[52px] rounded-sm bg-[linear-gradient(135deg,#E5C470_0%,#C9A24D_55%,#A9822F_100%)] text-[#1C1209] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(201,162,77,0.35)]"
        >
          {all && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.55)] to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
            />
          )}
          <Sparkles size={17} strokeWidth={1.75} /> Begin your universe
        </button>
        <button type="button" onClick={() => onGo("signin")} className="w-full min-h-[40px] text-bodySm text-textSecondary">
          I already have an account
        </button>
      </div>
    </motion.div>
  );
}

// What lives at one star, sliding up from below, with a way on to the next.
function PlaceSheet({ place, all, next, reduceMotion, onClose, onNext, onBegin }) {
  const { Icon, Glimpse } = place;
  return (
    <>
      <motion.div
        className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={place.name}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center"
        initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ duration: 0.42, ease: easeOut }}
      >
        <div
          className="w-full max-w-[480px] max-h-[86dvh] overflow-y-auto rounded-t-[26px] bg-bg shadow-card px-5 pt-3 border-t border-[rgba(201,162,77,0.35)]"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
        >
          <div className="w-10 h-1 rounded-full bg-borderC mx-auto mb-3" aria-hidden="true" />
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: place.color, boxShadow: `0 0 16px ${place.color}` }}>
                <Icon size={17} strokeWidth={1.75} className="text-[#FBF3DF]" />
              </span>
              <h2 className="font-serif text-[22px] leading-tight">{place.name}</h2>
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center text-textSecondary">
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          <p className="text-body text-textSecondary mb-4">{place.line}</p>
          {Glimpse && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.2 }}>
              <Glimpse />
            </motion.div>
          )}
          {all ? (
            <button type="button" onClick={onBegin} className="w-full min-h-[50px] mt-5 rounded-sm bg-[linear-gradient(135deg,#E5C470_0%,#C9A24D_55%,#A9822F_100%)] text-[#1C1209] font-semibold inline-flex items-center justify-center gap-2">
              <Sparkles size={17} strokeWidth={1.75} /> Begin your universe
            </button>
          ) : (
            <button type="button" onClick={onNext} className="w-full min-h-[48px] mt-5 rounded-sm border border-[rgba(201,162,77,0.55)] text-bodySm text-textPrimary inline-flex items-center justify-center gap-2">
              Next star{next ? `: ${next.name}` : ""} <ArrowRight size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── The sky itself: nebulae, twinkling stars, the odd shooting star ──
// Fixed positions (a seeded scatter), so the sky is the same every visit.
function scatter(n, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd() * 100, y: rnd() * 100, r: 0.04 + rnd() * 0.13, d: rnd() * 6, p: 2.5 + rnd() * 4 }));
}
const DUST = scatter(110, 20261023);

function NightSky({ reduceMotion, glow }) {
  const [shot, setShot] = useState(null);
  useEffect(() => {
    if (reduceMotion) return;
    let timer;
    const fire = () => {
      setShot({ id: Date.now(), x: 10 + Math.random() * 60, y: 5 + Math.random() * 30 });
      timer = setTimeout(fire, 7000 + Math.random() * 6000);
    };
    timer = setTimeout(fire, 3200);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes you-twinkle { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }
        @keyframes you-drift { from { transform: rotate(0deg) scale(1.35) } to { transform: rotate(360deg) scale(1.35) } }
        @media (prefers-reduced-motion: reduce) { .you-star, .you-dust { animation: none !important } }
      `}</style>
      <div
        className="absolute inset-0 transition-opacity duration-[1500ms]"
        style={{
          background:
            "radial-gradient(110% 60% at 50% -5%, rgba(108,104,182,0.45) 0%, rgba(108,104,182,0) 60%)," +
            "radial-gradient(70% 45% at 105% 75%, rgba(31,122,130,0.30) 0%, rgba(31,122,130,0) 60%)," +
            "radial-gradient(60% 40% at -10% 95%, rgba(160,100,144,0.28) 0%, rgba(160,100,144,0) 60%)"
        }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 1.6 }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="you-dust absolute inset-0 w-full h-full" style={{ animation: "you-drift 400s linear infinite", transformOrigin: "50% 50%" }}>
          {DUST.map((d, i) => (
            <circle
              key={i}
              className="you-star"
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={i % 7 === 0 ? "#F3DE9C" : "#F2F1FA"}
              style={{ animation: `you-twinkle ${d.p}s ease-in-out ${d.d}s infinite` }}
            />
          ))}
        </svg>
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 40% at 50% 45%, rgba(201,162,77,0.14), rgba(201,162,77,0))" }}
        initial={false}
        animate={{ opacity: glow ? 1 : 0 }}
        transition={{ duration: 1.5 }}
      />
      <AnimatePresence>
        {shot && (
          <motion.span
            key={shot.id}
            className="absolute h-px w-24 origin-left"
            style={{ left: `${shot.x}%`, top: `${shot.y}%`, rotate: "22deg", background: "linear-gradient(90deg, rgba(255,246,220,0), rgba(255,246,220,0.9))" }}
            initial={{ opacity: 0, x: 0, y: 0, scaleX: 0.3 }}
            animate={{ opacity: [0, 1, 0], x: 160, y: 65, scaleX: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            onAnimationComplete={() => setShot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
