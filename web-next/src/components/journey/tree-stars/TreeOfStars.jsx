import { useEffect, useMemo, useRef, useState } from "react";
import { Guide } from "../../ui/Guide";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Plus, X } from "lucide-react";
import { PILLAR_ICONS } from "../../../constants/pillarIcons";
import { VALUE_ICONS, getValueEntry } from "../../../constants/valueLibrary";
import { useAppData } from "../../../lib/AppDataContext";
import {
  INNER_PILLARS, OUTER_PILLARS, VALUE_COLORS, VALUE_PILLAR, VALUE_PILLAR2, TIERS,
  getTier, getPrestigeStage, prestigeRequirement, PILLAR_COLORS, LEVELS
} from "../../../constants/app.const";
import { easeOut } from "../../ui/motion";
import IdentityVisionModal from "../IdentityVisionModal";
import StoryOfYou from "./StoryOfYou";
import LifeConstellations from "./LifeConstellations";
import GardenOfYou, { gardenLayout, MementoSpark } from "../../focus/GardenOfYou";
import { GardenBloom, GardenSeed } from "../../focus/FocusFlower";

// Tree of YOU v2 (Sep 28) — a cosmic tree:
//   roots    = the 8 Pillars, underground. Inner roots (Body, Heart, Mind,
//              Spirit) grow deep; outer roots (Connection, Purpose, Play,
//              Home & Earth) spread wide. Depth/spread grow with Pillar XP.
//   trunk    = the Seeker, Seed Being at its base.
//   branches = your Values. Thickness follows tier; fruit is lived depth
//              (challenges completed + Light & Shadow explorations), coloured
//              by prestige. Rested values are dormant branches: bare, never cut.
//   sky      = the canopy reaches into the cosmos — visions as stars, and
//              two doorways above them: The Story of You (Chapters) and
//              Life Constellations (memories over the places they happened).
// Nothing moves on its own: growth shows on open and on the Seeker's taps.

const SVG_W = 800, SVG_H = 1120;
const TRUNK_X = SVG_W / 2;
// Lined up with Cassidy's painted tree (Nov 2): its grass meets the soil
// about two-thirds down, and its trunk opens into light at 44%.
const GROUND_Y = 750;          // soil line
const TRUNK_TOP_Y = 480;       // where branches leave the trunk
const BRANCH_BASE_Y = 360, BRANCH_ARCH = 150, BRANCH_MARGIN_X = 80;
const STORY_ORB = { x: TRUNK_X, y: 58 };
const CONSTELLATION_ORB = { x: SVG_W - 92, y: 62 };
const MAX_FRUIT = 8;
// Cassidy's painted tree grows with the Seeker (Nov 2): one painting for
// each of the eight levels, Seedling to Elder, all drawn to this scene's
// 800 × 1120 layout. Each tier records where its trunk opens into light
// (`top`), the half-width of that crown (`crown`) and of its flared base
// (`base`), so branches and roots always leave the tree where it really
// is, and how far its glowing painted roots are softened (`dim`) so the
// Pillars' own roots read over them (Cassidy: "decrease their opacity").
// From tier 3 the trunk is lit gold, so branches take that lit bark; from
// tier 4 the painting has its own root web, so the Pillars run through it
// as glowing veins rather than drawn root wood.
const TREE_TIERS = [
  { top: 483, crown: 10, base: 26, dim: 0 },
  { top: 461, crown: 14, base: 38, dim: 0.12 },
  { top: 444, crown: 26, base: 52, dim: 0.24, lit: true },
  { top: 403, crown: 34, base: 70, dim: 0.36, lit: true, paintedRoots: true },
  { top: 404, crown: 30, base: 88, dim: 0.44, lit: true, paintedRoots: true },
  { top: 386, crown: 40, base: 100, dim: 0.52, lit: true, paintedRoots: true },
  { top: 353, crown: 48, base: 118, dim: 0.58, lit: true, paintedRoots: true },
  { top: 301, crown: 54, base: 136, dim: 0.64, lit: true, paintedRoots: true }
];
const treeImage = n => `/images/journey/tree-tier-${n + 1}.webp`;
const TREE_SEEN = "you.tree.tier";

// Spread n items across an arch, sampling the middle of each slot so a
// small canopy (two or three values) sits up and out rather than drooping
// to the far edges.
function archPos(i, n, baseX, width, baseY, arch) {
  const t = (i + 0.5) / Math.max(n, 1);
  return { x: baseX + t * width, y: baseY - arch * Math.sin(t * Math.PI) };
}

// Fruit deepens in colour with each prestige cycle.
const FRUIT_COLORS = ["#E0A458", "#D9764A", "#C9A24D", "#B85F6E", "#8FA05E"];

// Each branch leaves the trunk's crown a little to its own side, the way a
// real tree divides, and curves up and out to its value.
function branchCurve(tipX, tipY, tier) {
  const lean = Math.max(-1, Math.min(1, (tipX - TRUNK_X) / 300));
  const top = tier?.top ?? TRUNK_TOP_Y;
  const x0 = TRUNK_X + lean * (tier?.crown ?? 9) * 0.85, y0 = top + 26;
  // A tall tree's crown sits nearer the canopy, so its boughs spread more than they climb.
  const rise = Math.min(70, Math.max(10, top - tipY - 60));
  return [[x0, y0], [x0 + lean * 18, top - rise], [tipX - (tipX - TRUNK_X) * 0.12, tipY + Math.min(120, Math.max(40, top - tipY))], [tipX, tipY]];
}

// Roots leave the trunk's flared base across its width, dip, then reach.
function rootCurve(tipX, tipY, tier) {
  const dx = tipX - TRUNK_X;
  const spread = tier?.base ?? 26;
  const x0 = TRUNK_X + Math.max(-spread, Math.min(spread, dx * 0.12 * (spread / 26)));
  return [[x0, GROUND_Y - 8], [TRUNK_X + dx * 0.3, GROUND_Y + 40], [tipX - dx * 0.3, tipY - 50], [tipX, tipY]];
}

const curveD = ([a, b, c, d]) => `M ${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`;

function bezier([a, b, c, d], t) {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0], k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1]];
}

// A limb with real thickness: wide where it leaves the trunk, narrowing to
// the tip, with a gentle swell so it reads as wood rather than a line
// (Cassidy, Nov 2: "more cohesive with the image").
function limbShape(curve, w0, w1) {
  const n = 28, left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x, y] = bezier(curve, t);
    const [x2, y2] = bezier(curve, Math.min(1, t + 0.01));
    const [x1, y1] = bezier(curve, Math.max(0, t - 0.01));
    let nx = -(y2 - y1), ny = x2 - x1;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const w = (w0 + (w1 - w0) * Math.pow(t, 0.7)) * (1 + 0.06 * Math.sin(t * 9)) / 2;
    left.push(`${(x + nx * w).toFixed(1)} ${(y + ny * w).toFixed(1)}`);
    right.push(`${(x - nx * w).toFixed(1)} ${(y - ny * w).toFixed(1)}`);
  }
  return `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`;
}

// A trunk that tapers from a wide base to a narrower crown.
const TRUNK_SHAPE =
  `M ${TRUNK_X - 30} ${GROUND_Y + 4} C ${TRUNK_X - 22} ${GROUND_Y - 60}, ${TRUNK_X - 14} ${TRUNK_TOP_Y + 80}, ${TRUNK_X - 11} ${TRUNK_TOP_Y + 10} ` +
  `L ${TRUNK_X + 11} ${TRUNK_TOP_Y + 10} C ${TRUNK_X + 14} ${TRUNK_TOP_Y + 80}, ${TRUNK_X + 22} ${GROUND_Y - 60}, ${TRUNK_X + 30} ${GROUND_Y + 4} Z`;

// A value's crown (Cassidy, Nov 4: "more like tree branches leading to
// building a canopy"): the branch forks into twigs, and a crown of small
// leaves grows around them, tinted with the value's colour and fuller as
// it deepens. Neighbouring crowns overlap into one canopy. Lived depth
// shows as golden seeds among the leaves; a small badge keeps the symbol.
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) || 1;
}
function seeded(seed) {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}
const LEAF_GREENS = ["#2F4A22", "#3B5A28", "#4A6B30", "#5C7F38", "#264019"];

function Canopy({ name, x, y, depth, color, fruit, fruitColor, Icon, active }) {
  const shape = useMemo(() => {
    const rand = seeded(hashSeed(name));
    const rx = 50 + depth * 6, ry = 36 + depth * 4;
    const cy = y - ry * 0.55;
    const n = Math.min(150, 90 + depth * 14);
    const leaves = Array.from({ length: n }, (_, i) => {
      const t = Math.sqrt(rand()), a = rand() * Math.PI * 2;
      const lx = x + Math.cos(a) * rx * t, ly = cy + Math.sin(a) * ry * t;
      const outward = (Math.atan2(ly - cy, lx - x) * 180) / Math.PI + 90 + (rand() - 0.5) * 50;
      const len = 8 + rand() * 5;
      const back = i < n * 0.45;
      const tint = back ? 15 : 22 + rand() * 18;
      const green = LEAF_GREENS[Math.floor(rand() * LEAF_GREENS.length)];
      return { lx, ly, outward, len, back, tint, green, light: !back && rand() < 0.1 };
    });
    const twigs = [[-0.75, -0.35], [0.7, -0.45], [0.05, -0.9], [-0.35, -0.7], [0.4, -0.75]]
      .slice(0, 3 + Math.min(2, Math.floor(depth / 2)))
      .map(([dx, dy]) => ({ x2: x + dx * rx * 0.8, y2: cy + dy * ry * 0.7 }));
    const seeds = Array.from({ length: fruit }, () => {
      const t = 0.35 + Math.sqrt(rand()) * 0.55, a = rand() * Math.PI * 2;
      return { sx: x + Math.cos(a) * rx * t, sy: cy + Math.sin(a) * ry * t };
    });
    return { leaves, twigs, seeds, cy, rx, ry };
  }, [name, x, y, depth, fruit]);
  const leaf = l => (
    <path
      key={`${l.lx}-${l.ly}`}
      d={`M ${l.lx} ${l.ly + l.len} Q ${l.lx + l.len * 0.45} ${l.ly} ${l.lx} ${l.ly - l.len} Q ${l.lx - l.len * 0.45} ${l.ly} ${l.lx} ${l.ly + l.len} Z`}
      transform={`rotate(${l.outward} ${l.lx} ${l.ly})`}
      fill={l.light ? "#B7C873" : `color-mix(in srgb, ${color} ${l.tint}%, ${l.green})`}
      opacity={l.back ? 0.78 : 0.95}
    />
  );
  return (
    <g>
      <ellipse cx={x} cy={shape.cy} rx={shape.rx * (active ? 1.5 : 1.25)} ry={shape.ry * (active ? 1.5 : 1.25)} fill={color} opacity={active ? 0.38 : 0.18} filter="url(#tosBlur)" className="transition-all duration-500" />
      {shape.leaves.filter(l => l.back).map(leaf)}
      {shape.twigs.map((t, i) => (
        <path key={i} d={`M ${x} ${y} Q ${(x + t.x2) / 2} ${y - 4} ${t.x2} ${t.y2}`} fill="none" stroke="#5a3a26" strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
      ))}
      {shape.leaves.filter(l => !l.back).map(leaf)}
      {shape.seeds.map((p, i) => <Fruit key={i} x={p.sx} y={p.sy} color={fruitColor} />)}
      <circle cx={x} cy={shape.cy} r={11} fill="#1a1230" stroke="#E8C877" strokeOpacity={0.8} strokeWidth={0.9} />
      {Icon && (
        <foreignObject x={x - 7} y={shape.cy - 7} width={14} height={14} className="pointer-events-none">
          <Icon size={14} color={color} strokeWidth={2} />
        </foreignObject>
      )}
    </g>
  );
}

// A resting value: a bare tip, quiet and silver.
function RestingTip({ x, y, Icon }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#1a1230" stroke="#9c968a" strokeWidth={1.2} opacity={0.85} />
      {Icon && (
        <foreignObject x={x - 5.5} y={y - 5.5} width={11} height={11} className="pointer-events-none">
          <Icon size={11} color="#C9C3B6" strokeWidth={2} />
        </foreignObject>
      )}
    </g>
  );
}

// Ida, Pingala and Sushumna, as a slender graphic through the trunk.
const CHAKRAS = ["#D9584A", "#E8894A", "#E8C877", "#7FB069", "#6FA8C9", "#7C6FC4", "#E9DDF6"];
// When a value or Pillar is tapped the channels wake (Cassidy, Nov 4): Ida
// glows moon-blue and Pingala sun-red, pulsing in turn, one brightening as
// the other softens. Still for anyone who prefers reduced motion.
const NADI_CSS = `
  @keyframes nadiIda { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes nadiPingala { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
  .nadi-ida { animation: nadiIda 2.6s ease-in-out infinite; }
  .nadi-pingala { animation: nadiPingala 2.6s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .nadi-ida, .nadi-pingala { animation: none; } }
`;
const IDA_BLUE = "#5FA8FF", PINGALA_RED = "#FF4A3D";

function NadiChannels({ bottom, top, dimmed, awake, label }) {
  const h = bottom - top;
  const amp = 10;
  const turns = CHAKRAS.length - 1; // a half-turn between each pair of chakras
  const wave = sign => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const y = bottom - t * h;
      const x = TRUNK_X + sign * amp * Math.sin(t * turns * Math.PI) * (0.55 + 0.45 * Math.sin(t * Math.PI));
      pts.push(`${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <g opacity={dimmed && !awake ? 0.35 : 1} className="transition-opacity duration-500 pointer-events-auto" role="img" aria-label={label}>
      <title>{label}</title>
      <style>{NADI_CSS}</style>
      {/* a soft shadow behind, so the channels read against the glowing bark */}
      <line x1={TRUNK_X} y1={bottom} x2={TRUNK_X} y2={top} stroke="#1a0b08" strokeWidth={30} opacity={0.4} filter="url(#tosBlur)" />
      {/* Sushumna: a soft glow, then the luminous line */}
      <line x1={TRUNK_X} y1={bottom} x2={TRUNK_X} y2={top} stroke="#FFE9A8" strokeWidth={6} opacity={0.35} filter="url(#tosBlur)" />
      <line x1={TRUNK_X} y1={bottom} x2={TRUNK_X} y2={top} stroke="url(#tosSushumna)" strokeWidth={1.6} strokeLinecap="round" />
      {/* Ida, the moon channel, begins on the left; Pingala, the sun, on the right */}
      <path d={wave(-1)} fill="none" stroke={awake ? IDA_BLUE : "#EEEBFF"} strokeWidth={awake ? 2.2 : 1.8} strokeLinecap="round" style={{ transition: "stroke 500ms" }} />
      <path d={wave(1)} fill="none" stroke={awake ? PINGALA_RED : "#FF7E45"} strokeWidth={awake ? 2.2 : 1.8} strokeLinecap="round" style={{ transition: "stroke 500ms" }} />
      {awake && (
        <>
          <g className="nadi-ida">
            <path d={wave(-1)} fill="none" stroke={IDA_BLUE} strokeWidth={7} strokeLinecap="round" opacity={0.75} filter="url(#tosBlur)" />
            <path d={wave(-1)} fill="none" stroke="#CFE6FF" strokeWidth={1.2} strokeLinecap="round" />
          </g>
          <g className="nadi-pingala">
            <path d={wave(1)} fill="none" stroke={PINGALA_RED} strokeWidth={7} strokeLinecap="round" opacity={0.75} filter="url(#tosBlur)" />
            <path d={wave(1)} fill="none" stroke="#FFD0C2" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        </>
      )}
      {/* the seven chakras, where they cross */}
      {CHAKRAS.map((c, i) => {
        const y = bottom - (i / turns) * h;
        return (
          <g key={i}>
            <circle cx={TRUNK_X} cy={y} r={8} fill={c} opacity={0.6} filter="url(#tosBlur)" />
            <circle cx={TRUNK_X} cy={y} r={3.6} fill={c} stroke="#FFF6D6" strokeWidth={0.8} strokeOpacity={0.85} />
          </g>
        );
      })}
    </g>
  );
}

// What each part of the tree is: a tidy two-column key (Nov 5), folded into
// How it works on the page and shown under the tree in full screen.
const KEY = [
  ["Roots", "your Pillars", { background: "#9a8870" }],
  ["Branches", "your Values", { background: "var(--gold)" }],
  ["Golden seeds", "lived depth", { background: "#E0A458" }],
  ["Stars", "your visions", { background: "#F7F1E1" }],
  ["Flowers", "focus sessions", { background: "#F2EBDA", boxShadow: "inset 0 0 0 2px #7A9B76" }],
  ["Constellations", "memories over places", { background: "#4a8fa0" }]
];
function TreeKey({ className = "" }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-1.5 list-none m-0 p-0 text-caption ${className}`}>
      {KEY.map(([name, what, dot]) => (
        <li key={name} className="flex items-center gap-1.5 min-w-0">
          <i className="w-2 h-2 rounded-full inline-block flex-none" style={dot} aria-hidden="true" />
          <span className="truncate"><span className="font-medium">{name}</span> · {what}</span>
        </li>
      ))}
    </ul>
  );
}

// A four-point sparkle, for the visions in the sky.
function Sparkle({ x, y, r, color, opacity = 1 }) {
  const w = r * 0.28;
  return (
    <path
      d={`M ${x} ${y - r} Q ${x + w} ${y - w} ${x + r} ${y} Q ${x + w} ${y + w} ${x} ${y + r} Q ${x - w} ${y + w} ${x - r} ${y} Q ${x - w} ${y - w} ${x} ${y - r} Z`}
      fill={color} opacity={opacity}
    />
  );
}

// A golden fruit: a soft glow, the fruit, and a highlight.
function Fruit({ x, y, color }) {
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} opacity={0.4} filter="url(#tosBlur)" />
      <circle cx={x} cy={y} r={2.4} fill={color} />
      <circle cx={x - 0.8} cy={y - 0.8} r={0.9} fill="white" opacity={0.6} />
    </g>
  );
}

function NodeGlow({ x, y, r, color, active }) {
  return (
    <circle
      cx={x} cy={y} r={active ? r * 1.9 : r * 1.5}
      fill={color} opacity={active ? 0.55 : 0.26} filter="url(#tosBlur)"
      className="transition-all duration-500"
    />
  );
}

function NodeCore({ x, y, r, color }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      <ellipse cx={x - r * 0.32} cy={y - r * 0.32} rx={r * 0.4} ry={r * 0.28} fill="white" opacity={0.35} />
    </g>
  );
}

function NodeIcon({ Icon, x, y, size = 14 }) {
  if (!Icon) return null;
  return (
    <foreignObject x={x - size / 2} y={y - size / 2} width={size} height={size} className="pointer-events-none">
      <Icon size={size} color="white" strokeWidth={1.75} />
    </foreignObject>
  );
}

// Small stars sampled along a spiral, played outward when The Story of You
// opens and inward when it closes. Only ever runs on a tap.
function useSpiralParticles(count = 26, samples = 6) {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle0 = (i / count) * 720 + (i % 2 === 0 ? 6 : -6);
    const farRadius = 55 + (i / count) * 230;
    const twist = 240 + (i % 3) * 50;
    const xs = [], ys = [], opacities = [];
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const r = farRadius * t;
      const a = ((angle0 + t * twist) * Math.PI) / 180;
      xs.push(Math.cos(a) * r);
      ys.push(Math.sin(a) * r);
      opacities.push(t < 0.15 ? t / 0.15 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1);
    }
    return { id: i, xs, ys, opacities, size: 1.5 + (i % 4) * 0.6, gold: i % 5 === 0 };
  }), [count, samples]);
}

function PortalSwirl({ origin, direction = "in" }) {
  const particles = useSpiralParticles();
  if (!origin) return null;
  const reverse = direction === "out";
  const coreScale = reverse ? [1.5, 1.6, 0.4] : [0.4, 1.5, 1.1];
  const coreOpacity = reverse ? [0.9, 0.8, 0] : [0.4, 0.9, 0];
  return (
    <div className="fixed z-[60] pointer-events-none" style={{ left: origin.x, top: origin.y }}>
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 22, height: 22, marginLeft: -11, marginTop: -11,
          background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(201,162,77,0.45) 45%, transparent 75%)",
          filter: "blur(2px)"
        }}
        initial={{ scale: coreScale[0], opacity: coreOpacity[0] }}
        animate={{ scale: coreScale, opacity: coreOpacity }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      {particles.map(p => {
        const xs = reverse ? [...p.xs].reverse() : p.xs;
        const ys = reverse ? [...p.ys].reverse() : p.ys;
        const opacities = reverse ? [...p.opacities].reverse() : p.opacities;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2,
              background: p.gold ? "#C9A24D" : "#EDE6D6"
            }}
            initial={{ x: xs[0], y: ys[0], opacity: 0 }}
            animate={{ x: xs, y: ys, opacity: opacities }}
            transition={{ duration: 0.9, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

export default function TreeOfStars() {
  const [hoverStar, setHoverStar] = useState(null);
  // Full screen (Cassidy, Oct 25): the tree fills the screen, sized to fit
  // its height, with the details still opening underneath. Uses the
  // browser's own full screen where it's allowed, so the bars hide too.
  // On a phone it opens straight into the immersive view (Cassidy, Oct 28:
  // "fit the entirety of the screen so it is an interactive experience").
  const [full, setFull] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);
  // The tree fills the screen's height; on a narrow phone its branches run
  // past the sides, so the view pans sideways, starting from the trunk.
  const panRef = useRef(null);
  const [swipeHint, setSwipeHint] = useState(false);
  // Portrait phones are narrower than the tree's shape: it fills the width
  // and its sky and soil carry on above and below. Wider screens fit the
  // height, and the sky runs out to the sides.
  const [tall, setTall] = useState(() => typeof window !== "undefined" && window.innerWidth < window.innerHeight * (SVG_W / SVG_H));
  useEffect(() => {
    if (!full) return;
    const onResize = () => setTall(window.innerWidth < window.innerHeight * (SVG_W / SVG_H));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [full]);
  function enterFull() {
    setFull(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }
  function exitFull() {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
  useEffect(() => {
    if (!full || !tall) return;
    const el = panRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    setSwipeHint(true);
    const t = setTimeout(() => setSwipeHint(false), 3500);
    return () => clearTimeout(t);
  }, [full, tall]);
  useEffect(() => {
    if (!full) return;
    const onKey = e => { if (e.key === "Escape") exitFull(); };
    const onChange = () => { if (!document.fullscreenElement) setFull(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onChange);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onChange); };
  }, [full]);
  const { pillars, values, identityVisions, valueChallenges, reflections, level, focusSessions, profile } = useAppData();
  const firstName = profile?.name?.trim().split(" ")[0] || "";
  // The garden: focus sessions growing around the trunk. Tapping it zooms
  // the view down into the soil, then opens the garden up close.
  const garden = useMemo(
    () => gardenLayout(focusSessions, { trunkX: TRUNK_X, groundY: GROUND_Y, width: SVG_W }),
    [focusSessions]
  );
  const [gardenZoom, setGardenZoom] = useState(false);
  const [gardenOpen, setGardenOpen] = useState(false);
  // Opened on a timer rather than when the zoom animation reports it's done:
  // a browser that pauses animation (a hidden tab) would otherwise leave
  // the Tree stuck zoomed in.
  function openGarden() {
    if (gardenZoom) return;
    setGardenZoom(true);
    setTimeout(() => { setGardenOpen(true); setGardenZoom(false); }, 700);
  }
  const [selected, setSelected] = useState(null); // { type: "value"|"pillar"|"star", key }
  const [addingVision, setAddingVision] = useState(false);

  // ── Roots: the 8 Pillars ──
  const roots = useMemo(() => {
    const maxXp = Math.max(1, ...pillars.map(p => p.xp));
    const byName = Object.fromEntries(pillars.map(p => [p.name, p]));
    const inner = INNER_PILLARS.map((name, i) => {
      const p = byName[name] || { name, xp: 0, color: "#9a8870" };
      const growth = p.xp / maxXp;
      const offsets = [-125, -45, 45, 125];
      return { ...p, inner: true, growth, x: TRUNK_X + offsets[i] * (0.8 + growth * 0.3), y: GROUND_Y + 190 + growth * 150 };
    });
    const outer = OUTER_PILLARS.map((name, i) => {
      const p = byName[name] || { name, xp: 0, color: "#9a8870" };
      const growth = p.xp / maxXp;
      const side = i < 2 ? -1 : 1;
      const reach = 190 + growth * 150 + (i % 2 === 0 ? 0 : 40);
      return { ...p, inner: false, growth, x: TRUNK_X + side * Math.min(reach, TRUNK_X - 50), y: GROUND_Y + 55 + (i % 2) * 50 + growth * 20 };
    });
    return [...inner, ...outer];
  }, [pillars]);

  // ── Branches: the Seeker's values (active first, then resting) ──
  const branches = useMemo(() => {
    const ordered = [...values.filter(v => v.status !== "rested"), ...values.filter(v => v.status === "rested")];
    return ordered.map((v, i) => {
      const prestige = v.prestige || 0;
      const req = prestigeRequirement(prestige);
      const tierIndex = TIERS.indexOf(getTier(Math.min(99, Math.round((v.rating / req) * 99))));
      const aiDone = valueChallenges.filter(c => c.value_name === v.name && c.completed).length;
      const explorations = new Set(reflections.filter(r => r.value_name === v.name && r.questionnaire === "light_shadow").map(r => r.session_id)).size;
      const fruit = (v.completed || []).length + aiDone + explorations;
      const pos = archPos(i, ordered.length, BRANCH_MARGIN_X, SVG_W - BRANCH_MARGIN_X * 2, BRANCH_BASE_Y, BRANCH_ARCH);
      return {
        name: v.name, rating: v.rating, prestige, tierIndex, fruit,
        resting: v.status === "rested",
        color: VALUE_COLORS[v.name] || "#C9A24D",
        fruitColor: FRUIT_COLORS[prestige % FRUIT_COLORS.length],
        pillars: [VALUE_PILLAR[v.name], VALUE_PILLAR2[v.name]].filter(Boolean),
        x: pos.x, y: pos.y
      };
    });
  }, [values, valueChallenges, reflections]);

  // ── Sky: visions as stars, spread across the cosmos above the canopy ──
  // Vision stars sit either side of The Story of You, alternating left and
  // right (Cassidy, Nov 4: one was hidden under it). Each label points
  // away from the middle, or inward at the sky's edge, so no words run
  // under the orb; near the Life Constellations doorway they sit lower.
  const stars = useMemo(() => {
    const sides = [[], []];
    identityVisions.forEach((v, i) => sides[i % 2].push(v));
    const CLEAR = 135; // half-width kept free around The Story of You
    const place = (list, side) => list.map((v, j) => {
      const k = list.length;
      const t = k <= 1 ? 0.5 : j / (k - 1);
      const near = TRUNK_X + (side ? CLEAR : -CLEAR);
      const far = side ? SVG_W - 60 : 60;
      const x = near + (far - near) * (k <= 1 ? 0.45 : t);
      let y = j % 2 ? 158 : 104;
      if (side && x > SVG_W - 190) y = 168;
      // Labels point away from the middle; at the sky's edge, back inward.
      const outward = side ? "start" : "end";
      const atEdge = side ? x > SVG_W - 200 : x < 200;
      const anchor = atEdge ? (side ? "end" : "start") : outward;
      return { ...v, x, y, anchor };
    });
    return [...place(sides[0], 0), ...place(sides[1], 1)];
  }, [identityVisions]);

  const active = useMemo(() => {
    if (!selected) return null;
    const vals = new Set(), pils = new Set(), starIds = new Set();
    const addPillar = name => {
      pils.add(name);
      stars.forEach(s => { if (s.category === name) starIds.add(s.id); });
    };
    if (selected.type === "value") {
      vals.add(selected.key);
      (branches.find(b => b.name === selected.key)?.pillars || []).forEach(addPillar);
    } else if (selected.type === "pillar") {
      addPillar(selected.key);
      branches.forEach(b => { if (b.pillars.includes(selected.key)) vals.add(b.name); });
    } else if (selected.type === "star") {
      const s = stars.find(x => x.id === selected.key);
      starIds.add(selected.key);
      if (s) {
        pils.add(s.category);
        branches.forEach(b => { if (b.pillars.includes(s.category)) vals.add(b.name); });
      }
    }
    return { vals, pils, starIds };
  }, [selected, branches, stars]);

  function toggle(type, key) {
    setSelected(prev => (prev && prev.type === type && prev.key === key ? null : { type, key }));
  }

  const dim = isMember => (active ? (isMember ? 1 : 0.12) : 1);

  const editingVision = selected?.type === "star" ? identityVisions.find(v => v.id === selected.key) : null;
  const [editOpen, setEditOpen] = useState(false);
  // Which full-screen sky is open through the portal: "story" | "constellations" | null.
  const [sky, setSky] = useState(null);
  const storyOpen = sky !== null;
  const [portalOrigin, setPortalOrigin] = useState(null);
  const [portalFx, setPortalFx] = useState(false);
  const [portalDir, setPortalDir] = useState("in");
  const svgRef = useRef(null);

  // Maps the orb's SVG coordinates through the svg's own bounding rect, so
  // the portal is centred on the dot itself, exactly where it was tapped.
  function svgPointToScreen(svgX, svgY) {
    const svg = svgRef.current;
    if (!svg) return { x: window.innerWidth / 2, y: 80 };
    const rect = svg.getBoundingClientRect();
    return { x: rect.left + (svgX / SVG_W) * rect.width, y: rect.top + (svgY / SVG_H) * rect.height };
  }

  function openSky(which) {
    const orb = which === "constellations" ? CONSTELLATION_ORB : STORY_ORB;
    if (which) setPortalOrigin(svgPointToScreen(orb.x, orb.y));
    setPortalDir(which ? "in" : "out");
    setPortalFx(true);
    setTimeout(() => setPortalFx(false), 900);
    setSky(which);
  }

  // Arriving with { open: "constellations" } (e.g. from a Wandering) opens
  // that sky straight away — still a response to the Seeker's own tap.
  const location = useLocation();
  useEffect(() => {
    if (location.state?.open === "constellations") openSky("constellations");
  }, []);

  function portalClip(radiusPct) {
    const o = portalOrigin || { x: window.innerWidth / 2, y: 80 };
    return `circle(${radiusPct}% at ${o.x}px ${o.y}px)`;
  }

  // Background stars in three depths. The sky is still (Cassidy, Nov 4:
  // the stars used to drift with the cursor or the phone's tilt).
  const bgStars = useMemo(() => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const layer = (n, rMin, rMax, oMin, oMax, depth) => Array.from({ length: n }, () => ({
      x: rand() * SVG_W, y: rand() * 330, r: rMin + rand() * (rMax - rMin), o: oMin + rand() * (oMax - oMin), depth
    }));
    // Nothing sparkles over the two doorways or their names.
    const clear = st => [STORY_ORB, CONSTELLATION_ORB].every(o => Math.abs(st.x - o.x) > 80 || st.y - o.y > 60 || o.y - st.y > 40);
    return [layer(70, 0.3, 0.8, 0.12, 0.35, 0), layer(40, 0.6, 1.2, 0.25, 0.55, 1), layer(14, 1.1, 1.8, 0.5, 0.85, 2)].map(l => l.filter(clear));
  }, []);
  // The painting for the Seeker's level takes the place of the drawn soil
  // and trunk; everything living is laid over it.
  // On a local dev copy, /journey?tree-tier=5 shows any tier, to check them all.
  const forcedTier = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get("tree-tier")) - 1 : -1;
  const tierIndex = forcedTier >= 0 && forcedTier < TREE_TIERS.length
    ? forcedTier
    : Math.max(0, Math.min(TREE_TIERS.length - 1, LEVELS.findIndex(l => l.name === level?.name)));
  const [painted, setPainted] = useState(false);
  const [grewFrom, setGrewFrom] = useState(null);
  const tier = painted ? TREE_TIERS[tierIndex] : null;
  useEffect(() => {
    setPainted(false);
    const img = new Image();
    img.onload = () => {
      setPainted(true);
      // Grown since this tree was last seen here: the old tree gives way to
      // the new one, once.
      let seen = null;
      try { seen = Number(localStorage.getItem(TREE_SEEN)); } catch { /* private mode */ }
      if (Number.isInteger(seen) && seen >= 0 && seen < tierIndex) setGrewFrom(seen);
      try { localStorage.setItem(TREE_SEEN, String(tierIndex)); } catch { /* fine */ }
    };
    img.src = treeImage(tierIndex);
  }, [tierIndex]);

  return (
    <div
      className={full ? "fixed inset-0 z-40 overflow-y-auto px-3 pb-10 font-sans" : "pt-1 pb-6"}
      // Immersive (Cassidy, Oct 28: "leave no screen border"): no frame, and
      // the tree's own night and soil run on to every edge.
      style={full ? { background: tall ? (painted ? "linear-gradient(180deg, #0c0b22 50%, #25100c 50%)" : "linear-gradient(180deg, #060b08 50%, #0d0906 50%)") : "linear-gradient(180deg, #060b08 0%, #0A0A1C 36%, #0E0E26 62%, #1a120b 64%, #0d0906 100%) top / 100% 100dvh no-repeat, #0d0906" } : undefined}
      role={full ? "dialog" : undefined}
      aria-label={full ? "Tree of YOU, full screen" : undefined}
    >
      {full ? (
        <>
          {/* Stars across the whole sky, beside the tree as well as in it. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: tall ? "50dvh" : "62dvh",
              backgroundImage: "radial-gradient(1px 1px at 14% 22%, rgba(237,230,214,0.7) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 62% 38%, rgba(237,230,214,0.55) 50%, transparent 51%), radial-gradient(1px 1px at 84% 12%, rgba(224,184,101,0.6) 50%, transparent 51%), radial-gradient(1px 1px at 36% 74%, rgba(237,230,214,0.4) 50%, transparent 51%)",
              backgroundSize: "170px 170px, 230px 230px, 260px 260px, 200px 200px"
            }}
            aria-hidden="true"
          />
          <div className="fixed left-0 right-0 z-50 flex items-center justify-between px-4 pointer-events-none" style={{ top: "max(env(safe-area-inset-top), 10px)" }}>
            <span className="font-serif text-h3 text-[#EDE6D6]/80 drop-shadow">Tree of YOU</span>
            <button type="button" onClick={exitFull} aria-label="Leave full screen" className="pointer-events-auto w-11 h-11 rounded-full flex items-center justify-center text-[#EDE6D6] bg-black/30 backdrop-blur-sm hover:bg-black/45">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="font-serif text-h2 font-medium">Tree of YOU</div>
            <button type="button" onClick={enterFull} className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border border-borderC text-caption text-textSecondary hover:text-textPrimary">
              <Maximize2 size={14} strokeWidth={1.75} /> Full screen
            </button>
          </div>
          <Guide className="mb-3">
            Your Pillars are the roots, your Values the branches, bearing fruit as they ripen. The canopy
            reaches into the stars: the versions of yourself you're growing toward. Tap anything to trace
            what feeds it.
            <TreeKey className="mt-2.5" />
          </Guide>
        </>
      )}

      <div
        ref={panRef}
        className={full ? `relative -mx-3 flex overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${tall ? "" : "justify-center"}` : undefined}
        style={full ? { minHeight: "100dvh" } : undefined}
      >
      <div className={full ? "flex-none" : undefined} style={full ? { width: `calc(100dvh * ${SVG_W / SVG_H})` } : undefined}>
      <motion.div
        className={full ? "relative overflow-hidden" : "relative rounded-card overflow-hidden border border-borderC"}
        style={full ? { background: "linear-gradient(180deg, #060b08 0%, #0A0A1C 36%, #0E0E26 62%, #1a120b 64%, #0d0906 100%)" } : { background: "linear-gradient(180deg, #060b08 0%, #0A0A1C 36%, #0E0E26 62%, #1a120b 64%, #0d0906 100%)", boxShadow: "inset 0 0 60px -10px rgba(0,0,0,0.6)" }}
        animate={{ scale: storyOpen ? 0.97 : 1, filter: storyOpen ? "blur(1.5px)" : "blur(0px)" }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        <motion.div
          style={{ transformOrigin: `50% ${(GROUND_Y / SVG_H) * 100}%` }}
          animate={{ scale: gardenZoom ? 3.2 : 1, opacity: gardenZoom ? 0.6 : 1 }}
          transition={{ duration: gardenZoom ? 0.75 : 0.5, ease: easeOut }}
        >
        <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block w-full h-auto">
          <defs>
            <filter id="tosBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <linearGradient id="tosSoil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b2a1c" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0d0906" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="tosBark" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3a2a1d" />
              <stop offset="50%" stopColor="#6b4a2f" />
              <stop offset="100%" stopColor="#3a2a1d" />
            </linearGradient>
            <linearGradient id="tosBough" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#945a37" />
              <stop offset="55%" stopColor="#7a4a2e" />
              <stop offset="100%" stopColor="#613627" />
            </linearGradient>
            <linearGradient id="tosRootDim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#25100c" stopOpacity="0" />
              <stop offset="12%" stopColor="#25100c" stopOpacity="1" />
              <stop offset="100%" stopColor="#1a0b08" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="tosBoughLit" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#d59a55" />
              <stop offset="50%" stopColor="#b5773f" />
              <stop offset="100%" stopColor="#8a5530" />
            </linearGradient>
            <linearGradient id="tosRootWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a4a2e" />
              <stop offset="100%" stopColor="#3d2216" />
            </linearGradient>
            <radialGradient id="tosFruitShine" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="tosNebulaA" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8A62C4" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#8A62C4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tosNebulaB" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E0A458" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#E0A458" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tosHorizon" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#E0A458" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E0A458" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tosSushumna" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#E8C877" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#FFF3CC" stopOpacity="1" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="tosGalaxy" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#C9A24D" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#7c5cbf" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4a8fa0" stopOpacity="0" />
            </radialGradient>
          </defs>

          {painted && <image href={treeImage(tierIndex)} x={0} y={0} width={SVG_W} height={SVG_H} preserveAspectRatio="xMidYMid slice" />}
          {painted && grewFrom != null && (
            <motion.image
              href={treeImage(grewFrom)} x={0} y={0} width={SVG_W} height={SVG_H} preserveAspectRatio="xMidYMid slice"
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 3.2, delay: 0.8, ease: "easeInOut" }}
            />
          )}
          {painted && grewFrom != null && (
            <motion.g
              pointerEvents="none"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 7, times: [0, 0.18, 0.75, 1], ease: "easeInOut" }}
            >
              <text x={TRUNK_X} y={GROUND_Y + 120} textAnchor="middle" fontSize="34" fill="#F7EEDC" fontFamily="Cormorant Garamond, Georgia, serif" style={{ paintOrder: "stroke", stroke: "#1a0b08", strokeWidth: 6, strokeOpacity: 0.55 }}>
                Your tree has grown
              </text>
              <text x={TRUNK_X} y={GROUND_Y + 156} textAnchor="middle" fontSize="18" fill="#E8C877" fontFamily="DM Sans, sans-serif" letterSpacing="0.12em" style={{ paintOrder: "stroke", stroke: "#1a0b08", strokeWidth: 5, strokeOpacity: 0.55 }}>
                {(LEVELS[tierIndex]?.name || "").toUpperCase()}
              </text>
            </motion.g>
          )}
          {tier?.dim > 0 && (
            <rect x={0} y={GROUND_Y - 10} width={SVG_W} height={SVG_H - GROUND_Y + 10} fill="url(#tosRootDim)" style={{ opacity: tier.dim }} pointerEvents="none" />
          )}

          {/* The sky: a faint nebula, then stars at three depths (over the
              painting, which has its own, only the nearest sparkles) */}
          {!painted && <g>
            <ellipse cx={SVG_W * 0.3} cy={170} rx={260} ry={110} fill="url(#tosNebulaA)" />
            <ellipse cx={SVG_W * 0.72} cy={240} rx={220} ry={90} fill="url(#tosNebulaB)" />
          </g>}
          {bgStars.map((layer, d) => (painted && d < 2) ? null : (
            <g key={d}>
              {layer.map((s, i) => d === 2
                ? <Sparkle key={i} x={s.x} y={s.y} r={s.r * 2.6} color="#F3EAD6" opacity={s.o} />
                : <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EDE6D6" opacity={s.o} />)}
            </g>
          ))}

          {/* Soil — the unseen: shadow as nourishment, not threat */}
          {!painted && <path d={`M 0 ${GROUND_Y} Q ${TRUNK_X} ${GROUND_Y - 26} ${SVG_W} ${GROUND_Y} L ${SVG_W} ${SVG_H} L 0 ${SVG_H} Z`} fill="url(#tosSoil)" />}
          {!painted && <ellipse cx={TRUNK_X} cy={GROUND_Y - 4} rx={SVG_W * 0.55} ry={60} fill="url(#tosHorizon)" />}
          {!painted && <path d={`M 0 ${GROUND_Y} Q ${TRUNK_X} ${GROUND_Y - 26} ${SVG_W} ${GROUND_Y}`} fill="none" stroke="#6b4a2f" strokeWidth={1.5} opacity={0.5} />}
          <text x={24} y={GROUND_Y + 30} fontSize="11" fill="#EDE6D6" opacity={0.35} fontFamily="DM Sans, sans-serif" style={{ letterSpacing: "0.08em" }}>
            OUTER ROOTS SPREAD WIDE
          </text>
          <text x={24} y={SVG_H - 22} fontSize="11" fill="#EDE6D6" opacity={0.35} fontFamily="DM Sans, sans-serif" style={{ letterSpacing: "0.08em" }}>
            INNER ROOTS GROW DEEP
          </text>

          {/* Roots (Pillars) */}
          {roots.map((r, i) => {
            const isMember = active ? active.pils.has(r.name) : false;
            const curve = rootCurve(r.x, r.y, tier);
            const shown = active ? (isMember ? 1 : 0.12) : 1;
            const grow = { duration: 1.1, ease: easeOut, delay: 0.05 * i };
            return (
              <g key={r.name + "-root"}>
                {/* the soil glowing around it, in the Pillar's colour */}
                <path
                  d={curveD(curve)} fill="none" stroke={r.color} strokeLinecap="round"
                  strokeWidth={10 + r.growth * 12} filter="url(#tosBlur)"
                  opacity={active ? (isMember ? 0.45 : 0) : 0.14 + r.growth * 0.2}
                  className="transition-opacity duration-500"
                />
                {/* the root itself: wood, thick at the trunk, fine at the tip */}
                {!tier?.paintedRoots && <motion.path
                  d={limbShape(curve, 14 + r.growth * 10, 2.6)}
                  fill="url(#tosRootWood)" stroke="#2a150c" strokeOpacity={0.5} strokeWidth={0.6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: shown * 0.92 }}
                  transition={{ opacity: grow }}
                />}
                {/* a vein of light running through it */}
                <motion.path
                  d={curveD(curve)} fill="none" stroke={r.color} strokeLinecap="round"
                  strokeWidth={(tier?.paintedRoots ? 2.4 : 1.2) + r.growth * 1.6 + (active && isMember ? 0.8 : 0)}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: shown * 0.85 }}
                  transition={{ pathLength: grow, opacity: { duration: 0.4 } }}
                />
              </g>
            );
          })}

          {/* Trunk — the Seeker */}
          {!painted && (
            <g opacity={active ? 0.5 : 1} className="transition-opacity duration-500">
              <path d={TRUNK_SHAPE} fill="url(#tosBark)" opacity={0.95} />
              <path d={TRUNK_SHAPE} fill="none" stroke="#E0A458" strokeOpacity={0.22} strokeWidth={1.2} />
              {[-12, -4, 6, 14].map((dx, i) => (
                <path key={i} d={`M ${TRUNK_X + dx * 1.6} ${GROUND_Y - 4} C ${TRUNK_X + dx * 1.2} ${GROUND_Y - 70}, ${TRUNK_X + dx * 0.7} ${TRUNK_TOP_Y + 90}, ${TRUNK_X + dx * 0.55} ${TRUNK_TOP_Y + 18}`}
                  fill="none" stroke="#2a1d12" strokeOpacity={0.45} strokeWidth={1} />
              ))}
            </g>
          )}

          {/* Branches (Values) */}
          {branches.map((b, i) => {
            const isMember = active ? active.vals.has(b.name) : false;
            const curve = branchCurve(b.x, b.y, tier);
            const base = b.resting ? 10 : 16 + b.tierIndex * 3 + Math.min(b.prestige, 4) * 1.2;
            const shown = active ? (isMember ? 1 : 0.1) : b.resting ? 0.7 : 1;
            const grow = { duration: 1.1, ease: easeOut, delay: 0.3 + 0.05 * i };
            return (
              <g key={b.name + "-branch"}>
                {/* the bough: the painting's own bark, a resting one weathered silver */}
                <motion.path
                  d={limbShape(curve, base, 4)}
                  fill={b.resting ? "#8f8a80" : tier?.lit ? "url(#tosBoughLit)" : "url(#tosBough)"}
                  stroke={b.resting ? "#5f5b54" : "#3d2216"} strokeOpacity={0.55} strokeWidth={0.7}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: shown * 0.97 }}
                  transition={{ opacity: grow }}
                />
                {/* light catching its upper edge, as on the trunk */}
                {!b.resting && (
                  <motion.path
                    d={curveD(curve)} fill="none" stroke="#da8c55" strokeLinecap="round"
                    strokeWidth={1} transform="translate(-1.5 -1)"
                    initial={{ opacity: 0 }} animate={{ opacity: shown * 0.35 }} transition={{ opacity: grow }}
                  />
                )}
                {/* the value's colour running through it, like the trunk's gold vines */}
                <motion.path
                  d={curveD(curve)} fill="none" strokeLinecap="round"
                  stroke={b.resting ? "#D6D0C4" : b.color}
                  strokeDasharray={b.resting ? "4 7" : undefined}
                  strokeWidth={b.resting ? 1 : 1.4 + b.tierIndex * 0.35 + (active && isMember ? 0.8 : 0)}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: shown * (b.resting ? 0.45 : 0.8) }}
                  transition={{ pathLength: grow, opacity: { duration: 0.4 } }}
                />
              </g>
            );
          })}

          {/* Branch tips: foliage, icon, fruit, name */}
          {branches.map((b, i) => {
            const isMember = active ? active.vals.has(b.name) : false;
            const Icon = VALUE_ICONS[b.name];
            const shownFruit = b.resting ? 0 : Math.min(b.fruit, MAX_FRUIT);
            return (
              <motion.g
                key={b.name}
                className="cursor-pointer"
                onClick={() => toggle("value", b.name)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: dim(isMember) * (b.resting ? 0.6 : 1), scale: 1 }}
                transition={{ delay: 0.7 + 0.06 * i, duration: 0.5, ease: easeOut }}
              >
                {b.resting
                  ? <RestingTip x={b.x} y={b.y} Icon={Icon} />
                  : <Canopy name={b.name} x={b.x} y={b.y} depth={b.tierIndex + Math.min(b.prestige, 3)} color={b.color} fruit={shownFruit} fruitColor={b.fruitColor} Icon={Icon} active={active && isMember} />}
                {/* the name just under its crown, by the branch, in the serif, with a soft dark
                    edge so it reads against the sky */}
                <text
                  x={b.x} y={b.y + (b.resting ? 24 : 32)} textAnchor="middle" fontSize="16" fill="#F7EEDC"
                  fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600" letterSpacing="0.02em"
                  opacity={b.resting ? 0.6 : 1}
                  style={{ paintOrder: "stroke", stroke: "#120a1f", strokeWidth: 4, strokeOpacity: 0.7 }}
                >
                  {b.name}{b.resting ? " · resting" : ""}
                </text>
              </motion.g>
            );
          })}

          {branches.length === 0 && (
            <text x={TRUNK_X} y={BRANCH_BASE_Y - 60} textAnchor="middle" fontSize="14" fill="#EDE6D6" opacity={0.6} fontFamily="DM Sans, sans-serif">
              Values you choose will grow here as branches.
            </text>
          )}

          {/* Root tips */}
          {roots.map((r, i) => {
            const isMember = active ? active.pils.has(r.name) : false;
            const Icon = PILLAR_ICONS[r.name];
            return (
              <motion.g
                key={r.name}
                className="cursor-pointer"
                onClick={() => toggle("pillar", r.name)}
                initial={{ opacity: 0 }}
                animate={{ opacity: dim(isMember) }}
                transition={{ delay: 0.5 + 0.05 * i, duration: 0.5, ease: easeOut }}
              >
                <NodeGlow x={r.x} y={r.y} r={15} color={r.color} active={active && isMember} />
                <NodeCore x={r.x} y={r.y} r={10} color={r.color} />
                <NodeIcon Icon={Icon} x={r.x} y={r.y} size={12} />
                <text x={r.x} y={r.y + 26} textAnchor="middle" fontSize="12" fill="#EDE6D6" opacity={0.85} fontFamily="DM Sans, sans-serif">
                  {r.name}
                </text>
              </motion.g>
            );
          })}

          {/* The garden: a bloom or resting seed for every focus session */}
          {garden.length > 0 && (
            <g
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Your garden: ${garden.length} focus ${garden.length === 1 ? "session" : "sessions"}. Open it.`}
              onClick={openGarden}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && openGarden()}
              opacity={active ? 0.35 : 1}
            >
              <rect x={0} y={GROUND_Y - 60} width={SVG_W} height={80} fill="transparent" />
              {garden.map(({ s, x, y, scale, opacity }) => (
                <g key={s.id} opacity={opacity}>
                  {s.outcome === "bloom"
                    ? <GardenBloom x={x} y={y} color={PILLAR_COLORS[s.pillar] || "#C9A24D"} scale={scale} />
                    : <GardenSeed x={x} y={y} scale={scale * 1.2} />}
                  {(s.mementos || []).length > 0 && <MementoSpark x={x + 7 * scale} y={y - (s.outcome === "bloom" ? 30 : 10) * scale} scale={scale} />}
                </g>
              ))}
            </g>
          )}

          {/* The heart of the tree (Cassidy, Nov 4): Sushumna, the central
              channel, rising through the trunk from root to crown, with Ida
              (moon, silver, from the left) and Pingala (sun, gold, from the
              right) spiralling around it and crossing at the seven chakras.
              Still, like the sky. The Seeker's name and level stay for
              screen readers and on hover. */}
          <NadiChannels
            bottom={GROUND_Y - 6}
            top={(tier?.top ?? TRUNK_TOP_Y) + 22}
            dimmed={Boolean(active)}
            awake={selected?.type === "value" || selected?.type === "pillar"}
            label={`${firstName ? `${firstName}, the` : "The"} ${level?.name || "Seedling"}`}
          />

          {/* Stars — visions, in the cosmos the canopy reaches toward */}
          {/* Each star's vision is written faintly beside it, brighter on
              hover or focus, so the sky can be read without tapping
              (Cassidy, Nov 2); a tap still opens it. */}
          {stars.map((s, i) => {
            const isMember = active ? active.starIds.has(s.id) : false;
            const lit = isMember || hoverStar === s.id;
            const label = s.title.length > 26 ? `${s.title.slice(0, 25)}…` : s.title;
            return (
              <motion.g
                key={s.id}
                className="cursor-pointer outline-none"
                role="button"
                tabIndex={0}
                aria-label={`Vision: ${s.title}`}
                onClick={() => toggle("star", s.id)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle("star", s.id))}
                onMouseEnter={() => setHoverStar(s.id)}
                onMouseLeave={() => setHoverStar(h => (h === s.id ? null : h))}
                onFocus={() => setHoverStar(s.id)}
                onBlur={() => setHoverStar(h => (h === s.id ? null : h))}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: dim(isMember), scale: 1 }}
                transition={{ delay: 1 + i * 0.08, duration: 0.5, ease: easeOut }}
              >
                <circle cx={s.x} cy={s.y} r={14} fill="transparent" />
                <NodeGlow x={s.x} y={s.y} r={lit ? 13 : 10} color={PILLAR_COLORS[s.category] || "#EDE6D6"} active={(active && isMember) || hoverStar === s.id} />
                <Sparkle x={s.x} y={s.y} r={lit ? 11 : 9} color="#F7F1E1" />
                <circle cx={s.x} cy={s.y} r={2.2} fill={PILLAR_COLORS[s.category] || "#C9A24D"} />
                <text
                  x={s.anchor === "end" ? s.x - 12 : s.x + 12}
                  y={s.y + 4}
                  textAnchor={s.anchor}
                  fontSize={lit ? 12 : 10.5}
                  fill="#EDE6D6"
                  opacity={lit ? 0.95 : 0.42}
                  fontFamily="DM Sans, sans-serif"
                  style={{ transition: "opacity 200ms, font-size 200ms" }}
                  pointerEvents="none"
                >
                  {lit ? s.title : label}
                </text>
              </motion.g>
            );
          })}

          {/* The Story of You — opens the cosmos of Chapters when tapped */}
          <motion.g
            className="cursor-pointer"
            onClick={() => openSky("story")}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6, ease: easeOut }}
          >
            <circle cx={STORY_ORB.x} cy={STORY_ORB.y} r={44} fill="url(#tosGalaxy)" opacity={0.5} filter="url(#tosBlur)" />
            <circle cx={STORY_ORB.x} cy={STORY_ORB.y} r={30} fill="none" stroke="#EDE6D6" strokeOpacity={0.3} strokeDasharray="1 5" />
            <circle cx={STORY_ORB.x} cy={STORY_ORB.y} r={16} fill="url(#tosGalaxy)" />
            <text
              x={STORY_ORB.x} y={STORY_ORB.y + 46} textAnchor="middle" fontSize="10.5" fill="#EDE6D6" opacity={0.85}
              fontFamily="DM Sans, sans-serif" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              The Story of You
            </text>
          </motion.g>

          {/* Life Constellations — memories over the places they happened */}
          <motion.g
            className="cursor-pointer"
            role="button"
            aria-label="Open Life Constellations"
            onClick={() => openSky("constellations")}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.6, ease: easeOut }}
          >
            <circle cx={CONSTELLATION_ORB.x} cy={CONSTELLATION_ORB.y} r={34} fill="#4a8fa0" opacity={0.18} filter="url(#tosBlur)" />
            <circle cx={CONSTELLATION_ORB.x} cy={CONSTELLATION_ORB.y} r={26} fill="none" stroke="#EDE6D6" strokeOpacity={0.25} strokeDasharray="1 5" />
            <polyline
              points={[[-12, 6], [-4, -6], [5, -2], [12, -10], [9, 8]].map(([dx, dy]) => `${CONSTELLATION_ORB.x + dx},${CONSTELLATION_ORB.y + dy}`).join(" ")}
              fill="none" stroke="#EDE6D6" strokeOpacity={0.55} strokeWidth={0.9}
            />
            {[[-12, 6, 1.6], [-4, -6, 2.4], [5, -2, 1.5], [12, -10, 2.1], [9, 8, 1.4]].map(([dx, dy, r], i) => (
              <circle key={i} cx={CONSTELLATION_ORB.x + dx} cy={CONSTELLATION_ORB.y + dy} r={r} fill={i === 1 ? "#C9A24D" : "#F7F1E1"} />
            ))}
            <text
              x={CONSTELLATION_ORB.x} y={CONSTELLATION_ORB.y + 44} textAnchor="middle" fontSize="10.5" fill="#EDE6D6" opacity={0.85}
              fontFamily="DM Sans, sans-serif" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              Life Constellations
            </text>
          </motion.g>
        </svg>
        </motion.div>
      </motion.div>
      </div>
      </div>

      <AnimatePresence>
        {full && swipeHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm text-caption text-[#EDE6D6]"
            style={{ bottom: "max(env(safe-area-inset-bottom), 18px)" }}
          >
            Swipe sideways to explore · tap anything
          </motion.div>
        )}
      </AnimatePresence>

      <GardenOfYou open={gardenOpen} sessions={focusSessions} onClose={() => setGardenOpen(false)} />

      <AnimatePresence>
        {sky && (
          <motion.div
            key={sky}
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: "radial-gradient(120% 90% at 50% 10%, #171233 0%, #0b0a1c 45%, #050510 100%)" }}
            initial={{ clipPath: portalClip(1) }}
            animate={{ clipPath: portalClip(150) }}
            exit={{ clipPath: portalClip(1) }}
            transition={{ duration: 0.85, ease: easeOut }}
          >
            {sky === "story"
              ? <StoryOfYou onClose={() => openSky(null)} />
              : <LifeConstellations onClose={() => openSky(null)} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {portalFx && <PortalSwirl origin={portalOrigin} direction={portalDir} />}
      </AnimatePresence>

      {full && <TreeKey className="mt-3" />}

      {!selected && (
        <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mt-3 text-bodySm ${full ? "text-[#B8B5D6]" : "text-textMuted"}`}>
          <span>Tap a root, a branch or a star to trace what feeds it.</span>
          <button
            type="button"
            onClick={() => setAddingVision(true)}
            className={`inline-flex items-center gap-1 min-h-[36px] font-medium ${full ? "text-[#E8C877]" : "text-forestAccent"}`}
          >
            <Plus size={14} strokeWidth={1.75} /> Add a vision
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selected && (
        <motion.div
          key={selected.type + ":" + selected.key}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="rounded-card p-4 mt-4 min-h-[92px]"
          style={{ background: "#131331", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {selected?.type === "value" && (() => {
            const b = branches.find(x => x.name === selected.key);
            if (!b) return null;
            const entry = getValueEntry(b.name);
            const stage = getPrestigeStage(b.prestige);
            return (
              <>
                <div className="text-caption uppercase tracking-wide mb-1" style={{ color: b.color }}>
                  Value · branch{b.resting ? " · resting" : ""}
                </div>
                <div className="font-serif text-h3 text-cream mb-1">{b.name}</div>
                {entry?.essence && <div className="text-bodySm text-[#B8B5D6] italic mb-1.5">{entry.essence}</div>}
                <div className="text-bodySm text-[#B8B5D6]">
                  {b.resting
                    ? "Resting — bare for now, never cut. Its growth is kept."
                    : `${stage.name} · ${TIERS[b.tierIndex].name} · ${b.fruit} fruit of lived depth`}
                </div>
                {b.pillars.length > 0 && (
                  <div className="text-bodySm text-[#8A88AE] mt-1">Draws from {b.pillars.join(" and ")}</div>
                )}
                <Link to="/you" className="inline-block mt-2 text-bodySm underline" style={{ color: "var(--gold)" }}>Open in Values →</Link>
              </>
            );
          })()}

          {selected?.type === "pillar" && (() => {
            const r = roots.find(x => x.name === selected.key);
            const fed = branches.filter(b => b.pillars.includes(r.name));
            return (
              <>
                <div className="text-caption uppercase tracking-wide mb-1" style={{ color: r.color }}>
                  Pillar · {r.inner ? "inner root, grows deep" : "outer root, spreads wide"}
                </div>
                <div className="font-serif text-h3 text-cream mb-1">{r.name}</div>
                <div className="text-bodySm text-[#B8B5D6]">
                  {r.xp} XP · {fed.length ? `feeds ${fed.map(b => b.name).join(", ")}` : "feeds none of your values yet"}
                </div>
                <Link to="/you" className="inline-block mt-2 text-bodySm underline" style={{ color: "var(--gold)" }}>Open in Pillars →</Link>
              </>
            );
          })()}

          {selected?.type === "star" && editingVision && (
            <>
              <div className="text-caption uppercase tracking-wide mb-1 text-cream/70">{editingVision.category} · vision</div>
              <div className="font-serif text-h3 text-cream mb-1">{editingVision.title}</div>
              <div className="text-bodySm text-[#B8B5D6] italic mb-1.5">"{editingVision.statement}"</div>
              {editingVision.reflection && <div className="text-bodySm text-[#8A88AE] mb-1.5">{editingVision.reflection}</div>}
              <button onClick={() => setEditOpen(true)} className="text-bodySm underline" style={{ color: "var(--gold)" }}>Edit this vision →</button>
            </>
          )}
        </motion.div>
        )}
      </AnimatePresence>

      <IdentityVisionModal open={addingVision} onClose={() => setAddingVision(false)} />
      <IdentityVisionModal open={editOpen} vision={editingVision} onClose={() => setEditOpen(false)} />
    </div>
  );
}
