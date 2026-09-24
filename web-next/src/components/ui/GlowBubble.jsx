import { motion } from "framer-motion";

// The floating 3D "bubble" — layered glow (outer soft halo + inner glow)
// behind a shaded sphere with an inset highlight and a floor shadow to sell
// depth, plus a slow continuous float. Shared by every "this is a moment,
// not a widget" spot: Bring Me Back's opener, Home's compass CTA, and Bring
// Me Back's closing card — one recipe so they can't visually drift apart.
// Sized in px via `size` so it scales cleanly from a small inline icon up
// to a full hero moment. `color` is optional — pass a hex/CSS color (e.g.
// a pillar color) to recolor the sphere and its glow for that one bubble;
// omit it for the default forest/sage/gold recipe every other bubble uses.
// Pass either `icon` (a lucide component) or `children` (e.g. avatar
// initials) — icon wins if both are given.
export function GlowBubble({ icon: Icon, children, size = 96, iconSize, className = "", animate = true, color }) {
  const resolvedIconSize = iconSize || Math.round(size * 0.32);
  const floatDistance = Math.max(3, Math.round(size * 0.08));

  const haloGradient = color
    ? `radial-gradient(circle, ${color} 0%, transparent 65%)`
    : "radial-gradient(circle, var(--gold) 0%, transparent 65%)";
  const glowGradient = color
    ? `radial-gradient(circle, ${color} 0%, transparent 70%)`
    : "radial-gradient(circle, var(--sage) 0%, transparent 70%)";
  const sphereGradient = color
    ? `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${color} 55%, white) 0%, color-mix(in srgb, ${color} 80%, black) 65%)`
    : "radial-gradient(circle at 32% 28%, var(--sage), var(--forest) 65%)";

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 6, scale: 0.92 } : false}
      animate={
        animate
          ? { opacity: 1, y: [0, -floatDistance, 0], scale: 1 }
          : { opacity: 1 }
      }
      transition={
        animate
          ? {
              opacity: { duration: 0.6 },
              scale: { duration: 0.6 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
            }
          : undefined
      }
      className={`relative flex-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute rounded-full blur-2xl opacity-60" style={{ inset: -size * 0.3, background: haloGradient }} />
      <div className="absolute rounded-full blur-md opacity-90" style={{ inset: -size * 0.08, background: glowGradient }} />
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: sphereGradient,
          boxShadow: "0 18px 28px -10px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)"
        }}
      >
        {Icon ? <Icon size={resolvedIconSize} strokeWidth={1.5} className="text-cream" /> : (
          <span className="font-serif text-cream" style={{ fontSize: resolvedIconSize }}>{children}</span>
        )}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/15 blur-md"
        style={{ bottom: -size * 0.08, width: size * 0.58, height: size * 0.12 }}
      />
    </motion.div>
  );
}
