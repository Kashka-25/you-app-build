import { useState } from "react";
import { Sprout } from "lucide-react";
import { PillarWheel } from "../pillars/PillarsPanel";
import ValuesSky from "../values/ValuesSky";
import { XpBar } from "../ui/XpBar";
import { INNER_PILLARS, PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { elementColor } from "../../lib/elements";

// Small, real pieces of YOU for the welcome page and the welcome lab,
// running on made-up demo data: nothing here touches an account.

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
