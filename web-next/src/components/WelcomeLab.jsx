import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, Compass, Feather, FlaskConical, Flower2, Sprout, Users, X } from "lucide-react";
import Intro, { InstallCard } from "./Intro";
import { BetaBadge } from "./SignIn";
import { PillarWheel } from "./pillars/PillarsPanel";
import ValuesSky from "./values/ValuesSky";
import { XpBar } from "./ui/XpBar";
import { easeOut } from "./ui/motion";
import { INNER_PILLARS, PILLARS, PILLAR_COLORS } from "../constants/app.const";
import { elementColor } from "../lib/elements";

// The welcome lab (Cassidy, Oct 22): a few versions of the page a brand-new
// YOUser sees, side by side, to try on a phone and keep the one that feels
// right. Hidden at /welcome-lab; nothing here touches anyone's account.
// Every glimpse runs on made-up demo data.
const DESIGNS = [
  { key: "message", label: "Simple message" },
  { key: "peek", label: "Peek inside" },
  { key: "universe", label: "Explore the universe" },
  { key: "week", label: "A week in YOU" }
];

export default function WelcomeLab({ onContinue }) {
  const [design, setDesign] = useState(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    return DESIGNS.some(x => x.key === d) ? d : "message";
  });
  function pick(key) {
    setDesign(key);
    window.history.replaceState(null, "", `/welcome-lab?d=${key}`);
    window.scrollTo(0, 0);
  }
  return (
    <div className="relative">
      <LabBar design={design} onPick={pick} />
      {design === "message" && <Intro onContinue={onContinue} />}
      {design === "peek" && <Intro onContinue={onContinue} between={<PeekStrip />} />}
      {design === "universe" && <UniverseDesign onContinue={onContinue} />}
      {design === "week" && <WeekDesign onContinue={onContinue} />}
    </div>
  );
}

// The lab's own switcher: dashed, so it's plainly not part of any design.
function LabBar({ design, onPick }) {
  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center px-2 pointer-events-none" style={{ paddingTop: "max(env(safe-area-inset-top), 6px)" }}>
      <div className="pointer-events-auto max-w-full flex items-center gap-1 rounded-full border border-dashed border-[color-mix(in_srgb,var(--gold)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface-1)_94%,transparent)] backdrop-blur shadow-card px-1.5 py-1 overflow-x-auto">
        <FlaskConical size={14} strokeWidth={1.75} className="text-gold flex-none ml-1" aria-label="Welcome lab" />
        {DESIGNS.map((d, i) => (
          <button
            key={d.key}
            type="button"
            onClick={() => onPick(d.key)}
            aria-pressed={design === d.key}
            className={`flex-none rounded-full px-2.5 py-1 text-[11.5px] whitespace-nowrap ${design === d.key ? "bg-forestAccent text-onAccent font-medium" : "text-textSecondary"}`}
          >
            {i + 1} · {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Demo data: a YOUser a few weeks in ──
const DEMO_LEVELS = { Body: [2, 60], Heart: [3, 30], Mind: [1, 80], Spirit: [2, 20], Connection: [1, 50], Purpose: [2, 70], Play: [1, 35], "Home & Earth": [1, 15] };
const DEMO_PILLARS = PILLARS.map(name => ({
  name,
  color: PILLAR_COLORS[name],
  level: DEMO_LEVELS[name][0],
  pct: DEMO_LEVELS[name][1],
  inner: INNER_PILLARS.includes(name)
}));
const DEMO_STARS = [
  { name: "Courage", element: "Fire", pct: 70, tier: "Embodying" },
  { name: "Compassion", element: "Water", pct: 40, tier: "Practising" },
  { name: "Freedom", element: "Air", pct: 85, tier: "Mastering" },
  { name: "Wonder", element: "Ether", pct: 25, tier: "Awakening" }
].map(s => ({ ...s, color: elementColor(s.element) }));
const DEMO_SEEDS = [
  { name: "Walk at sunrise", kind: "Habit", pillar: "Body", pct: 70 },
  { name: "Finish the first chapter", kind: "Goal", pillar: "Purpose", pct: 40 },
  { name: "See the northern lights", kind: "Dream", pillar: "Spirit", pct: 20 }
];

// ── Glimpses: small, real pieces of YOU ──
function GlimpseFlower() {
  const [sel, setSel] = useState(null);
  const p = DEMO_PILLARS.find(x => x.name === sel);
  return (
    <div>
      <div className="max-w-[230px] mx-auto">
        <PillarWheel pillars={DEMO_PILLARS} selected={sel} onSelect={n => setSel(s => (s === n ? null : n))} />
      </div>
      <div className="h-9 mt-1 text-center text-caption text-textMuted">
        {p ? (
          <div className="max-w-[220px] mx-auto">
            <span className="text-textPrimary font-medium">{p.name}</span> · level {p.level}
            <XpBar pct={p.pct} color={p.color} className="mt-1" />
          </div>
        ) : (
          "Tap a petal"
        )}
      </div>
    </div>
  );
}

function GlimpseSky() {
  const [open, setOpen] = useState(null);
  const s = DEMO_STARS.find(x => x.name === open);
  return (
    <div>
      <ValuesSky stars={DEMO_STARS} total={5} open={open} onSelect={n => setOpen(o => (o === n ? null : n))} onAdd={() => {}} />
      <div className="h-5 -mt-2 text-center text-caption text-textMuted">
        {s ? <><span className="text-textPrimary font-medium">{s.name}</span> · {s.element} · {s.tier}</> : "Tap a star"}
      </div>
    </div>
  );
}

function GlimpseJournal() {
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 text-left">
      <div className="text-label uppercase text-textMuted mb-1.5">Tuesday evening</div>
      <p className="font-serif text-[17px] leading-snug text-textPrimary italic mb-3">
        Walked the long way home tonight. The sky went pink over the water and for a minute I didn't think about anything at all.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {["grateful", "calm", "#Body"].map(t => (
          <span key={t} className="rounded-full border border-borderC px-2 py-0.5 text-[11px] text-textSecondary">{t}</span>
        ))}
      </div>
    </div>
  );
}

function GlimpseSeeds() {
  return (
    <div className="space-y-2.5 text-left">
      {DEMO_SEEDS.map(s => (
        <div key={s.name} className="rounded-sm bg-surface1 shadow-card px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-bodySm text-textPrimary font-medium">{s.name}</span>
            <span className="text-[10.5px] uppercase tracking-wide flex-none" style={{ color: PILLAR_COLORS[s.pillar] }}>{s.kind}</span>
          </div>
          <XpBar pct={s.pct} color={PILLAR_COLORS[s.pillar]} />
        </div>
      ))}
    </div>
  );
}

function GlimpseDays() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const tended = [true, true, false, true, true, false, false];
  return (
    <div className="flex justify-between max-w-[280px] mx-auto">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center ${tended[i] ? "bg-[color-mix(in_srgb,var(--sage)_85%,transparent)] text-onAccent" : "border border-dashed border-borderC text-textMuted"}`}
          >
            {tended[i] ? <Sprout size={15} strokeWidth={2} /> : null}
          </span>
          <span className="text-[11px] text-textMuted">{d}</span>
        </div>
      ))}
    </div>
  );
}

// ── Design 2: Peek inside (a swipeable strip within the simple message) ──
const PEEKS = [
  { title: "Sow, tend, harvest", line: "Choose up to three things to grow each week, and tend them a little each day.", Glimpse: GlimpseSeeds },
  { title: "Your eight Pillars", line: "Every step you take grows a petal. Watch your whole self flower over time.", Glimpse: GlimpseFlower },
  { title: "Your values sky", line: "The values that guide you, as stars that brighten as you live them.", Glimpse: GlimpseSky },
  { title: "Your YOUrnal", line: "Somewhere to put down what's on your mind. Private to you, always.", Glimpse: GlimpseJournal }
];

function PeekStrip() {
  const ref = useRef(null);
  const [at, setAt] = useState(0);
  function onScroll() {
    const el = ref.current;
    if (!el) return;
    setAt(Math.round(el.scrollLeft / (el.firstChild?.offsetWidth || 1)));
  }
  function go(i) {
    const el = ref.current;
    const card = el?.children[i];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 4, behavior: "smooth" });
  }
  return (
    <section className="mt-8 -mx-6">
      <h2 className="font-serif text-h2 text-textPrimary px-6 mb-1">Take a peek inside</h2>
      <p className="text-bodySm text-textMuted px-6 mb-3">Swipe across, and tap around. It's all pretend for now.</p>
      <div ref={ref} onScroll={onScroll} className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PEEKS.map(({ title, line, Glimpse }) => (
          <article key={title} className="snap-center flex-none w-[86%] rounded-card bg-[color-mix(in_srgb,var(--surface-1)_80%,transparent)] border border-borderC p-4">
            <div className="min-h-[260px] flex flex-col justify-center">
              <Glimpse />
            </div>
            <h3 className="font-serif text-h3 text-textPrimary mt-3 mb-0.5">{title}</h3>
            <p className="text-bodySm text-textSecondary">{line}</p>
          </article>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {PEEKS.map((p, i) => (
          <button key={p.title} type="button" onClick={() => go(i)} aria-label={p.title}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === at ? "w-6 bg-gold" : "w-1.5 bg-borderC"}`} />
        ))}
      </div>
    </section>
  );
}

// ── Shared ending: create an account, or sign in ──
function Begin({ onContinue, dark = false }) {
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => onContinue("signup")} className="min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium">
        Create my account
      </button>
      <button type="button" onClick={() => onContinue("signin")} className={`min-h-[44px] text-bodySm ${dark ? "text-[#B8B5D6]" : "text-textSecondary"}`}>
        I already have an account
      </button>
    </div>
  );
}

// ── Design 3: Explore the universe (a night sky of places to tap) ──
const PLACES = [
  { key: "sow", name: "Sow & Harvest", Icon: Sprout, x: 24, y: 22, color: "#7a8c5e", line: "Each week, choose up to three things to grow: a habit, a goal, a dream. Tend them with one small step a day, then look back at what grew.", Glimpse: GlimpseSeeds },
  { key: "pillars", name: "Your Pillars", Icon: Flower2, x: 72, y: 16, color: "#d4a85a", line: "Body, Heart, Mind, Spirit and four more. Everything you do feeds one of them, and each grows a petal as it levels up.", Glimpse: GlimpseFlower },
  { key: "values", name: "Values", Icon: Compass, x: 50, y: 44, color: "#a06490", line: "Choose the values you want to live by. When two pull against each other, walk the Crossroads to find your True North.", Glimpse: GlimpseSky },
  { key: "yournal", name: "YOUrnal", Icon: Feather, x: 18, y: 64, color: "#b85f6e", line: "Write whatever's on your mind, or photograph a handwritten page. It's private to you, and AI reflections only happen if you say yes.", Glimpse: GlimpseJournal },
  { key: "youniversity", name: "YOUniversity", Icon: BookOpen, x: 78, y: 60, color: "#5f7f72", line: "Short guided courses and tools for when you want to go deeper: habits, healing, purpose, and more on the way." },
  { key: "kommyounity", name: "KommYOUnity", Icon: Users, x: 50, y: 82, color: "#c98e6b", line: "A calm window onto Kronk, our small social space. Share what you choose, and only if you want to." }
];

function UniverseDesign({ onContinue }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const place = PLACES.find(p => p.key === open);
  function visit(key) {
    setOpen(key);
    setSeen(s => new Set(s).add(key));
  }
  const all = seen.size === PLACES.length;

  return (
    // Always night here: the Cosmos colours apply inside, in either mode.
    <div
      data-mode="dark"
      className="min-h-dvh flex justify-center font-sans text-[#F2F1FA]"
      style={{ background: "radial-gradient(120% 70% at 50% 0%, rgba(108,104,182,0.4) 0%, rgba(108,104,182,0) 60%), radial-gradient(90% 60% at 100% 100%, rgba(31,122,130,0.25) 0%, rgba(31,122,130,0) 60%), #0B0B1F" }}
    >
      <main className="w-full max-w-[480px] px-6 flex flex-col" style={{ paddingTop: "max(env(safe-area-inset-top), 56px)", paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}>
        <div className="text-center">
          <img src="/logo-full.png" alt="YOU — Your Own Universe" width="720" height="621" className="w-full max-w-[150px] h-auto mx-auto" />
          <BetaBadge className="mt-2" />
          <h1 className="font-serif text-h1 leading-tight mt-5">Explore Your Own Universe</h1>
          <p className="text-bodySm text-[#B8B5D6] mt-1.5">Every star is a part of YOU. Tap one to see what lives there.</p>
        </div>

        <div className="relative w-full aspect-[4/5] mt-4" role="group" aria-label="Places in YOU">
          {/* Faint threads between the places, like a constellation. */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            {[[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5]].map(([a, b]) => (
              <line key={`${a}${b}`} x1={PLACES[a].x} y1={PLACES[a].y} x2={PLACES[b].x} y2={PLACES[b].y}
                stroke="#C9A24D" strokeOpacity={seen.has(PLACES[a].key) && seen.has(PLACES[b].key) ? 0.6 : 0.15} strokeWidth="0.35" strokeDasharray="1 1.4" />
            ))}
          </svg>
          {PLACES.map((p, i) => {
            const was = seen.has(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => visit(p.key)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <motion.span
                  animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${p.color} 70%, #FFF6DC) 0%, ${p.color} 55%, color-mix(in srgb, ${p.color} 40%, #0B0B1F) 100%)`,
                    boxShadow: `0 0 ${was ? 26 : 16}px color-mix(in srgb, ${p.color} ${was ? 75 : 45}%, transparent)`,
                    outline: was ? "1.5px solid #C9A24D" : "none",
                    outlineOffset: 3
                  }}
                >
                  <p.Icon size={22} strokeWidth={1.75} className="text-[#FBF3DF]" />
                </motion.span>
                <span className="font-serif text-[14px] font-semibold whitespace-nowrap [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">{p.name}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-caption text-[#B8B5D6] mt-2 mb-6" aria-live="polite">
          {all ? "You've seen it all. Your universe is waiting for you." : `${seen.size} of ${PLACES.length} explored`}
        </p>

        <Begin onContinue={onContinue} dark />
        <InstallCard />
      </main>

      <AnimatePresence>
        {place && (
          <>
            <motion.div key="shade" className="fixed inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={place.name}
              className="fixed inset-x-0 bottom-0 z-40 flex justify-center"
              initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="w-full max-w-[480px] max-h-[85dvh] overflow-y-auto rounded-t-[24px] bg-bg text-textPrimary shadow-card px-5 pt-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: place.color }}>
                      <place.Icon size={16} strokeWidth={1.75} className="text-[#FBF3DF]" />
                    </span>
                    <h2 className="font-serif text-h2">{place.name}</h2>
                  </span>
                  <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center text-textSecondary">
                    <X size={18} strokeWidth={1.75} />
                  </button>
                </div>
                <p className="text-body text-textSecondary mb-4">{place.line}</p>
                {place.Glimpse && <place.Glimpse />}
                <button type="button" onClick={() => setOpen(null)} className="w-full min-h-[46px] mt-5 rounded-sm border border-borderC text-bodySm text-textPrimary">
                  {all ? "Back to the sky" : "Keep exploring"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Design 4: A week in YOU (a story that unfolds as you scroll) ──
const WEEK = [
  { when: "Monday", title: "Sow", line: "Five quiet minutes to choose what you'd like to grow this week. A habit, a goal, a dream. Three at most.", Glimpse: GlimpseSeeds },
  { when: "Every day", title: "Tend", line: "One small step, whenever it suits you. Miss a day and nothing breaks; you just pick it up again.", Glimpse: GlimpseDays },
  { when: "Whenever you like", title: "Write", line: "Your YOUrnal is there for the thoughts that need somewhere to land.", Glimpse: GlimpseJournal },
  { when: "Over time", title: "Grow", line: "Every step feeds one of your eight Pillars. Slowly, your whole self comes into flower.", Glimpse: GlimpseFlower },
  { when: "Always", title: "Your compass", line: "The values you choose light up like stars, so you can see where you're heading.", Glimpse: GlimpseSky },
  { when: "Sunday", title: "Harvest", line: "A gentle look back at what grew, what didn't, and what you'd like to carry into next week.", Glimpse: GlimpseHarvest }
];

function GlimpseHarvest() {
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 text-left">
      <div className="text-label uppercase text-textMuted mb-2">This week's harvest</div>
      <ul className="space-y-1.5 text-bodySm text-textPrimary">
        <li className="flex gap-2"><span className="text-sage">●</span> Walked at sunrise four times</li>
        <li className="flex gap-2"><span className="text-gold">●</span> Wrote 2,000 words of chapter one</li>
        <li className="flex gap-2"><span className="text-textMuted">○</span> Northern lights: still dreaming</li>
      </ul>
      <p className="font-serif italic text-body text-textSecondary mt-3">"I was gentler with myself this week."</p>
    </div>
  );
}

function WeekDesign({ onContinue }) {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 }, transition: { duration: 0.6, ease: easeOut } };
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-dvh you-sky flex justify-center font-sans">
      <main className="w-full max-w-[480px] px-6" style={{ paddingTop: "max(env(safe-area-inset-top), 64px)", paddingBottom: "max(env(safe-area-inset-bottom), 28px)" }}>
        <div className="min-h-[70dvh] flex flex-col items-center justify-center text-center">
          <img src="/logo-full.png" alt="YOU — Your Own Universe" width="720" height="621" className="w-full max-w-[190px] h-auto" />
          <BetaBadge className="mt-3" />
          <h1 className="font-serif text-[30px] leading-tight text-textPrimary mt-6">A week in YOU</h1>
          <p className="text-body text-textSecondary mt-2 max-w-[300px]">A quiet place to grow into who you already are. Here's how a week might feel.</p>
          <motion.div animate={reduceMotion ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="text-caption text-textMuted mt-8">
            Scroll to begin ↓
          </motion.div>
        </div>

        <div className="relative">
          {/* The thread the week hangs on. */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[color-mix(in_srgb,var(--gold)_40%,transparent)]" aria-hidden="true" />
          {WEEK.map(({ when, title, line, Glimpse }) => (
            <motion.section key={title} {...reveal} className="relative pl-9 mb-14">
              <span className="absolute left-[5px] top-1.5 w-[13px] h-[13px] rounded-full bg-gold ring-4 ring-[color-mix(in_srgb,var(--gold)_20%,transparent)]" aria-hidden="true" />
              <div className="text-label uppercase text-textMuted">{when}</div>
              <h2 className="font-serif text-[26px] leading-tight text-textPrimary mb-1.5">{title}</h2>
              <p className="text-body text-textSecondary mb-4">{line}</p>
              <Glimpse />
            </motion.section>
          ))}
        </div>

        <motion.div {...reveal} className="text-center mb-6">
          <p className="font-serif text-h1 text-textPrimary leading-tight">No streaks. No catching up.<br />Just you, a little at a time.</p>
          <p className="font-serif italic text-body text-textMuted mt-3">A message directly from YOU</p>
        </motion.div>
        <InstallCard />
        <div className="mt-8">
          <Begin onContinue={onContinue} />
        </div>
      </main>
    </div>
  );
}
