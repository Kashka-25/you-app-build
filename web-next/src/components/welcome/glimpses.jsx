import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Dot, Heart, MessageCircle, PenLine, Sparkles, Sprout } from "lucide-react";
import KommYOUnity from "../KommYOUnity";
import { PillarWheel } from "../pillars/PillarsPanel";
import ValuesSky from "../values/ValuesSky";
import { XpBar } from "../ui/XpBar";
import { INNER_PILLARS, PILLARS, PILLAR_COLORS, TIERS, applyPrestigeGain, getPrestigeStage, getTier } from "../../constants/app.const";
import { ALL_VALUES_LIB } from "../../constants/values.const";
import { elementColor } from "../../lib/elements";

// Small pieces of YOU for the welcome page and the welcome lab, running on
// made-up demo data: nothing here touches an account.
//
// NOTE for future us: these are a snapshot of the app as it looked in
// October 2026. The flower, values sky and XP bars are the app's real
// components, so they change when the app does; the rest (the YOUrnal
// page, chapters, Kronk post, courses, harvest) are hand-built look-alikes
// and will drift. When a screen changes a lot, especially YOU (Pillars and
// Values), check the matching glimpse here still tells the truth.

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
  { name: "Communication", element: "Air", pct: 40, tier: "Practising" },
  { name: "Wonder", element: "Ether", pct: 25, tier: "Awakening" }
].map(s => ({ ...s, color: elementColor(s.element) }));
const DEMO_SEEDS = [
  { name: "Walk at sunrise", kind: "Habit", pillar: "Body", pct: 70 },
  { name: "Finish the first chapter", kind: "Goal", pillar: "Purpose", pct: 40 },
  { name: "See the northern lights", kind: "Dream", pillar: "Spirit", pct: 20 }
];

// ── Glimpses: small, real pieces of YOU ──
// The petals breathe, one after another round the flower, to say "tap
// me" (Cassidy, Oct 23), until the first one is tapped. Only here: the
// app's own flower stays still.
const PETAL_PULSE = `
  @keyframes you-petal { 0%, 100% { transform: scale(1); filter: brightness(1) } 50% { transform: scale(1.045); filter: brightness(1.18) } }
  .you-petals svg g.cursor-pointer { transform-box: view-box; transform-origin: 50% 50%; animation: you-petal 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite both; }
  @media (prefers-reduced-motion: reduce) { .you-petals svg g.cursor-pointer { animation: none } }
`;

export function GlimpseFlower() {
  const [sel, setSel] = useState(null);
  const [tapped, setTapped] = useState(false);
  const wheel = useRef(null);
  const p = DEMO_PILLARS.find(x => x.name === sel);
  // Stagger each petal's breath so the pulse travels round the flower.
  useEffect(() => {
    const petals = wheel.current?.querySelectorAll("svg g.cursor-pointer") || [];
    petals.forEach((g, i) => { g.style.animationDelay = `${(i * 2.6) / petals.length}s`; });
  }, []);
  return (
    <div>
      <style>{PETAL_PULSE}</style>
      <div ref={wheel} className={`max-w-[230px] mx-auto ${tapped ? "" : "you-petals"}`}>
        <PillarWheel
          pillars={DEMO_PILLARS}
          selected={sel}
          onSelect={n => {
            setTapped(true);
            setSel(s => (s === n ? null : n));
          }}
        />
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

export function GlimpseSky() {
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

export function GlimpseJournal() {
  return (
    <div className="space-y-2.5 text-left">
      <div className="rounded-card bg-surface1 shadow-card p-4">
        <div className="text-label uppercase text-textMuted mb-1.5">Tuesday evening</div>
        <p className="font-serif text-[17px] leading-snug text-textPrimary italic mb-3">
          Walked the long way home tonight. The sky went pink over the water and for a minute I didn't think about anything at all. I want more evenings like this, not just weekends.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["grateful", "calm", "#Body"].map(t => (
            <span key={t} className="rounded-full border border-borderC px-2 py-0.5 text-[11px] text-textSecondary">{t}</span>
          ))}
        </div>
      </div>
      {/* The AI reflection, as the app attaches it: only ever when asked. */}
      <div className="rounded-card border border-dashed border-[rgba(201,162,77,0.5)] bg-[color-mix(in_srgb,var(--surface-1)_70%,transparent)] p-4">
        <div className="flex items-center gap-1.5 text-label uppercase text-gold mb-1.5">
          <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" /> A gentle reflection
        </div>
        <p className="text-bodySm text-textSecondary mb-2.5">
          It sounds like slowing down gave you a moment of real peace, and that you might be noticing how rarely that happens on a weekday.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {["Theme · stillness", "Value · Balance", "Pillar · Body"].map(t => (
            <span key={t} className="rounded-full bg-surface3 px-2 py-0.5 text-[11px] text-textSecondary">{t}</span>
          ))}
        </div>
        <p className="font-serif italic text-[16px] text-textPrimary leading-snug">What would one small, regular "long way home" look like this week?</p>
      </div>
    </div>
  );
}

export function GlimpseSeeds() {
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

export function GlimpseDays() {
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

export function GlimpseHarvest() {
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

// YOUrney: a life told in chapters.
const DEMO_CHAPTERS = [
  { years: "2009–2014", title: "Growing up by the river", tone: "#8a7a52" },
  { years: "2015–2021", title: "The city years", tone: "#a06490" },
  { years: "2022–now", title: "Coming home to myself", tone: "#d4a85a", now: true }
];
export function GlimpseChapters() {
  return (
    <div className="relative pl-6 text-left">
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-[color-mix(in_srgb,var(--gold)_45%,transparent)]" aria-hidden="true" />
      {DEMO_CHAPTERS.map(c => (
        <div key={c.title} className="relative mb-3 last:mb-0">
          <span className="absolute -left-[22px] top-1.5 w-[11px] h-[11px] rounded-full" style={{ background: c.tone, boxShadow: c.now ? `0 0 10px ${c.tone}` : "none" }} aria-hidden="true" />
          <div className="text-[10.5px] uppercase tracking-wide text-textMuted">{c.years}{c.now ? " · this chapter" : ""}</div>
          <div className="font-serif text-[17px] text-textPrimary leading-snug">{c.title}</div>
        </div>
      ))}
    </div>
  );
}

// A home day: today's seeds and the week so far.
export function GlimpseToday() {
  return (
    <div className="space-y-4">
      <GlimpseSeeds />
      <GlimpseDays />
    </div>
  );
}

// KommYOUnity: one post from the Kronk feed, with a Froth to try.
// KommYOUnity: the branded window onto Kronk, with its feeds, a few posts
// from friends, and a Froth to try.
const KRONK_PINK = "oklch(0.72 0.17 326)";
const DEMO_POSTS = [
  { who: "Wren", handle: "wren", initial: "W", tone: "#5f7f72", when: "2h", froth: 14, komment: 3,
    text: "Day 12 of walking at sunrise. Didn't want to go this morning. Went anyway. The light was worth it. 🌅" },
  { who: "Ari", handle: "ari", initial: "A", tone: "#a06490", when: "5h", froth: 22, komment: 6, image: "/images/home/welcome-day.webp",
    text: "Harvest day! Finished the first chapter of my book this week. Three seeds sown, three seeds grown. 🌱" }
];
function KronkPost({ post }) {
  const [frothed, setFrothed] = useState(false);
  return (
    <div className="rounded-card bg-surface1 shadow-card p-3.5">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[#FBF3DF] font-serif text-[15px]" style={{ background: post.tone }} aria-hidden="true">{post.initial}</span>
        <div className="min-w-0">
          <div className="text-bodySm text-textPrimary font-medium leading-tight">{post.who}</div>
          <div className="text-[11px] text-textMuted">@{post.handle}@kronk.info · {post.when}</div>
        </div>
      </div>
      <p className="text-bodySm text-textSecondary">{post.text}</p>
      {post.image && <img src={post.image} alt="" className="w-full h-24 object-cover rounded-sm mt-2" />}
      <div className="flex items-center gap-1 mt-1.5 -ml-2">
        <button
          type="button"
          onClick={() => setFrothed(f => !f)}
          aria-pressed={frothed}
          className={`inline-flex items-center gap-1.5 min-h-[34px] px-2 rounded-sm text-caption ${frothed ? "" : "text-textMuted"}`}
          style={frothed ? { color: KRONK_PINK } : undefined}
        >
          <Heart size={15} strokeWidth={1.75} fill={frothed ? "currentColor" : "none"} />
          {frothed ? "Frothed" : "Froth"} · {post.froth + (frothed ? 1 : 0)}
        </button>
        <span className="inline-flex items-center gap-1.5 min-h-[34px] px-2 text-caption text-textMuted">
          <MessageCircle size={15} strokeWidth={1.75} /> Komment · {post.komment}
        </span>
      </div>
    </div>
  );
}
export function GlimpseKommYOUnity() {
  const [feed, setFeed] = useState("Mates");
  return (
    <div className="text-left">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-serif text-[20px] text-textPrimary"><KommYOUnity /></span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium text-[#1A0F1C]" style={{ background: KRONK_PINK }}>
          <PenLine size={13} strokeWidth={2} aria-hidden="true" /> Post on Kronk
        </span>
      </div>
      <div className="flex gap-1.5 mb-3" role="tablist" aria-label="Kronk feeds">
        {["Kronkverse", "Orbit", "Mates", "Me"].map(f => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={feed === f}
            onClick={() => setFeed(f)}
            className={`rounded-full px-2.5 py-1 text-[11.5px] ${feed === f ? "text-[#1A0F1C] font-medium" : "bg-surface3 text-textMuted"}`}
            style={feed === f ? { background: KRONK_PINK } : undefined}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {DEMO_POSTS.map(p => <KronkPost key={p.handle} post={p} />)}
      </div>
    </div>
  );
}

// YOUniversity: a course under way, and two more waiting.
const DEMO_COURSES = [
  { name: "Light & Shadow", tagline: "Sit with one of your values, all of it." },
  { name: "Freeing the Dream", tagline: "Find the dream waiting inside a Pillar of your life." }
];
export function GlimpseYOUniversity() {
  return (
    <div className="space-y-2.5 text-left">
      <div className="rounded-card bg-surface1 shadow-card p-4">
        <div className="text-label uppercase text-textMuted mb-1">Continue · stage 3 of 7</div>
        <div className="font-serif text-[19px] text-textPrimary leading-snug">The Sovereign Empath</div>
        <div className="text-caption text-textSecondary mb-2.5">Feel deeply. Stand firmly.</div>
        <XpBar pct={43} color="#a06490" />
      </div>
      {DEMO_COURSES.map(c => (
        <div key={c.name} className="rounded-sm bg-surface1 shadow-card px-4 py-2.5">
          <div className="text-bodySm text-textPrimary font-medium">{c.name}</div>
          <div className="text-caption text-textMuted">{c.tagline}</div>
        </div>
      ))}
    </div>
  );
}

// YOU: one value opened up, Communication (an Air value), on the app's own
// XP: its real challenges and points (ALL_VALUES_LIB), a 100 XP first
// cycle (prestigeRequirement), and the same tiers and growth stages as
// ValuesPanel. It starts at 86 of 100 with two challenges done; tick the
// other two (+6, +8) and it reaches 100 and grows from Seed to Sprout.
const COMMUNICATION = ALL_VALUES_LIB.find(v => v.name === "Communication");
const DEMO_PICKS = [
  { idx: 0, done: true },
  { idx: 1, done: true },
  { idx: 2 },
  { idx: 5 }
].map(p => ({ ...COMMUNICATION.challenges[p.idx], done: Boolean(p.done) }));
const START_XP = 86;
const STAGE_ICONS = [Dot, Sprout];

export function GlimpseValueChallenges() {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(() => DEMO_PICKS.map(c => c.done));
  const gained = DEMO_PICKS.reduce((n, c, i) => n + (done[i] && !c.done ? c.pts : 0), 0);
  const { rating, prestige, requirement } = applyPrestigeGain(START_XP, 0, gained);
  const grew = prestige > 0;
  const pct = Math.min(100, Math.round((rating / requirement) * 100));
  const tier = getTier(Math.min(99, Math.round((rating / requirement) * 99)));
  const stage = getPrestigeStage(prestige);
  const stageColor = TIERS[prestige % TIERS.length].color;
  const StageIcon = STAGE_ICONS[stage.index] || Sprout;
  const air = elementColor("Air");

  function tick(i) {
    if (DEMO_PICKS[i].done || grew) return;
    setDone(d => d.map((v, j) => (j === i ? !v : v)));
  }

  return (
    <div
      className="relative overflow-hidden rounded-card shadow-card p-4 text-left border"
      style={{
        borderColor: `color-mix(in srgb, ${air} 28%, transparent)`,
        background: `linear-gradient(105deg, color-mix(in srgb, ${air} 16%, var(--surface-1)) 0%, var(--surface-1) 62%)`
      }}
    >
      {/* The level-up: a golden ring opens out from the stage chip. */}
      <AnimatePresence>
        {grew && !reduceMotion && (
          <motion.span
            key="burst"
            aria-hidden="true"
            className="absolute right-6 top-5 w-10 h-10 rounded-full border-2 border-gold pointer-events-none"
            initial={{ opacity: 0.9, scale: 0.3 }}
            animate={{ opacity: 0, scale: 9 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <span className="font-serif text-[20px] text-textPrimary flex-1">Communication</span>
        <motion.span
          key={stage.name}
          className="flex items-center gap-1 text-caption font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-none"
          style={{ color: stageColor, background: `color-mix(in srgb, ${stageColor} 18%, transparent)` }}
          initial={grew && !reduceMotion ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 14 }}
          title={stage.desc}
        >
          <StageIcon size={11} strokeWidth={2} /> {stage.name}
        </motion.span>
      </div>
      <p className="text-caption text-textMuted mb-1.5">{COMMUNICATION.tagline}.</p>
      <XpBar pct={pct} color={air} xp={rating} of={requirement} />
      <div className="text-caption text-textMuted mt-1 mb-3">
        <span className="font-medium" style={{ color: tier.color }}>{tier.name}</span> · Air
      </div>

      <AnimatePresence>
        {grew && (
          <motion.div
            key="grew"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.3 }}
            className="rounded-sm bg-[color-mix(in_srgb,var(--gold)_14%,transparent)] border border-[color-mix(in_srgb,var(--gold)_40%,transparent)] p-2.5 mb-3"
          >
            <div className="font-serif text-[17px] text-textPrimary leading-snug">Communication grew into {stage.name}.</div>
            <div className="text-caption text-textSecondary italic">"{stage.desc}" Its next cycle asks a little more: {requirement} XP.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        {DEMO_PICKS.map((c, i) => (
          <div key={c.text} className={`flex items-center gap-2.5 p-2 rounded-sm bg-surface2 ${done[i] ? "opacity-60" : ""}`}>
            <button
              type="button"
              onClick={() => tick(i)}
              disabled={c.done || grew}
              aria-label={done[i] ? "Done" : "Mark done"}
              className={`w-7 h-7 flex-none rounded-full border text-caption ${done[i] ? "bg-sage border-sage text-onAccent" : "border-borderC"}`}
            >
              {done[i] ? "✓" : ""}
            </button>
            <div className="flex-1 text-[13px] text-textPrimary leading-snug">
              {c.text}
              <span className="block text-[10.5px] uppercase tracking-wide text-textMuted mt-0.5">{c.diff}</span>
            </div>
            <div className="text-caption text-gold flex-none">+{c.pts}</div>
          </div>
        ))}
      </div>
      <div className="text-center mt-2.5">
        {grew ? (
          <button type="button" onClick={() => setDone(DEMO_PICKS.map(c => c.done))} className="text-caption text-textMuted underline underline-offset-2">
            Try it again
          </button>
        ) : (
          <span className="text-caption text-textMuted">Tick the last two to see Communication grow.</span>
        )}
      </div>
    </div>
  );
}
