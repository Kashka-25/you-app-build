import { motion, useReducedMotion } from "framer-motion";
import { riseIn } from "../ui/motion";

// A course's opening: an arched artwork (a doorway, a window, a held
// breath) with its tagline, then the name and a line about it. Built from
// the theme's own colours so it sits right in light and dark mode.
export default function CourseHero({ arcanum, eyebrow, children }) {
  const reduce = useReducedMotion();
  const Icon = arcanum.icon;
  const lines = arcanum.tagline.split(/(?<=\.)\s+/);
  return (
    <motion.div {...riseIn} className="mb-6">
      <div
        className="relative h-[250px] rounded-t-[999px] rounded-b-[28px] overflow-hidden shadow-card mb-6"
        style={{ background: "linear-gradient(150deg, var(--sage) 0%, var(--forest-accent) 70%, var(--forest) 100%)" }}
      >
        {/* Light through the doorway. */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 32%)" }} />
        {/* Positioned by a plain wrapper: the breathing scale would otherwise
            replace the centring transform. */}
        <div aria-hidden="true" className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-[170px] h-[170px] rounded-full border border-white/60"
            animate={reduce ? undefined : { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div aria-hidden="true" className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-full border border-white/30" />
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-white/90">
          <Icon size={38} strokeWidth={1.25} />
        </div>
        <div className="absolute left-6 bottom-5 font-serif text-[22px] leading-tight text-white drop-shadow-sm">
          {lines.map(l => <div key={l}>{l}</div>)}
        </div>
      </div>

      {eyebrow && <div className="text-label uppercase text-gold tracking-[0.16em] mb-1.5">{eyebrow}</div>}
      <h1 className="font-serif text-[34px] leading-[1.05] font-medium text-textPrimary m-0">{arcanum.name}</h1>
      {arcanum.lead && <p className="text-body text-textSecondary mt-2.5 mb-0 max-w-[460px]">{arcanum.lead}</p>}
      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  );
}
