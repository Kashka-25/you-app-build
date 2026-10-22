import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Feather, Flame, Sprout } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getPillarLevel, TIERS, INNER_PILLARS } from "../../constants/app.const";
import { PILLAR_ICONS } from "../../constants/pillarIcons";
import QuestionnaireFlow from "../questionnaires/QuestionnaireFlow";
import { easeOut } from "../ui/motion";
import { XpBar } from "../ui/XpBar";

// The eight Pillars as something to look at, not a list to read (Cassidy,
// Oct 19): a wheel of petals, the inner four on the cardinal points and the
// outer four between them, each petal growing with its Pillar's level; then
// a tile for each Pillar with its progress as a ring around its icon. Tap a
// tile (or a petal) to open it. Nothing moves until the Seeker taps.
export default function PillarsPanel() {
  const { pillars } = useAppData();
  const [openName, setOpenName] = useState(null);
  const [dream, setDream] = useState({ open: false, pillar: null });
  const shown = pillars.map(p => ({ ...p, ...getPillarLevel(p.xp), inner: INNER_PILLARS.includes(p.name) }));
  const open = shown.find(p => p.name === openName);
  const toggle = name => setOpenName(n => (n === name ? null : name));

  return (
    <div>
      <PillarWheel pillars={shown} selected={openName} onSelect={toggle} />

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {shown.map(p => (
          <PillarTile key={p.name} p={p} selected={openName === p.name} onSelect={() => toggle(p.name)} />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={open.name}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 rounded-card p-4 border" style={{ borderColor: `${open.color}55`, background: `color-mix(in srgb, ${open.color} 9%, var(--surface-1))` }}>
              <div className="font-serif text-h3 text-textPrimary">{open.name}</div>
              <div className="text-caption text-textMuted mb-3">
                {open.level > 0 ? `Level ${open.level}` : "Just beginning"} · {open.xp} XP · {100 - open.pct}% to the next level
              </div>
              <div className="flex gap-4 text-bodySm text-textSecondary mb-3">
                <span className="inline-flex items-center gap-1.5"><Sprout size={14} strokeWidth={1.75} style={{ color: open.color }} /> {open.active} growing</span>
                <span className="inline-flex items-center gap-1.5"><Flame size={14} strokeWidth={1.75} style={{ color: open.color }} /> best streak {open.bestStreak}d</span>
              </div>
              <button
                type="button"
                onClick={() => setDream({ open: true, pillar: open.name })}
                className="inline-flex items-center gap-1.5 text-bodySm text-textPrimary border border-borderC bg-surface2 rounded-full px-3.5 min-h-[40px]"
              >
                <Feather size={14} strokeWidth={1.75} />
                Free a dream in {open.name}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionnaireFlow
        open={dream.open}
        onClose={() => setDream(d => ({ ...d, open: false }))}
        questionnaire="freeing_dream"
        pillar={dream.pillar}
      />
    </div>
  );
}

const R = 150;          // half the wheel's size
const MIN = 40;         // a just-begun petal still shows
const SPAN = 100;       // how far the petals can reach beyond MIN

// Petals grow with every level and never shrink back at a level up (Cassidy,
// Oct 19): a Pillar's whole journey (levels earned + progress to the next)
// maps to a length that keeps growing but eases as it goes, so early levels
// show clearly and later ones still fit on the wheel.
const reach = levels => MIN + SPAN * (levels / (levels + 1));
const LEVEL_RINGS = [1, 2, 3, 5];

// A petal from the centre out along `angle`, `len` long and `w` wide.
function petal(angle, len, w) {
  const a = (angle - 90) * (Math.PI / 180);
  const u = [Math.cos(a), Math.sin(a)];
  const n = [-u[1], u[0]];
  const tip = [R + u[0] * len, R + u[1] * len];
  const mid = [R + u[0] * len * 0.48, R + u[1] * len * 0.48];
  const c1 = [mid[0] + n[0] * w, mid[1] + n[1] * w];
  const c2 = [mid[0] - n[0] * w, mid[1] - n[1] * w];
  const f = v => v.toFixed(1);
  return `M${R},${R} Q${f(c1[0])},${f(c1[1])} ${f(tip[0])},${f(tip[1])} Q${f(c2[0])},${f(c2[1])} ${R},${R} Z`;
}

export function PillarWheel({ pillars, selected, onSelect }) {
  const inner = pillars.filter(p => p.inner);
  const outer = pillars.filter(p => !p.inner);
  // Inner Pillars on the cardinal points, outer ones between them.
  const placed = [
    ...inner.map((p, i) => ({ p, angle: i * 90 })),
    ...outer.map((p, i) => ({ p, angle: 45 + i * 90 }))
  ];
  const totalLevel = pillars.reduce((s, p) => s + p.level, 0);
  // How far all eight petals are, together, toward their next levels: the
  // sunflower heart's seeds turn gold as it grows.
  const together = pillars.length ? pillars.reduce((s, p) => s + p.pct, 0) / pillars.length : 0;
  return (
    <div className="relative mx-auto w-full max-w-[300px] aspect-square">
      <svg viewBox={`0 0 ${R * 2} ${R * 2}`} className="w-full h-full" role="img"
        aria-label={`Your eight Pillars as a flower: ${totalLevel} levels earned; each petal grows a band with every level and fills toward the next`}>
        <circle cx={R} cy={R} r={R - 6} fill="none" stroke="var(--gold)" strokeOpacity="0.25" strokeDasharray="1 5" />
        {/* Where each level begins: a petal crossing a ring has levelled up. */}
        {LEVEL_RINGS.map(l => (
          <circle key={l} cx={R} cy={R} r={reach(l)} fill="none" stroke="var(--gold)" strokeOpacity="0.16" strokeDasharray={l === 1 ? undefined : "2 4"} />
        ))}
        {placed.map(({ p, angle }) => {
          const w = p.inner ? 24 : 18;
          const on = selected === p.name;
          const next = reach(p.level + 1);
          const now = reach(p.level + p.pct / 100);
          return (
            <g key={p.name} onClick={() => onSelect(p.name)} className="cursor-pointer">
              {/* The room to the next level, then the growth toward it, then
                  every level already earned as a solid band within. */}
              <path d={petal(angle, next, w)} fill={p.color} fillOpacity={on ? 0.16 : 0.08} stroke={p.color} strokeOpacity="0.25" />
              <path d={petal(angle, now, w)} fill={p.color} fillOpacity={on ? 0.6 : 0.45} />
              {Array.from({ length: p.level }, (_, i) => p.level - i).map(l => (
                <path key={l} d={petal(angle, reach(l), w)} fill={p.color} fillOpacity={on ? 1 : 0.88}
                  stroke="var(--surface-2)" strokeOpacity="0.55" strokeWidth="0.8" />
              ))}
            </g>
          );
        })}
        <SunflowerHeart filled={together} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
        {/* Over the sunflower heart: starlight-cream with a soft shadow. */}
        <div className="font-serif text-[22px] leading-none text-[#FBF3DF] [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{totalLevel}</div>
        <div className="text-[8.5px] uppercase tracking-[0.14em] text-[#F3DE9C] mt-0.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{totalLevel === 1 ? "level" : "levels"}</div>
      </div>
    </div>
  );
}

// The flower's heart, like a sunflower's (Cassidy, Oct 19): a dark disc of
// seeds laid out the way a sunflower lays them (each a golden angle on from
// the last), ripening gold from the rim inward, as real sunflower seeds do,
// as the petals grow together toward their next levels.
const SEEDS = 120;
const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
const HEART = 36;
export function SunflowerHeart({ filled, cx = R, cy = R, r = HEART }) {
  const lit = Math.round((SEEDS * Math.min(100, Math.max(0, filled))) / 100);
  const spacing = (r - 3) / Math.sqrt(SEEDS);
  return (
    <g aria-hidden="true">
      <defs>
        <radialGradient id="sunflower-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B2614" />
          <stop offset="70%" stopColor="#1C1209" />
          <stop offset="100%" stopColor="#120B05" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 2.5} fill="none" stroke="#C9A24D" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={r} fill="url(#sunflower-disc)" />
      {Array.from({ length: SEEDS }, (_, i) => {
        const d = spacing * Math.sqrt(i + 0.5);
        const a = i * GOLDEN_ANGLE;
        const gold = i >= SEEDS - lit;
        return (
          <circle
            key={i}
            cx={(cx + d * Math.cos(a)).toFixed(2)}
            cy={(cy + d * Math.sin(a)).toFixed(2)}
            r={1.3 + (i / SEEDS) * 0.7}
            fill={gold ? (i % 3 === 0 ? "#F3DE9C" : "#D9AE52") : "#4A3420"}
            fillOpacity={gold ? 1 : 0.85}
          />
        );
      })}
    </g>
  );
}

function PillarTile({ p, selected, onSelect }) {
  const Icon = PILLAR_ICONS[p.name];
  const badgeColor = p.level > 0 ? TIERS[(p.level - 1) % TIERS.length].color : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selected}
      className={`rounded-card p-2.5 text-left transition-shadow ${selected ? "bg-surface2 shadow-card" : "bg-surface1 shadow-card"}`}
      style={selected ? { boxShadow: `0 0 0 2px ${p.color}66` } : undefined}
    >
      <span className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-full flex items-center justify-center flex-none" style={{ background: `${p.color}26`, color: p.color }}>
          {Icon && <Icon size={16} strokeWidth={1.75} />}
        </span>
        <span className="min-w-0">
          <span className="block text-bodySm font-medium text-textPrimary truncate">{p.name}</span>
          <span className="flex items-center gap-1 text-caption text-textMuted">
            {p.level > 0 ? (
              <span className="inline-flex items-center gap-0.5" style={{ color: badgeColor }}><Award size={11} strokeWidth={1.75} />Lv {p.level}</span>
            ) : "Lv 0"}
          </span>
        </span>
      </span>
      {/* The Fallout-style XP bar toward the next level. */}
      <XpBar pct={p.pct} color={p.color} xp={p.progress} of={p.requirement} className="mt-2" />
    </button>
  );
}
