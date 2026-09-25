import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Dumbbell, Brain, Sparkles, HeartHandshake, Briefcase, Compass, Palette
} from "lucide-react";
import { useAppData } from "../../../lib/AppDataContext";
import {
  PILLAR_COLORS, VALUE_COLORS, VALUE_PILLAR, VALUE_PILLAR2, getTier, getPrestigeStage, prestigeRequirement
} from "../../../constants/app.const";
import { ALL_VALUES_LIB } from "../../../constants/values.const";
import { easeOut } from "../../ui/motion";
import IdentityVisionModal from "../IdentityVisionModal";
import StoryOfYou from "./StoryOfYou";

const SVG_W = 800, SVG_H = 980;
const TRUNK_X = SVG_W / 2, WAIST_Y = 660;
const PILLAR_BASE_Y = 430, PILLAR_ARCH = 150, PILLAR_MARGIN_X = 70;
const ROOT_Y = 918, ROOT_MARGIN_X = 35;
const EARTH_CX = TRUNK_X, EARTH_CY = SVG_H + 60, EARTH_RX = 560, EARTH_RY = 170;
const STORY_ORB = { x: TRUNK_X, y: 55 };

const PILLAR_ICONS = {
  Body: Dumbbell, Mind: Brain, Spirit: Sparkles, Relationships: HeartHandshake,
  Work: Briefcase, Adventure: Compass, Creative: Palette
};

function archPos(i, n, baseX, width, baseY, arch) {
  const t = n <= 1 ? 0.5 : i / (n - 1);
  return { x: baseX + t * width, y: baseY - arch * Math.sin(t * Math.PI) };
}

// Bezier from a root up through a shared "trunk waist" and back out to a
// branch tip — drawn as one continuous curve per root/pillar pair rather
// than a literal shared trunk shape, which is what lets any number of
// roots/branches converge and diverge convincingly without hand-authoring
// a path per pair.
function treePath(rootX, tipX, tipY) {
  return `M ${rootX} ${ROOT_Y - 2} C ${rootX} 820, ${TRUNK_X} 770, ${TRUNK_X} ${WAIST_Y} `
       + `C ${TRUNK_X} ${WAIST_Y - 70}, ${tipX} ${tipY + 130}, ${tipX} ${tipY}`;
}

// Fans stars out above a branch tip in a wide upward arc, radius growing
// per star so a cluster of any size (0 to many) staggers instead of
// stacking in a straight, overlapping line.
function starOffset(index, total) {
  if (total === 1) return { dx: 0, dy: -115 };
  const spread = Math.min(Math.PI * 0.85, 0.4 + total * 0.12);
  const startAngle = -Math.PI / 2 - spread / 2;
  const angle = startAngle + (index / (total - 1)) * spread;
  const radius = 95 + (index % 3) * 26;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function NodeGlow({ x, y, r, color, active }) {
  return (
    <circle
      cx={x} cy={y} r={active ? r * 1.9 : r * 1.5}
      fill={color} opacity={active ? 0.55 : 0.28} filter="url(#tosBlur)"
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

// A handful of small stars sampled along a spiral, each pre-computed as a
// short run of (x, y, opacity) keyframes rather than a literal path —
// framer-motion just interpolates between them. Every particle's path
// starts exactly at the origin (r=0, index 0) and spirals out to some
// scattered radius (index last) — direction of travel (burst out on open,
// collapse in on close) is decided by which end PortalSwirl plays first,
// but the r=0 end is always pinned to the circle either way.
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

// direction "in" = zooming into the circle: stars burst outward from it
// (the "open" moment). direction "out" = zooming back out: the same
// trajectories played in reverse, so stars sweep inward and vanish right
// on the circle (the "close" moment). Either way, the animation is always
// anchored exactly on "The Story of You" dot, never floating free of it.
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
  const { pillars, values, identityVisions } = useAppData();
  const [selected, setSelected] = useState(null); // { type: "value"|"pillar"|"star", key }
  const [addingFor, setAddingFor] = useState(null); // pillar name, or null

  const roots = useMemo(() => ALL_VALUES_LIB.map((lib, i) => {
    const owned = values.find(v => v.name === lib.name);
    const pos = archPos(i, ALL_VALUES_LIB.length, ROOT_MARGIN_X, SVG_W - ROOT_MARGIN_X * 2, ROOT_Y, 0);
    return {
      name: lib.name,
      rating: owned?.rating || 0,
      prestige: owned?.prestige || 0,
      planted: Boolean(owned),
      color: VALUE_COLORS[lib.name] || "var(--gold)",
      pillars: [VALUE_PILLAR[lib.name], VALUE_PILLAR2[lib.name]].filter(Boolean),
      x: pos.x
    };
  }), [values]);

  const branches = useMemo(() => pillars.map((p, i) => {
    const pos = archPos(i, pillars.length, PILLAR_MARGIN_X, SVG_W - PILLAR_MARGIN_X * 2, PILLAR_BASE_Y, PILLAR_ARCH);
    return { ...p, x: pos.x, y: pos.y };
  }), [pillars]);

  const starsByPillar = useMemo(() => {
    const map = {};
    identityVisions.forEach(v => { (map[v.category] || (map[v.category] = [])).push(v); });
    return map;
  }, [identityVisions]);

  const starPositions = useMemo(() => {
    const map = {};
    branches.forEach(b => {
      const cluster = starsByPillar[b.name] || [];
      cluster.forEach((v, i) => {
        const off = starOffset(i, cluster.length);
        map[v.id] = { x: b.x + off.dx, y: b.y + off.dy, pillar: b.name };
      });
    });
    return map;
  }, [branches, starsByPillar]);

  const active = useMemo(() => {
    if (!selected) return null;
    const vals = new Set(), pils = new Set(), stars = new Set();
    function addPillar(name) {
      pils.add(name);
      (starsByPillar[name] || []).forEach(s => stars.add(s.id));
    }
    if (selected.type === "value") {
      const r = roots.find(x => x.name === selected.key);
      vals.add(selected.key);
      (r?.pillars || []).forEach(addPillar);
    } else if (selected.type === "pillar") {
      addPillar(selected.key);
      roots.forEach(r => { if (r.pillars.includes(selected.key)) vals.add(r.name); });
    } else if (selected.type === "star") {
      const v = identityVisions.find(x => x.id === selected.key);
      if (v) {
        addPillar(v.category);
        roots.forEach(r => { if (r.pillars.includes(v.category)) vals.add(r.name); });
      }
    }
    return { vals, pils, stars };
  }, [selected, roots, starsByPillar, identityVisions]);

  function toggle(type, key) {
    setSelected(prev => (prev && prev.type === type && prev.key === key ? null : { type, key }));
  }

  function opacityClass(isMember) {
    if (!active) return "opacity-100";
    return isMember ? "opacity-100" : "opacity-[0.12]";
  }

  const editingVision = selected?.type === "star" ? identityVisions.find(v => v.id === selected.key) : null;
  const [editOpen, setEditOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [portalOrigin, setPortalOrigin] = useState(null);
  const [portalFx, setPortalFx] = useState(false);
  const [portalDir, setPortalDir] = useState("in");
  const svgRef = useRef(null);

  // Computed from the orb's known SVG-space coordinates mapped through the
  // *svg element's* own bounding rect, not the clicked element's — the
  // orb's clickable <g> also contains its label text below the dot, so
  // that group's bounding box (and therefore its center) sits lower than
  // the dot actually is. This maps STORY_ORB directly, so the portal is
  // always centered on the dot itself, exactly where it was clicked.
  function svgPointToScreen(svgX, svgY) {
    const svg = svgRef.current;
    if (!svg) return { x: window.innerWidth / 2, y: 80 };
    const rect = svg.getBoundingClientRect();
    return { x: rect.left + (svgX / SVG_W) * rect.width, y: rect.top + (svgY / SVG_H) * rect.height };
  }

  // Zooming in (open): stars burst outward from the circle. Zooming out
  // (close): the same paths played in reverse, sweeping back in and
  // vanishing right on the circle. Both ends of every particle's path are
  // pinned to STORY_ORB, so the swirl always reads as coming from — or
  // returning to — that exact dot, whichever direction it's playing.
  function toggleStory(open) {
    if (open) setPortalOrigin(svgPointToScreen(STORY_ORB.x, STORY_ORB.y));
    setPortalDir(open ? "in" : "out");
    setPortalFx(true);
    setTimeout(() => setPortalFx(false), 900);
    setStoryOpen(open);
  }

  function portalClip(radiusPct) {
    const o = portalOrigin || { x: window.innerWidth / 2, y: 80 };
    return `circle(${radiusPct}% at ${o.x}px ${o.y}px)`;
  }

  const bgStars = useMemo(() => Array.from({ length: 60 }, () => ({
    x: Math.random() * SVG_W, y: Math.random() * 250, r: Math.random() * 1.1 + 0.3, delay: Math.random() * 4
  })), []);

  return (
    <div className="pt-1 pb-24 px-5">
      <div className="font-serif text-h2 font-medium mb-1">Tree of YOU</div>
      <p className="text-bodySm text-textSecondary mb-4 max-w-[46ch]">
        Roots are your Values, branches are your Pillars, stars are the versions of yourself you're
        orienting toward. Tap any of them to trace the connection.
      </p>

      <motion.div
        className="relative rounded-card overflow-hidden border border-borderC"
        style={{ background: "linear-gradient(180deg, #060b08 0%, #0c1611 38%, #101a14 100%)", boxShadow: "inset 0 0 60px -10px rgba(0,0,0,0.6)" }}
        animate={{ scale: storyOpen ? 0.97 : 1, filter: storyOpen ? "blur(1.5px)" : "blur(0px)" }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block w-full h-auto">
          <defs>
            <filter id="tosBlur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            {/* The ground roots visibly disappear into — a symbolic Earth
                rather than a bare line, so "roots" reads as literal, not
                just a UI baseline. Only its topmost arc is ever in frame,
                which is what sells the "curve of a small planet" look. */}
            <radialGradient id="tosEarth" cx="50%" cy="0%" r="85%">
              <stop offset="0%" stopColor="#4a3524" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#241a12" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0a0705" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tosGalaxy" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#C9A24D" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#7c5cbf" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4a8fa0" stopOpacity="0" />
            </radialGradient>
          </defs>

          {bgStars.map((s, i) => (
            <circle
              key={i} cx={s.x} cy={s.y} r={s.r} fill="#EDE6D6"
              style={{ animation: `tosTwinkle 4.5s ease-in-out ${s.delay}s infinite` }}
            />
          ))}

          <ellipse cx={EARTH_CX} cy={EARTH_CY} rx={EARTH_RX} ry={EARTH_RY} fill="url(#tosEarth)" />
          <ellipse cx={EARTH_CX} cy={EARTH_CY} rx={EARTH_RX} ry={EARTH_RY} fill="none" stroke="#6b4a2f" strokeWidth={1.5} opacity={0.4} />

          {/* Root -> branch links */}
          {roots.flatMap(r => r.pillars.map(pn => {
            const b = branches.find(x => x.name === pn);
            if (!b) return null;
            const isMember = active ? active.vals.has(r.name) && active.pils.has(pn) : false;
            return (
              <motion.path
                key={r.name + "-" + pn}
                d={treePath(r.x, b.x, b.y)}
                fill="none" stroke={r.color} strokeWidth={active && isMember ? 3 : 2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: active ? (isMember ? 0.95 : 0.06) : 0.5 }}
                transition={{ pathLength: { duration: 1.1, ease: easeOut }, opacity: { duration: 0.4 } }}
              />
            );
          }))}

          {/* Star cluster links */}
          {branches.map(b => {
            const cluster = starsByPillar[b.name] || [];
            return cluster.map((v, i) => {
              const from = i === 0 ? { x: b.x, y: b.y } : starPositions[cluster[i - 1].id];
              const to = starPositions[v.id];
              const isMember = active ? active.pils.has(b.name) : false;
              return (
                <motion.line
                  key={v.id}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={b.color} strokeWidth={active && isMember ? 1.8 : 1.2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: active ? (isMember ? 0.9 : 0.04) : 0.35 }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                />
              );
            });
          })}

          {/* Roots */}
          {roots.map((r, i) => {
            const isMember = active ? active.vals.has(r.name) : false;
            const baseOpacity = r.planted ? 1 : 0.4;
            return (
              <motion.g
                key={r.name}
                className={`cursor-pointer transition-opacity duration-500 ${opacityClass(isMember)}`}
                style={{ opacity: active ? undefined : baseOpacity }}
                onClick={() => toggle("value", r.name)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: active ? (isMember ? 1 : 0.12) : baseOpacity, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.5, ease: easeOut }}
              >
                <line x1={r.x} y1={ROOT_Y - 4} x2={r.x} y2={ROOT_Y + 42} stroke={r.color} strokeWidth={2.5} opacity={0.5} filter="url(#tosBlur)" />
                <NodeGlow x={r.x} y={ROOT_Y} r={13} color={r.color} active={active && isMember} />
                <NodeCore x={r.x} y={ROOT_Y} r={r.planted ? 6.5 : 5} color={r.color} />
                {isMember && (
                  <motion.text
                    initial={{ opacity: 0 }} animate={{ opacity: 0.95 }}
                    x={r.x} y={ROOT_Y + 26} textAnchor="middle" fontSize="12" fill="#EDE6D6" fontFamily="DM Sans, sans-serif"
                  >
                    {r.name}
                  </motion.text>
                )}
              </motion.g>
            );
          })}

          {/* Branches */}
          {branches.map((b, i) => {
            const isMember = active ? active.pils.has(b.name) : false;
            const Icon = PILLAR_ICONS[b.name];
            return (
              <motion.g
                key={b.name}
                className={`cursor-pointer transition-opacity duration-500 ${opacityClass(isMember)}`}
                onClick={() => toggle("pillar", b.name)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: active ? (isMember ? 1 : 0.12) : 1, scale: 1 }}
                transition={{ delay: 0.4 + 0.08 * i, duration: 0.6, ease: easeOut }}
              >
                <NodeGlow x={b.x} y={b.y} r={22} color={b.color} active={active && isMember} />
                <NodeCore x={b.x} y={b.y} r={12} color={b.color} />
                {Icon && (
                  <foreignObject x={b.x - 8} y={b.y - 8} width="16" height="16" className="pointer-events-none">
                    <Icon size={16} color="white" strokeWidth={1.75} />
                  </foreignObject>
                )}
                <text x={b.x} y={b.y + 34} textAnchor="middle" fontSize="13" fill="#EDE6D6" fontFamily="DM Sans, sans-serif" opacity={0.9}>
                  {b.name}
                </text>
              </motion.g>
            );
          })}

          {/* Stars + per-branch "add a vision" affordance */}
          {branches.map(b => {
            const cluster = starsByPillar[b.name] || [];
            const addPos = cluster.length > 0
              ? { x: b.x + starOffset(cluster.length, cluster.length + 1).dx, y: b.y + starOffset(cluster.length, cluster.length + 1).dy }
              : { x: b.x, y: b.y - 110 };
            return (
              <g key={b.name + "-stars"}>
                {cluster.map((v, i) => {
                  const pos = starPositions[v.id];
                  const isMember = active ? active.stars.has(v.id) : false;
                  return (
                    <motion.g
                      key={v.id}
                      className={`cursor-pointer transition-opacity duration-500 ${opacityClass(isMember)}`}
                      onClick={() => toggle("star", v.id)}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: active ? (isMember ? 1 : 0.12) : 1, scale: 1 }}
                      transition={{ delay: 0.9 + i * 0.12, duration: 0.5, ease: easeOut }}
                    >
                      <NodeGlow x={pos.x} y={pos.y} r={9} color="#EDE6D6" active={active && isMember} />
                      <NodeCore x={pos.x} y={pos.y} r={4} color="#EDE6D6" />
                      {isMember && (
                        <motion.text
                          initial={{ opacity: 0 }} animate={{ opacity: 0.95 }}
                          x={pos.x + 12} y={pos.y + 4} fontSize="12" fill="#EDE6D6" fontFamily="DM Sans, sans-serif"
                        >
                          {v.title}
                        </motion.text>
                      )}
                    </motion.g>
                  );
                })}

                <g
                  className="cursor-pointer transition-opacity duration-300 hover:opacity-90"
                  style={{ opacity: active ? 0.1 : 0.4 }}
                  onClick={() => setAddingFor(b.name)}
                >
                  <circle cx={addPos.x} cy={addPos.y} r={11} fill="none" stroke="#EDE6D6" strokeDasharray="2.5 3" strokeWidth={1.5} />
                  <foreignObject x={addPos.x - 6} y={addPos.y - 6} width="12" height="12" className="pointer-events-none">
                    <Plus size={12} color="#EDE6D6" strokeWidth={2} />
                  </foreignObject>
                </g>
              </g>
            );
          })}

          {/* Floating above everything else in the sky — a small galaxy
              that opens the Story of You cosmos when tapped, instead of
              that being a separate section you had to know to scroll to. */}
          <motion.g
            className="cursor-pointer"
            onClick={() => toggleStory(true)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6, ease: easeOut }}
          >
            <circle cx={STORY_ORB.x} cy={STORY_ORB.y} r={44} fill="url(#tosGalaxy)" opacity={0.5} filter="url(#tosBlur)" />
            <circle
              cx={STORY_ORB.x} cy={STORY_ORB.y} r={30} fill="none" stroke="#EDE6D6" strokeOpacity={0.3} strokeDasharray="1 5"
              style={{ transformOrigin: `${STORY_ORB.x}px ${STORY_ORB.y}px`, animation: "tosSpin 24s linear infinite" }}
            />
            <circle cx={STORY_ORB.x} cy={STORY_ORB.y} r={16} fill="url(#tosGalaxy)" />
            <text
              x={STORY_ORB.x} y={STORY_ORB.y + 46} textAnchor="middle" fontSize="10.5" fill="#EDE6D6" opacity={0.85}
              fontFamily="DM Sans, sans-serif" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              The Story of You
            </text>
          </motion.g>
        </svg>

        <style>{`
          @keyframes tosTwinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.55; } }
          @keyframes tosSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </motion.div>

      <AnimatePresence>
        {storyOpen && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: "radial-gradient(120% 90% at 50% 10%, #171233 0%, #0b0a1c 45%, #050510 100%)" }}
            initial={{ clipPath: portalClip(1) }}
            animate={{ clipPath: portalClip(150) }}
            exit={{ clipPath: portalClip(1) }}
            transition={{ duration: 0.85, ease: easeOut }}
          >
            <StoryOfYou onClose={() => toggleStory(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* A gentle portal — small stars drawing inward along a spiral to the
          exact click point (real pixel coordinates via
          getBoundingClientRect, not a guessed percentage), layered above
          the clip-path reveal. No fire, no color wheel — just the same
          stars the rest of this view is made of, converging. */}
      <AnimatePresence>
        {portalFx && <PortalSwirl origin={portalOrigin} direction={portalDir} />}
      </AnimatePresence>

      <div className="flex gap-3 mt-3 text-caption text-textMuted flex-wrap">
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--gold)" }} />Pillars</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "#9a8870" }} />Values</span>
        <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block bg-cream" />Visions</span>
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
              Tap a root, a branch, or a star to trace the connection.
            </div>
          )}

          {selected?.type === "value" && (() => {
            const r = roots.find(x => x.name === selected.key);
            const tier = getTier(Math.min(99, r.rating));
            const stage = getPrestigeStage(r.prestige);
            const req = prestigeRequirement(r.prestige);
            return (
              <>
                <div className="text-caption uppercase tracking-wide mb-1" style={{ color: r.color }}>Value · root</div>
                <div className="font-serif text-h3 text-cream mb-1">{r.name}</div>
                <div className="text-bodySm text-[#B8B3A9]">
                  {r.planted ? `${stage.name} · ${tier.name} · ${r.rating}/${req}` : "Not yet planted — add it in Values."}
                </div>
                <Link to="/you" className="inline-block mt-2 text-bodySm underline" style={{ color: "var(--gold)" }}>Open in Values →</Link>
              </>
            );
          })()}

          {selected?.type === "pillar" && (() => {
            const b = branches.find(x => x.name === selected.key);
            return (
              <>
                <div className="text-caption uppercase tracking-wide mb-1" style={{ color: b.color }}>Pillar · branch</div>
                <div className="font-serif text-h3 text-cream mb-1">{b.name}</div>
                <div className="text-bodySm text-[#B8B3A9]">{b.xp} XP · fed by {roots.filter(r => r.pillars.includes(b.name)).length} values</div>
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

      {identityVisions.length === 0 && (
        <div className="text-caption text-textMuted mt-3">
          No visions in the sky yet — tap the <Plus size={11} className="inline -mt-0.5" strokeWidth={2} /> above any branch, or add one from the Identity tab.
        </div>
      )}

      <IdentityVisionModal open={Boolean(addingFor)} initialCategory={addingFor} onClose={() => setAddingFor(null)} />
      <IdentityVisionModal open={editOpen} vision={editingVision} onClose={() => setEditOpen(false)} />
    </div>
  );
}
