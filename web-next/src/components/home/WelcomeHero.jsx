import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Feather } from "lucide-react";
import { riseIn } from "../ui/motion";
import { CreditChip } from "../showcase/FeaturedWords";
import { backgroundClass, creditLine } from "../../lib/showcase";
import { MoodBadge } from "./DailyCheckIn";

// The first thing on Home: a warm welcome back into the Seeker's own space,
// over the sunrise lake (painted for it, Nov 1: calm sky up top for the
// featured words, a light foot for the greeting), with one clear way onward.
// In the Cosmos it becomes dusk, not a negative (Cassidy, Nov 1: the full
// colour flip was "too tacky"): the painting keeps its own colours, dimmed,
// under an indigo night sky that deepens to midnight where the greeting
// sits. The scrim keeps the words readable over any part of the image.
//
// The welcome is also where Showcase is featured (Cassidy, Nov 1): featured
// words are set right over the picture, large and centred, so the piece is
// the first thing the eye lands on; the greeting sits below. The picture is
// the piece's own art if it has an image, or the sunrise if it doesn't.
// With no featured words, a featured artwork takes the landscape's place,
// credited in the corner.
export default function WelcomeHero({ greeting, subtitle, subtitleIsCompass, mood, cta, art, words, artMode = "full", onOpenArt }) {
  const artOn = artMode !== "off";
  const background = words
    ? (artOn && words.imageUrl ? words : null)
    : (artOn && art?.imageUrl ? art : null);
  const ink = "text-textPrimary dark:text-cream";
  const inkSoft = "text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_90%,transparent)]";
  return (
    <motion.section {...riseIn} aria-labelledby="home-welcome" className="relative rounded-card overflow-hidden shadow-card">
      {/* Nature: the sunrise over the lake, words in dark ink on a parchment
          fade. Cosmos: the same lake at dusk, words in cream over midnight. */}
      {background ? (
        <img
          src={background.imageUrl}
          alt=""
          width={background.image_width || undefined}
          height={background.image_height || undefined}
          decoding="async"
          draggable="false"
          className={`absolute inset-0 w-full h-full object-cover ${backgroundClass(artMode)}`}
        />
      ) : (
        <img
          src="/images/home/welcome-sunrise.webp"
          alt=""
          width="1200"
          height="800"
          decoding="async"
          fetchpriority="high"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] dark:[filter:brightness(0.86)_saturate(0.95)]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/75 via-30% to-transparent to-60% dark:hidden" />
      {background ? (
        <>
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-black/60 via-black/30 to-black/5" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </>
      ) : (
        // Dusk: indigo sky laid over the painting (multiplied, so the sun and
        // gold still glow through), then the Cosmos's midnight from below.
        <>
          <div className="absolute inset-0 hidden dark:block mix-blend-multiply bg-[linear-gradient(to_bottom,#4E4A9A_0%,#8678B4_38%,#B48E9E_58%,#5C4A72_100%)]" />
          <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_50%_56%,rgba(255,190,110,0.28),transparent_42%)]" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-t from-[#0B0B1F] via-[#0B0B1F]/75 via-30% to-transparent to-65%" />
        </>
      )}

      {/* An artwork on its own is credited in the corner; featured words carry their credit with them. */}
      {background && !words && <CreditChip work={art} onOpen={onOpenArt} />}

      <div className={`relative flex flex-col p-5 lg:p-10 ${words ? "justify-between gap-5 min-h-[420px] lg:min-h-[440px]" : "justify-end min-h-[300px] lg:min-h-[360px]"}`}>
        {words && <FeaturedPiece work={words} ink={ink} inkSoft={inkSoft} onOpen={onOpenArt} />}

        <div className="flex flex-col">
          <h1 id="home-welcome" className={`font-serif text-hero text-[clamp(23px,7.2vw,28px)] lg:text-[44px] lg:leading-tight ${ink} m-0`}>{greeting}</h1>
          <p
            className={`m-0 mt-1.5 max-w-[30ch] ${inkSoft} ${
              subtitleIsCompass ? "font-serif italic text-[17px] leading-snug" : "text-bodySm"
            }`}
          >
            {subtitle}
          </p>

          {/* Today's mood face; tap it to update (DailyCheckIn.jsx). */}
          <MoodBadge ink={ink} fallback={mood} />

          {cta && (
            <Link
              to={cta.to}
              className="mt-4 self-start inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest active:scale-[0.98] transition"
            >
              {cta.label}
              <ArrowRight size={17} strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
}

// The featured words on a scroll laid over the picture (Cassidy, Nov 1).
// The scroll is painted (images/home/featured-scroll.webp): rolls and sprigs
// solid, the sheet between them a see-through wash. It keeps its painted,
// landscape shape (stretching the sheet to fit long pieces made it a tall
// box), and the words size themselves to fit the sheet instead, with who
// it's by written at the foot of the sheet. Opens in full with a way to
// support the writer.
const SHEET = { top: "19%", bottom: "19.5%", left: "12.5%", right: "13.5%" };

// Shorter pieces are written larger; long ones smaller, so any piece fits.
function wordsSize(text) {
  const n = (text || "").length;
  if (n <= 70) return "text-[19px] lg:text-[23px]";
  if (n <= 120) return "text-[17.5px] lg:text-[21px]";
  if (n <= 170) return "text-[16px] lg:text-[19px]";
  return "text-[13px] lg:text-[16px]";
}

function FeaturedPiece({ work, ink, inkSoft, onOpen }) {
  const name = work.artist?.display_name || "An artist";
  const glow = "[text-shadow:0_0_10px_rgba(251,247,240,0.95),0_0_2px_rgba(251,247,240,0.9)] dark:[text-shadow:0_0_10px_rgba(11,11,31,0.95),0_0_2px_rgba(11,11,31,0.9)]";
  return (
    <button
      type="button"
      onClick={() => onOpen(work)}
      aria-label={`Featured words${work.title ? `: ${work.title}` : ""}, by ${name}. Open to read in full and support them.`}
      className="self-center w-[calc(100%+1rem)] -mx-2 max-w-[26rem] text-center active:scale-[0.99] transition group"
    >
      <span className="relative block w-full drop-shadow-[0_6px_14px_rgba(74,58,18,0.2)]" style={{ aspectRatio: "754 / 540" }}>
        {/* The scroll itself, a little softer in the Cosmos. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-no-repeat dark:[filter:brightness(0.78)_saturate(0.9)]"
          style={{ backgroundImage: "url(/images/home/featured-scroll.webp)", backgroundSize: "100% 100%" }}
        />
        <span className="absolute flex flex-col items-center justify-center overflow-hidden" style={SHEET}>
          {work.title ? (
            <span className={`flex items-center gap-1.5 font-serif text-[13px] lg:text-[15px] tracking-[0.06em] uppercase text-[#7A6024] dark:text-gold ${glow}`}>
              <Feather size={11} strokeWidth={1.75} aria-hidden="true" /> {work.title}
            </span>
          ) : (
            <Feather size={13} strokeWidth={1.75} className={`text-[#7A6024] dark:text-gold`} aria-hidden="true" />
          )}
          <span className={`block font-serif italic leading-[1.3] mt-1 whitespace-pre-line line-clamp-5 ${wordsSize(work.body)} ${ink} ${glow}`}>
            {work.body}
          </span>
          <span className={`block text-[11px] lg:text-caption mt-1.5 ${inkSoft} ${glow} group-hover:underline underline-offset-2`}>
            {creditLine(name, work.credits)} · read and support
          </span>
        </span>
      </span>
    </button>
  );
}
