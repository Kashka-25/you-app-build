import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import Intro, { InstallCard } from "./Intro";
import { BetaBadge } from "./SignIn";
import { easeOut } from "./ui/motion";
import Universe from "./welcome/Universe";
import { GlimpseDays, GlimpseFlower, GlimpseHarvest, GlimpseJournal, GlimpseSeeds, GlimpseSky } from "./welcome/glimpses";

// The welcome lab (Cassidy, Oct 22; she chose Explore the universe on
// Oct 23, which is now the real welcome page): a few versions of the page a brand-new
// YOUser sees, side by side, to try on a phone and keep the one that feels
// right. Hidden at /welcome-lab; nothing here touches anyone's account.
// Every glimpse runs on made-up demo data.
const DESIGNS = [
  { key: "universe", label: "Explore the universe" },
  { key: "message", label: "Simple message" },
  { key: "peek", label: "Peek inside" },
  { key: "week", label: "A week in YOU" }
];

export default function WelcomeLab({ onContinue }) {
  const [design, setDesign] = useState(() => {
    const d = new URLSearchParams(window.location.search).get("d");
    return DESIGNS.some(x => x.key === d) ? d : "universe";
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
      {design === "universe" && <Universe onContinue={onContinue} />}
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
function Begin({ onContinue }) {
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => onContinue("signup")} className="min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium">
        Create my account
      </button>
      <button type="button" onClick={() => onContinue("signin")} className="min-h-[44px] text-bodySm text-textSecondary">
        I already have an account
      </button>
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
