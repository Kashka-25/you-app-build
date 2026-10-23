import { useState } from "react";
import { Heart, MessageCircle, PenLine, Sparkles, Sprout } from "lucide-react";
import KommYOUnity from "../KommYOUnity";
import { PillarWheel } from "../pillars/PillarsPanel";
import ValuesSky from "../values/ValuesSky";
import { XpBar } from "../ui/XpBar";
import { INNER_PILLARS, PILLARS, PILLAR_COLORS } from "../../constants/app.const";
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
export function GlimpseFlower() {
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

// YOU: one value opened up, Communication (an Air value), with a few of its
// challenges: gentle, bold and brave, each worth XP toward its next tier.
const DEMO_CHALLENGES = [
  { text: "Ask someone how they're really doing, then simply listen.", diff: "gentle", pts: 10, done: true },
  { text: "Write down one thing you've been meaning to say.", diff: "gentle", pts: 10, done: true },
  { text: "Tell a friend, out loud, something you appreciate about them.", diff: "bold", pts: 20 },
  { text: "Have the conversation you've been putting off. Begin with how you feel.", diff: "brave", pts: 35 }
];
export function GlimpseValueChallenges() {
  // Tap a challenge to try it: its XP joins the bar (the first two are done).
  const [done, setDone] = useState(() => DEMO_CHALLENGES.map(c => Boolean(c.done)));
  const xp = Math.min(100, 40 + DEMO_CHALLENGES.reduce((n, c, i) => n + (done[i] && !c.done ? c.pts : 0), 0));
  const air = elementColor("Air");
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 text-left">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-[20px] text-textPrimary">Communication</span>
        <span className="text-[10.5px] uppercase tracking-wide flex-none" style={{ color: air }}>Air · Practising</span>
      </div>
      <p className="text-caption text-textMuted mb-2">Saying what's true, kindly, and truly hearing what's said.</p>
      <XpBar pct={xp} color={air} xp={xp} of={100} className="mb-3" />
      <div className="space-y-1.5">
        {DEMO_CHALLENGES.map((c, i) => (
          <div key={c.text} className={`flex items-center gap-2.5 p-2 rounded-sm bg-surface2 ${done[i] ? "opacity-60" : ""}`}>
            <button
              type="button"
              onClick={() => !c.done && setDone(d => d.map((v, j) => (j === i ? !v : v)))}
              aria-label={done[i] ? "Done" : "Mark done"}
              className={`w-6 h-6 flex-none rounded-full border text-caption ${done[i] ? "bg-sage border-sage text-onAccent" : "border-borderC"}`}
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
    </div>
  );
}
