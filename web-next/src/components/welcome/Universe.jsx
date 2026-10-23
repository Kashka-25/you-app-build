import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { BetaBadge } from "../SignIn";
import { InstallCard, SharePointer, markIntroSeen } from "../Intro";
import { easeOut } from "../ui/motion";
import { GlimpseChapters, GlimpseFlower, GlimpseJournal, GlimpseSky, GlimpseToday } from "./glimpses";

// The welcome page (Cassidy, Oct 23: "make it alluring"): Your Own Universe
// as a night sky. YOU sits at the centre, and around it, like planets in
// orbit, the six places of the app, each wearing its emblem from the YOU
// art set (the same ones as the side menu). The sky wakes star by star;
// tap YOU for what it's for, tap a star to see what lives there. Found
// stars ring gold and their paths to the centre light up; once all six are
// found the whole circle glows. Then: begin, and keep YOU on your phone.
// Always night here, in either mode: data-mode="dark" scopes the Cosmos
// colours to this page.
const PLACES = [
  { key: "home", name: "Home", icon: "home", color: "#d4a85a",
    line: "Where each day begins. Once a week you sow up to three things to grow (a habit, a goal, a dream), tend them with one small step a day, and harvest what grew at the week's end.",
    Glimpse: GlimpseToday },
  { key: "yourney", name: "YOUrney", icon: "yourney", color: "#c4783a",
    line: "Your life, told as a story. Gather moments and memories into chapters, see who you're becoming, and keep your dreams in sight.",
    Glimpse: GlimpseChapters },
  { key: "yournal", name: "YOUrnal", icon: "reflections", color: "#7a8c5e",
    line: "Write whatever's on your mind, or photograph a handwritten page. It's private to you, and AI reflections only happen if you say yes.",
    Glimpse: GlimpseJournal },
  { key: "kommyounity", name: "KommYOUnity", icon: "community", color: "#c98e6b",
    line: "A calm window onto Kronk, our small social space. Share what you choose, and only if you want to." },
  { key: "youniversity", name: "YOUniversity", icon: "youniversity", color: "#a06490",
    line: "Short guided courses and tools for when you want to go deeper: habits, healing, purpose, and more on the way." },
  { key: "you", name: "YOU", icon: "you", color: "#5f7f72",
    line: "Your eight Pillars bloom as a flower as you grow, and the values you live by shine as your own constellation, guiding you to your True North.",
    Glimpse: GlimpseYou }
];

function GlimpseYou() {
  return (
    <div className="space-y-4">
      <GlimpseFlower />
      <GlimpseSky />
    </div>
  );
}

// Around the circle, clockwise from the top; ORBIT is the radius as a share
// of the sky's width.
const ORBIT = 37;
const at = i => {
  const a = (-90 + i * (360 / PLACES.length)) * (Math.PI / 180);
  return { x: 50 + ORBIT * Math.cos(a), y: 50 + ORBIT * Math.sin(a) };
};

// When the opening finishes, in seconds: YOU first, then the stars wake.
const WAKE = 1.2;
const STAGGER = 0.16;
const SETTLED = WAKE + PLACES.length * STAGGER + 0.6;

export default function Universe({ onContinue }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(null); // a place key, or "centre"
  const [seen, setSeen] = useState(() => new Set());
  const [metYou, setMetYou] = useState(false);
  const place = PLACES.find(p => p.key === open);
  const all = seen.size === PLACES.length;
  const nextUnseen = PLACES.find(p => !seen.has(p.key) && p.key !== open);
  const t = s => (reduceMotion ? 0 : s);

  function visit(key) {
    setOpen(key);
    setSeen(s => new Set(s).add(key));
  }
  function meet() {
    setOpen("centre");
    setMetYou(true);
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
        className="relative w-full max-w-[480px] px-5 flex flex-col"
        style={{ paddingTop: "max(env(safe-area-inset-top), 32px)", paddingBottom: "calc(max(env(safe-area-inset-bottom), 16px) + 132px)" }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: t(0.8), delay: t(0.4), ease: easeOut }}
        >
          <BetaBadge />
          <h1 className="font-serif text-[28px] leading-tight mt-3">
            {/* Y, O, U: the name hiding in its own words. */}
            Explore <Gold>Y</Gold>our <Gold>O</Gold>wn <Gold>U</Gold>niverse
          </h1>
          <p className="text-bodySm text-textSecondary mt-1.5">YOU is at the centre. Every star around it is a part of YOU: tap to explore.</p>
        </motion.div>

        <div className="relative w-full aspect-square mt-9" role="group" aria-label="YOU, and the places around it">
          {/* A soft bloom behind the circle once every star is found. */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(closest-side, rgba(201,162,77,0.3), rgba(201,162,77,0))" }}
            initial={false}
            animate={{ opacity: all ? 1 : 0, scale: all ? 1.1 : 0.8 }}
            transition={{ duration: 1.4, ease: easeOut }}
          />
          <Orbits seen={seen} all={all} t={t} reduceMotion={reduceMotion} />
          <Centre onTap={meet} met={metYou} hint={!reduceMotion && !metYou && seen.size === 0} t={t} reduceMotion={reduceMotion} />
          {PLACES.map((p, i) => (
            <Star key={p.key} place={p} index={i} seen={seen.has(p.key)} reduceMotion={reduceMotion} onTap={() => visit(p.key)} />
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
        {open === "centre" && (
          <Sheet key="centre" title="Your Own Universe" emblem="/images/icons/you.png" color="#C9A24D" reduceMotion={reduceMotion} onClose={() => setOpen(null)}>
            <Purpose />
            <SheetButton onClick={() => (all ? go("signup") : visit((nextUnseen || PLACES[0]).key))} gold={all}>
              {all ? <><Sparkles size={17} strokeWidth={1.75} /> Begin your universe</> : <>Explore the stars <ArrowRight size={16} strokeWidth={1.75} /></>}
            </SheetButton>
          </Sheet>
        )}
        {place && (
          <Sheet key={place.key} title={place.name} emblem={`/images/icons/${place.icon}.png`} color={place.color} reduceMotion={reduceMotion} onClose={() => setOpen(null)}>
            <p className="text-body text-textSecondary mb-4">{place.line}</p>
            {place.Glimpse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.2 }}>
                <place.Glimpse />
              </motion.div>
            )}
            {all ? (
              <SheetButton onClick={() => go("signup")} gold><Sparkles size={17} strokeWidth={1.75} /> Begin your universe</SheetButton>
            ) : (
              <SheetButton onClick={() => (nextUnseen ? visit(nextUnseen.key) : setOpen(null))}>
                Next star{nextUnseen ? `: ${nextUnseen.name}` : ""} <ArrowRight size={16} strokeWidth={1.75} />
              </SheetButton>
            )}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function Gold({ children }) {
  return <b className="font-bold text-[#E5C470] [text-shadow:0_0_12px_rgba(229,196,112,0.45)]">{children}</b>;
}

// What YOU is for: shown when YOU, at the centre, is tapped.
function Purpose() {
  return (
    <div className="mb-1">
      <p className="font-serif text-[20px] leading-snug text-textPrimary mb-3">
        A quiet place to grow into who you already are.
      </p>
      <p className="text-body text-textSecondary mb-3">
        YOU is a living biography: your days, your values, your dreams and your story, held gently in one place. Not a feed to keep up with, and no streaks to keep. Just you, a little at a time, at your own pace.
      </p>
      <p className="text-body text-textSecondary">
        Everything around the centre is a part of you. Explore it in any order; it all grows together.
      </p>
      <p className="font-serif italic text-body text-textMuted mt-4 text-right">A message directly from YOU</p>
    </div>
  );
}

// The orbit itself, and a path from YOU to each star that lights gold once
// that star is found.
function Orbits({ seen, all, t, reduceMotion }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <motion.circle
        cx="50" cy="50" r={ORBIT}
        fill="none" stroke="#C9A24D" strokeWidth="0.3" strokeDasharray="0.6 1.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: all ? 0.85 : 0.4 }}
        transition={{ pathLength: { duration: t(1.6), delay: t(0.9), ease: "easeInOut" }, opacity: { duration: 0.8 } }}
      />
      {/* A wider, fainter ring turning slowly, for depth. */}
      <motion.g
        style={{ transformOrigin: "50px 50px", transformBox: "view-box" }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="50" cy="50" r="47" fill="none" stroke="#B8B5D6" strokeOpacity="0.12" strokeWidth="0.25" strokeDasharray="0.4 3" />
        <circle cx="50" cy="3" r="0.7" fill="#F3DE9C" fillOpacity="0.8" />
      </motion.g>
      {PLACES.map((p, i) => {
        const { x, y } = at(i);
        const lit = seen.has(p.key);
        // From just outside YOU to just inside the star.
        const dx = x - 50;
        const dy = y - 50;
        return (
          <motion.line
            key={p.key}
            x1={50 + dx * 0.42} y1={50 + dy * 0.42} x2={50 + dx * 0.8} y2={50 + dy * 0.8}
            stroke="#C9A24D" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: lit ? 0.9 : 0.14, strokeWidth: lit ? 0.5 : 0.3 }}
            transition={{ pathLength: { duration: t(0.8), delay: t(SETTLED - 0.4 + i * 0.05) }, opacity: { duration: 0.7 } }}
          />
        );
      })}
    </svg>
  );
}

// YOU at the centre: the full logo in a glowing disc, waking first.
// Pulses gently to be tapped until it has been.
function Centre({ onTap, met, hint, t, reduceMotion }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] aspect-square">
      <motion.button
        type="button"
        onClick={onTap}
        aria-label="YOU: what it's for"
        className="relative w-full h-full rounded-full outline-none group"
        initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: t(1.2), ease: easeOut }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[-14%] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(201,162,77,0.32), rgba(108,104,182,0.12) 60%, rgba(0,0,0,0))" }}
        />
        {hint && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#F3DE9C]"
            animate={{ opacity: [0.7, 0], scale: [1, 1.35] }}
            transition={{ duration: 2, repeat: Infinity, delay: SETTLED, ease: "easeOut" }}
          />
        )}
        <span
          className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(circle at 50% 40%, #1E1B3F 0%, #100F28 70%, #0A0A1C 100%)",
            boxShadow: `0 0 ${met ? 34 : 22}px rgba(201,162,77,${met ? 0.55 : 0.35}), inset 0 0 18px rgba(201,162,77,0.18)`,
            outline: "1.5px solid rgba(201,162,77,0.65)",
            outlineOffset: 3
          }}
        >
          <img src="/logo-full.png" alt="" width="720" height="621" className="w-[86%] h-auto [filter:drop-shadow(0_0_10px_rgba(201,162,77,0.35))]" />
        </span>
        {hint && (
          <motion.span
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 text-[11px] text-[#F3DE9C] whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SETTLED + 0.4 }}
            aria-hidden="true"
          >
            Tap YOU to begin
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

// One place on the orbit, wearing its emblem: wakes with a flare, breathes
// gently, rings gold once visited.
function Star({ place, index, seen, reduceMotion, onTap }) {
  const wake = reduceMotion ? 0 : WAKE + index * STAGGER;
  const { x, y } = at(index);
  // Labels sit outside the circle, away from YOU.
  const below = y >= 50;
  return (
    // Placed by a plain wrapper (Framer clears its own transform once the
    // wake animation ends), so the orb's centre sits on the orbit.
    <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[19%] aspect-square" style={{ left: `${x}%`, top: `${y}%` }}>
      <motion.button
        type="button"
        onClick={onTap}
        aria-label={`${place.name}${seen ? ", explored" : ""}`}
        className="relative w-full h-full rounded-full outline-none group"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, delay: wake, ease: [0.34, 1.56, 0.64, 1] }}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      >
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
        <motion.span
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${place.color} 35%, #1E1B3F) 0%, #12112C 72%)`,
            boxShadow: `0 0 ${seen ? 26 : 14}px color-mix(in srgb, ${place.color} ${seen ? 85 : 50}%, transparent)`,
            outline: seen ? "1.5px solid #E5C470" : "1px solid rgba(255,246,220,0.2)",
            outlineOffset: 2,
            transition: "box-shadow 0.6s, outline-color 0.6s"
          }}
          animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 3.2 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: wake + 1 }}
        >
          <img src={`/images/icons/${place.icon}.png`} alt="" width="128" height="128" className="w-[92%] h-[92%] object-contain" />
        </motion.span>
        <span
          className={`absolute left-1/2 -translate-x-1/2 ${below ? "top-full mt-1" : "bottom-full mb-1"} font-serif text-[14px] font-semibold whitespace-nowrap text-[#F2F1FA] [text-shadow:0_1px_6px_rgba(0,0,0,0.95)] group-focus-visible:underline`}
        >
          {place.name}
        </span>
      </motion.button>
    </div>
  );
}

// Six small stars that fill gold as places are found.
function Found({ count, all, delay }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2 mt-8 mb-7"
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

const GOLD = "bg-[linear-gradient(135deg,#E5C470_0%,#C9A24D_55%,#A9822F_100%)] text-[#1C1209]";

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
          className={`relative overflow-hidden w-full min-h-[52px] rounded-sm ${GOLD} font-semibold inline-flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(201,162,77,0.35)]`}
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

function SheetButton({ onClick, gold = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[50px] mt-5 rounded-sm inline-flex items-center justify-center gap-2 ${gold ? `${GOLD} font-semibold` : "border border-[rgba(201,162,77,0.55)] text-bodySm text-textPrimary"}`}
    >
      {children}
    </button>
  );
}

// A sheet sliding up from below: what lives at a star, or what YOU is for.
function Sheet({ title, emblem, color, reduceMotion, onClose, children }) {
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
        aria-label={title}
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
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full flex items-center justify-center bg-[#12112C]" style={{ boxShadow: `0 0 16px color-mix(in srgb, ${color} 60%, transparent)` }}>
                <img src={emblem} alt="" width="128" height="128" className="w-[92%] h-[92%] object-contain" />
              </span>
              <h2 className="font-serif text-[23px] leading-tight">{title}</h2>
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center text-textSecondary">
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ── The sky itself: nebulae, twinkling stars, shooting stars now and then ──
// Fixed positions (a seeded scatter), so the sky is the same every visit.
function scatter(n, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: rnd() * 100, y: rnd() * 100, r: 0.04 + rnd() * 0.13, d: rnd() * 6, p: 2.5 + rnd() * 4 }));
}
const DUST = scatter(110, 20261023);

// A shooting star every few seconds (Cassidy: "not too many, just every now
// and then"), each from a different place, at a slightly different angle.
function useShootingStars(reduceMotion) {
  const [shots, setShots] = useState([]);
  const id = useRef(0);
  useEffect(() => {
    if (reduceMotion) return;
    let timer;
    const fire = () => {
      const fromLeft = Math.random() < 0.65;
      const shot = {
        id: ++id.current,
        x: fromLeft ? 2 + Math.random() * 55 : 45 + Math.random() * 50,
        y: 2 + Math.random() * 45,
        angle: (fromLeft ? 1 : -1) * (14 + Math.random() * 22),
        length: 70 + Math.random() * 70,
        travel: 140 + Math.random() * 120,
        duration: 0.8 + Math.random() * 0.6
      };
      setShots(s => [...s.slice(-2), shot]);
      timer = setTimeout(fire, 4000 + Math.random() * 4000);
    };
    timer = setTimeout(fire, 2400);
    return () => clearTimeout(timer);
  }, [reduceMotion]);
  const done = sid => setShots(s => s.filter(x => x.id !== sid));
  return [shots, done];
}

function NightSky({ reduceMotion, glow }) {
  const [shots, done] = useShootingStars(reduceMotion);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <style>{`
        @keyframes you-twinkle { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }
        @keyframes you-drift { from { transform: rotate(0deg) scale(1.35) } to { transform: rotate(360deg) scale(1.35) } }
        @media (prefers-reduced-motion: reduce) { .you-star, .you-dust { animation: none !important } }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 60% at 50% -5%, rgba(108,104,182,0.45) 0%, rgba(108,104,182,0) 60%)," +
            "radial-gradient(70% 45% at 105% 75%, rgba(31,122,130,0.30) 0%, rgba(31,122,130,0) 60%)," +
            "radial-gradient(60% 40% at -10% 95%, rgba(160,100,144,0.28) 0%, rgba(160,100,144,0) 60%)"
        }}
      />
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 1.6 }}>
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
      {shots.map(s => {
        const dir = s.angle < 0 ? -1 : 1;
        return (
          // Positioned and angled by a plain wrapper; Framer only moves it along.
          <span key={s.id} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.angle + (dir < 0 ? 180 : 0)}deg)`, transformOrigin: "0 0" }}>
            <motion.span
              className="block h-[1.5px] rounded-full"
              style={{ width: s.length, background: "linear-gradient(90deg, rgba(255,246,220,0), rgba(255,246,220,0.95))", boxShadow: "0 0 6px rgba(255,246,220,0.6)" }}
              initial={{ opacity: 0, x: 0, scaleX: 0.3 }}
              animate={{ opacity: [0, 1, 0], x: s.travel, scaleX: 1 }}
              transition={{ duration: s.duration, ease: "easeOut" }}
              onAnimationComplete={() => done(s.id)}
            />
          </span>
        );
      })}
    </div>
  );
}
