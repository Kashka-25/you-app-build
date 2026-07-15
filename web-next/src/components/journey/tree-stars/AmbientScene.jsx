import { motion } from "framer-motion";
import { TreeDeciduous, Sun, Cloud, Moon } from "lucide-react";
import { riseIn } from "../../ui/motion";

// Time-of-day is independent of the light/dark mode toggle — someone in
// light mode at night still sees a night sky here, and vice versa. Uses the
// same hour boundary as Home's "Good morning/afternoon/evening" greeting
// (evening starts at 18:00) rather than an invented separate cutoff.
function isDaytime() {
  return new Date().getHours() < 18;
}

// Fixed positions, not randomized per render — predictable layout is a
// standing rule (BUILD-BACKLOG.md). No twinkle/motion on these either;
// nothing here moves without the user tapping something.
const STARS = [
  { top: "12%", left: "15%", size: 3 },
  { top: "22%", left: "32%", size: 2 },
  { top: "10%", left: "50%", size: 2 },
  { top: "30%", left: "68%", size: 3 },
  { top: "16%", left: "82%", size: 2 },
  { top: "40%", left: "22%", size: 2 },
  { top: "45%", left: "58%", size: 3 },
  { top: "35%", left: "88%", size: 2 },
  { top: "8%", left: "68%", size: 2 },
  { top: "48%", left: "40%", size: 2 }
];

const CLOUDS = [
  { top: "18%", left: "12%", size: 46, opacity: 0.9 },
  { top: "30%", left: "60%", size: 58, opacity: 0.8 },
  { top: "14%", left: "72%", size: 38, opacity: 0.7 }
];

export default function AmbientScene({ onTapTree, onTapSky }) {
  const day = isDaytime();

  return (
    <motion.div {...riseIn} className="pt-1 pb-24 px-5">
      <div className="rounded-card overflow-hidden shadow-card h-[440px] flex flex-col">
        <button
          onClick={onTapSky}
          aria-label="Explore your constellations"
          className={`relative flex-1 min-h-0 ${
            day
              ? "bg-gradient-to-b from-accentBlue to-[color-mix(in_srgb,var(--accent-blue)_35%,var(--bg))]"
              : "bg-gradient-to-b from-[#0B1220] to-forest"
          }`}
        >
          {day ? (
            <>
              <Sun size={40} strokeWidth={1.5} className="absolute top-5 right-8 text-cream" />
              {CLOUDS.map((c, i) => (
                <Cloud
                  key={i}
                  size={c.size}
                  strokeWidth={1.5}
                  style={{ position: "absolute", top: c.top, left: c.left, opacity: c.opacity }}
                  className="text-cream"
                />
              ))}
            </>
          ) : (
            <>
              <Moon size={30} strokeWidth={1.5} className="absolute top-5 right-8 text-cream" />
              {STARS.map((s, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size }}
                  className="rounded-full bg-cream"
                />
              ))}
            </>
          )}
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center">
            <span className="text-caption text-cream bg-black/45 px-2.5 py-1 rounded-full">
              Tap the sky — your constellations
            </span>
          </div>
        </button>

        <button
          onClick={onTapTree}
          aria-label="Explore your Tree of YOU"
          className={`relative flex-1 min-h-0 flex items-end justify-center pb-3 ${
            day ? "bg-gradient-to-b from-sage to-surface1" : "bg-gradient-to-b from-forest to-surface1"
          }`}
        >
          <TreeDeciduous size={128} strokeWidth={1} className="text-forestAccent" />
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center">
            <span className="text-caption text-cream bg-black/45 px-2.5 py-1 rounded-full">
              Tap the tree — your Tree of YOU
            </span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
