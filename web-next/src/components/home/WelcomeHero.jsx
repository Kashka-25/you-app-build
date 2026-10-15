import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { riseIn } from "../ui/motion";

// The first thing on Home: a warm welcome back into the Seeker's own space,
// over the sunrise lake by day and the night valley in the Cosmos, with one
// clear way onward. The scrim keeps the words readable over any part of
// the image.
export default function WelcomeHero({ greeting, subtitle, subtitleIsCompass, mood, cta }) {
  return (
    <motion.section {...riseIn} aria-labelledby="home-welcome" className="relative rounded-card overflow-hidden shadow-card">
      {/* Nature: the sunrise over the lake, words in dark ink on a parchment
          fade. Cosmos: the night valley, words in cream over a shade. */}
      <img
        src="/images/home/welcome-day.webp"
        alt=""
        width="705"
        height="373"
        decoding="async"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[center_20%] dark:hidden"
      />
      <img
        src="/images/home-dark.jpg"
        alt=""
        width="853"
        height="1848"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-[center_38%] hidden dark:block"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/75 via-45% to-transparent to-75% dark:hidden" />
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-black/45 via-transparent to-transparent" />

      <div className="relative flex flex-col justify-end min-h-[300px] p-5 lg:min-h-[360px] lg:p-10">
        <h1 id="home-welcome" className="font-serif text-hero lg:text-[44px] lg:leading-tight text-textPrimary dark:text-cream m-0 max-w-[15ch] lg:max-w-none">{greeting}</h1>
        <p
          className={`m-0 mt-1.5 max-w-[30ch] text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_90%,transparent)] ${
            subtitleIsCompass ? "font-serif italic text-[17px] leading-snug" : "text-bodySm"
          }`}
        >
          {subtitle}
        </p>

        {mood && (
          <div className="inline-flex self-start items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/70 border border-borderC dark:bg-black/30 dark:border-white/10">
            <mood.Icon size={14} strokeWidth={1.75} className="text-textPrimary dark:text-cream" />
            <span className="text-bodySm font-medium text-textPrimary dark:text-cream">Arriving {mood.label.toLowerCase()} today</span>
          </div>
        )}

        <Link
          to={cta.to}
          className="mt-4 self-start inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest active:scale-[0.98] transition"
        >
          {cta.label}
          <ArrowRight size={17} strokeWidth={2} />
        </Link>
      </div>
    </motion.section>
  );
}
