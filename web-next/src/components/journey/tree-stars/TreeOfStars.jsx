import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { PILLAR_ICONS } from "../../../constants/pillarIcons";
import { VALUE_ICONS, getValueEntry } from "../../../constants/valueLibrary";
import { useAppData } from "../../../lib/AppDataContext";
import {
  INNER_PILLARS, OUTER_PILLARS, VALUE_COLORS, VALUE_PILLAR, VALUE_PILLAR2, TIERS,
  getTier, getPrestigeStage, prestigeRequirement
} from "../../../constants/app.const";
import { easeOut } from "../../ui/motion";
import IdentityVisionModal from "../IdentityVisionModal";
import StoryOfYou from "./StoryOfYou";
import LifeConstellations from "./LifeConstellations";

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
const GROUND_Y = 720;          // soil line
const TRUNK_TOP_Y = 560;       // where branches leave the trunk
const BRANCH_BASE_Y = 360, BRANCH_ARCH = 150, BRANCH_MARGIN_X = 80;
const STORY_ORB = { x: TRUNK_X, y: 58 };
const CONSTELLATION_ORB = { x: SVG_W - 92, y: 62 };
const MAX_FRUIT = 8;

// Spread n items across an arch, sampling the middle of each slot so a
// small canopy (two or three values) sits up and out rather than drooping
// to the far edges.
function archPos(i, n, baseX, width, baseY, arch) {
  const t = (i + 0.5) / Math.max(n, 1);
  return { x: baseX + t * width, y: baseY - arch * Math.sin(t * Math.PI) };
}

// Fruit deepens in colour with each prestige cycle.
const FRUIT_COLORS = ["#E0A458", "#D9764A", "#C9A24D", "#B85F6E", "#8FA05E"];

function branchPath(tipX, tipY) {
  return `M ${TRUNK_X} ${TRUNK_TOP_Y + 20} C ${TRUNK_X} ${TRUNK_TOP_Y - 60}, ${tipX} ${tipY + 140}, ${tipX} ${tipY}`;
}

function rootPath(tipX, tipY) {
  const dx = tipX - TRUNK_X;
  return `M ${TRUNK_X + dx * 0.04} ${GROUND_Y - 6} C ${TRUNK_X + dx * 0.25} ${GROUND_Y + 50}, `
       + `${tipX - dx * 0.35} ${tipY - 40}, ${tipX} ${tipY}`;
}

// A trunk that tapers from a wide base to a narrower crown.
const TRUNK_SHAPE =
  `M ${TRUNK_X - 30} ${GROUND_Y + 4} C ${TRUNK_X - 22} ${GROUND_Y - 60}, ${TRUNK_X - 14} ${TRUNK_TOP_Y + 80}, ${TRUNK_X - 11} ${TRUNK_TOP_Y + 10} ` +
  `L ${TRUNK_X + 11} ${TRUNK_TOP_Y + 10} C ${TRUNK_X + 14} ${TRUNK_TOP_Y + 80}, ${TRUNK_X + 22} ${GROUND_Y - 60}, ${TRUNK_X + 30} ${GROUND_Y + 4} Z`;

// Fruit hangs in a small arc beneath and around a branch tip.
function fruitOffset(i, n) {
  const spread = Math.min(Math.PI * 1.1, 0.5 + n * 0.22);
  const start = Math.PI / 2 - spread / 2;
  const a = n === 1 ? Math.PI / 2 : start + (i / (n - 1)) * spread;
  const r = 26 + (i % 2) * 7;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
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
  const { pillars, values, identityVisions, valueChallenges, reflections, level } = useAppData();
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
      return { ...p, inner: true, growth, x: TRUNK_X + offsets[i] * (0.8 + growth * 0.3), y: GROUND_Y + 230 + growth * 140 };
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
  const stars = useMemo(() => {
    const n = identityVisions.length;
    return identityVisions.map((v, i) => {
      const t = n <= 1 ? 0.25 : i / (n - 1);
      // Spread across the sky, kept clear of The Story of You (centre) and
      // the Life Constellations doorway (top right).
      let x = 70 + t * (SVG_W - 250);
      if (Math.abs(x - TRUNK_X) < 70) x += x < TRUNK_X ? -70 : 70;
      return { ...v, x, y: i % 2 ? 150 : 105 };
    });
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

  // Static background stars (no twinkle loop — nothing moves on its own).
  const bgStars = useMemo(() => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: 60 }, () => ({
      x: rand() * SVG_W, y: rand() * 280, r: 0.35 + rand() * 1.0, o: 0.15 + rand() * 0.4
    }));
  }, []);

  return (
    <div className="pt-1 pb-24 px-5">
      <div className="font-serif text-h2 font-medium mb-1">Tree of YOU</div>
      <p className="text-bodySm text-textSecondary mb-4 max-w-[46ch]">
        Your Pillars are the roots, your Values the branches, bearing fruit as they ripen. The canopy
        reaches into the stars: the versions of yourself you're growing toward. Tap anything to trace
        what feeds it.
      </p>

      <motion.div
        className="relative rounded-card overflow-hidden border border-borderC"
        style={{ background: "linear-gradient(180deg, #060b08 0%, #0c1611 36%, #101a14 62%, #1a120b 64%, #0d0906 100%)", boxShadow: "inset 0 0 60px -10px rgba(0,0,0,0.6)" }}
        animate={{ scale: storyOpen ? 0.97 : 1, filter: storyOpen ? "blur(1.5px)" : "blur(0px)" }}
        transition={{ duration: 0.5, ease: easeOut }}
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
            <radialGradient id="tosGalaxy" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#C9A24D" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#7c5cbf" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4a8fa0" stopOpacity="0" />
            </radialGradient>
          </defs>

          {bgStars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EDE6D6" opacity={s.o} />)}

          {/* Soil — the unseen: shadow as nourishment, not threat */}
          <path d={`M 0 ${GROUND_Y} Q ${TRUNK_X} ${GROUND_Y - 26} ${SVG_W} ${GROUND_Y} L ${SVG_W} ${SVG_H} L 0 ${SVG_H} Z`} fill="url(#tosSoil)" />
          <path d={`M 0 ${GROUND_Y} Q ${TRUNK_X} ${GROUND_Y - 26} ${SVG_W} ${GROUND_Y}`} fill="none" stroke="#6b4a2f" strokeWidth={1.5} opacity={0.5} />
          <text x={24} y={GROUND_Y + 30} fontSize="11" fill="#EDE6D6" opacity={0.35} fontFamily="DM Sans, sans-serif" style={{ letterSpacing: "0.08em" }}>
            OUTER ROOTS SPREAD WIDE
          </text>
          <text x={24} y={SVG_H - 22} fontSize="11" fill="#EDE6D6" opacity={0.35} fontFamily="DM Sans, sans-serif" style={{ letterSpacing: "0.08em" }}>
            INNER ROOTS GROW DEEP
          </text>

          {/* Roots (Pillars) */}
          {roots.map((r, i) => {
            const isMember = active ? active.pils.has(r.name) : false;
            return (
              <motion.path
                key={r.name + "-root"}
                d={rootPath(r.x, r.y)}
                fill="none" stroke={r.color} strokeLinecap="round"
                strokeWidth={2.5 + r.growth * 4 + (active && isMember ? 1.5 : 0)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: active ? (isMember ? 0.95 : 0.08) : 0.55 }}
                transition={{ pathLength: { duration: 1.1, ease: easeOut, delay: 0.05 * i }, opacity: { duration: 0.4 } }}
              />
            );
          })}

          {/* Trunk — the Seeker */}
          <path d={TRUNK_SHAPE} fill="url(#tosBark)" opacity={active ? 0.5 : 0.95} className="transition-opacity duration-500" />

          {/* Branches (Values) */}
          {branches.map((b, i) => {
            const isMember = active ? active.vals.has(b.name) : false;
            const width = b.resting ? 2 : 2.5 + b.tierIndex * 1.8 + Math.min(b.prestige, 4) * 0.6;
            return (
              <motion.path
                key={b.name + "-branch"}
                d={branchPath(b.x, b.y)}
                fill="none" strokeLinecap="round"
                stroke={b.resting ? "#7a7568" : b.color}
                strokeDasharray={b.resting ? "5 6" : undefined}
                strokeWidth={width + (active && isMember ? 1.2 : 0)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: active ? (isMember ? 0.95 : 0.07) : b.resting ? 0.45 : 0.75 }}
                transition={{ pathLength: { duration: 1.1, ease: easeOut, delay: 0.3 + 0.05 * i }, opacity: { duration: 0.4 } }}
              />
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
                {!b.resting && <NodeGlow x={b.x} y={b.y} r={22} color={b.color} active={active && isMember} />}
                <NodeCore x={b.x} y={b.y} r={b.resting ? 9 : 12} color={b.resting ? "#5d5a52" : b.color} />
                <NodeIcon Icon={Icon} x={b.x} y={b.y} size={b.resting ? 12 : 15} />
                {Array.from({ length: shownFruit }).map((_, f) => {
                  const off = fruitOffset(f, shownFruit);
                  return (
                    <g key={f}>
                      <circle cx={b.x + off.dx} cy={b.y + off.dy} r={4.6} fill={b.fruitColor} />
                      <circle cx={b.x + off.dx - 1.3} cy={b.y + off.dy - 1.3} r={1.4} fill="white" opacity={0.45} />
                    </g>
                  );
                })}
                <text
                  x={b.x} y={b.y - 22} textAnchor="middle" fontSize="12.5" fill="#EDE6D6"
                  fontFamily="DM Sans, sans-serif" opacity={b.resting ? 0.6 : 0.92}
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

          {/* Seed Being, at the base of the trunk */}
          <g opacity={active ? 0.4 : 1} className="transition-opacity duration-500">
            <circle cx={TRUNK_X} cy={GROUND_Y - 28} r={18} fill="#C9A24D" opacity={0.35} filter="url(#tosBlur)" />
            <NodeCore x={TRUNK_X} y={GROUND_Y - 28} r={8} color="#C9A24D" />
            <text x={TRUNK_X + 22} y={GROUND_Y - 24} fontSize="11" fill="#EDE6D6" opacity={0.75} fontFamily="DM Sans, sans-serif">
              {level?.name || "Seed"}
            </text>
          </g>

          {/* Stars — visions, in the cosmos the canopy reaches toward */}
          {stars.map((s, i) => {
            const isMember = active ? active.starIds.has(s.id) : false;
            return (
              <motion.g
                key={s.id}
                className="cursor-pointer"
                onClick={() => toggle("star", s.id)}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: dim(isMember), scale: 1 }}
                transition={{ delay: 1 + i * 0.08, duration: 0.5, ease: easeOut }}
              >
                <NodeGlow x={s.x} y={s.y} r={9} color="#EDE6D6" active={active && isMember} />
                <NodeCore x={s.x} y={s.y} r={4} color="#EDE6D6" />
                {isMember && (
                  <text x={s.x + 12} y={s.y + 4} fontSize="12" fill="#EDE6D6" fontFamily="DM Sans, sans-serif">
                    {s.title}
                  </text>
                )}
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

      <div className="flex gap-3 mt-3 text-caption text-textMuted flex-wrap">
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "#9a8870" }} />Roots · Pillars</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--gold)" }} />Branches · Values</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: FRUIT_COLORS[0] }} />Fruit · lived depth</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block bg-cream" />Stars · visions</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "#4a8fa0" }} />Constellations · memories over places</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected ? selected.type + ":" + selected.key : "empty"}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="rounded-card p-4 mt-4 min-h-[92px]"
          style={{ background: "#141816", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {!selected && (
            <div className="text-bodySm text-[#8B8E87]">
              Tap a root, a branch, or a star to trace what feeds it.
            </div>
          )}

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
                {entry?.essence && <div className="text-bodySm text-[#B8B3A9] italic mb-1.5">{entry.essence}</div>}
                <div className="text-bodySm text-[#B8B3A9]">
                  {b.resting
                    ? "Resting — bare for now, never cut. Its growth is kept."
                    : `${stage.name} · ${TIERS[b.tierIndex].name} · ${b.fruit} fruit of lived depth`}
                </div>
                {b.pillars.length > 0 && (
                  <div className="text-bodySm text-[#8B8E87] mt-1">Draws from {b.pillars.join(" and ")}</div>
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
                <div className="text-bodySm text-[#B8B3A9]">
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
              <div className="text-bodySm text-[#B8B3A9] italic mb-1.5">"{editingVision.statement}"</div>
              {editingVision.reflection && <div className="text-bodySm text-[#8B8E87] mb-1.5">{editingVision.reflection}</div>}
              <button onClick={() => setEditOpen(true)} className="text-bodySm underline" style={{ color: "var(--gold)" }}>Edit this vision →</button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => setAddingVision(true)}
        className="flex items-center gap-1.5 text-bodySm text-textSecondary border border-borderC rounded-sm px-3 py-2 mt-3"
      >
        <Plus size={14} strokeWidth={1.75} />
        Add a vision to the sky
      </button>

      <IdentityVisionModal open={addingVision} onClose={() => setAddingVision(false)} />
      <IdentityVisionModal open={editOpen} vision={editingVision} onClose={() => setEditOpen(false)} />
    </div>
  );
}
