import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { riseIn } from "../ui/motion";
import { CreditChip } from "../showcase/FeaturedWords";
import { backgroundClass } from "../../lib/showcase";

// The first thing on Home: a warm welcome back into the Seeker's own space,
// over the sunrise lake, with one clear way onward. The lake stays in its
// daylight colours in the Cosmos too, a bright window against the night
// (Cassidy, Oct 18), so its words keep their dark ink in both modes. The scrim keeps the words readable over any part of
// the image. When an artist's piece is featured (Showcase), it takes the
// place of the landscape, with a credit chip in the corner.
export default function WelcomeHero({ greeting, subtitle, subtitleIsCompass, mood, cta, art, artMode = "full", onOpenArt }) {
  const showArt = Boolean(art?.imageUrl) && artMode !== "off";
  // Over the daylight lake the words are always bark ink; over an artist's
  // piece they follow the mode, as before.
  const ink = showArt ? "text-textPrimary dark:text-cream" : "text-[#2B1F17]";
  const inkSoft = showArt ? "text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_90%,transparent)]" : "text-[#6A5646]";
  return (
    <motion.section {...riseIn} aria-labelledby="home-welcome" className="relative rounded-card overflow-hidden shadow-card">
      {/* The sunrise over the lake, words in dark ink on a parchment fade,
          by day and by night. */}
      {showArt ? (
        <img
          src={art.imageUrl}
          alt=""
          width={art.image_width || undefined}
          height={art.image_height || undefined}
          decoding="async"
          draggable="false"
          className={`absolute inset-0 w-full h-full object-cover ${backgroundClass(artMode)}`}
        />
      ) : (
      <img
        src="/images/home/welcome-day.webp"
        alt=""
        width="705"
        height="373"
        decoding="async"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
      />
      )}
      {showArt ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/75 via-45% to-transparent to-75% dark:hidden" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/75 via-45% to-transparent to-75%" />
      )}

      {showArt && <CreditChip work={art} onOpen={onOpenArt} />}

      <div className="relative flex flex-col justify-end min-h-[300px] p-5 lg:min-h-[360px] lg:p-10">
        <h1 id="home-welcome" className={`font-serif text-hero lg:text-[44px] lg:leading-tight ${ink} m-0 max-w-[15ch] lg:max-w-none`}>{greeting}</h1>
        <p
          className={`m-0 mt-1.5 max-w-[30ch] ${inkSoft} ${
            subtitleIsCompass ? "font-serif italic text-[17px] leading-snug" : "text-bodySm"
          }`}
        >
          {subtitle}
        </p>

        {mood && (
          <div className={`inline-flex self-start items-center gap-2 mt-3 px-3 py-1.5 rounded-full ${showArt ? "bg-white/70 border border-borderC dark:bg-black/30 dark:border-white/10" : "bg-white/70 border border-[rgba(58,38,24,0.11)]"}`}>
            <mood.Icon size={14} strokeWidth={1.75} className={ink} />
            <span className={`text-bodySm font-medium ${ink}`}>Arriving {mood.label.toLowerCase()} today</span>
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
