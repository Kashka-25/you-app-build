import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Feather } from "lucide-react";
import { easeOut, riseIn } from "../ui/motion";
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
export default function WelcomeHero({ greeting, message, mood, cta, art, words, artMode = "full", onOpenArt }) {
  const artOn = artMode !== "off";
  const background = words
    ? (artOn && words.imageUrl ? words : null)
    : (artOn && art?.imageUrl ? art : null);
  const ink = "text-textPrimary dark:text-cream";
  const inkSoft = "text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_90%,transparent)]";
  // On the painted sunrise the greeting sits in the sky, under the star and
  // above the sun (Cassidy, Nov 3); the day's message stays at the bottom.
  const sunrise = !background && !words;
  // A soft, low-opacity bubble behind the words so they read clearly over
  // the painting (Cassidy, Nov 3).
  const bubble = "rounded-[22px] bg-[#FBF7F0]/55 dark:bg-[#0B0B1F]/40 backdrop-blur-[3px] shadow-[0_2px_18px_rgba(74,58,18,0.08)]";
  const heading = (
    <h1 id="home-welcome" className={`font-serif text-hero text-[clamp(23px,7.2vw,28px)] lg:text-[44px] lg:leading-tight ${ink} m-0 text-center`}>{greeting}</h1>
  );
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

      <div className={`relative flex flex-col p-5 lg:p-10 ${words ? "justify-between gap-5 min-h-[420px] lg:min-h-[440px]" : sunrise ? "justify-between gap-6 min-h-[300px] lg:min-h-[360px]" : "justify-end min-h-[300px] lg:min-h-[360px]"}`}>
        {words && <FeaturedPiece work={words} ink={ink} inkSoft={inkSoft} onOpen={onOpenArt} />}
        {sunrise && <div className="pt-[14%] lg:pt-[7%] flex justify-center"><div className={`${bubble} px-5 py-1.5`}>{heading}</div></div>}

        <div className={`flex flex-col items-center text-center ${sunrise ? `${bubble} self-center px-5 py-3` : ""}`}>
          {!sunrise && heading}
          {/* A personal message for the day (lib/dailyMessage.js). */}
          {message && (
            <p className={`m-0 mt-1.5 mx-auto max-w-[34ch] font-serif italic text-[17px] leading-snug ${inkSoft}`}>
              {message.text}
              {message.by && <span className="block not-italic font-sans text-caption mt-1 opacity-80">{message.by}</span>}
            </p>
          )}

          {/* Today's mood face; tap it to update (DailyCheckIn.jsx). */}
          <MoodBadge ink={ink} fallback={mood} />

          {cta && (
            <Link
              to={cta.to}
              className="mt-4 self-center inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest active:scale-[0.98] transition"
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
// solid, the sheet between them a see-through wash. It's drawn as a border
// image sized to the painting's own proportions, so at rest it looks just as
// painted; only the sheet grows when a long piece is unrolled. A piece shows
// its title and three lines, ending in "…" if there's more: tap the words to
// unroll it, tap again to roll it back. Who it's by is written at the foot,
// with "read and support" opening it in full.
//
// A piece shared from YOUrigin with its own image can ask for no scroll
// (words_scroll false): then the words sit straight on the image, on a soft
// glow of parchment (midnight in the Cosmos) that keeps them readable.
const SCROLL = {
  borderStyle: "solid",
  borderWidth: "38px 33px 34px 28px",
  borderImage: "url(/images/home/featured-scroll.webp) 93 81 83 69 fill / 38px 33px 34px 28px stretch"
};

function FeaturedPiece({ work, ink, inkSoft, onOpen }) {
  const name = work.artist?.display_name || "An artist";
  const offered = creditLine("", work.credits);
  const glow = "[text-shadow:0_0_10px_rgba(251,247,240,0.95),0_0_2px_rgba(251,247,240,0.9)] dark:[text-shadow:0_0_10px_rgba(11,11,31,0.95),0_0_2px_rgba(11,11,31,0.9)]";
  const reduce = useReducedMotion();
  const body = useRef(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const onScroll = !(work.imageUrl && work.words_scroll === false);

  // Is there more than three lines' worth? (Checked while rolled up.)
  useLayoutEffect(() => {
    const measure = () => {
      const el = body.current;
      if (el && !open) setMore(el.scrollHeight > el.clientHeight + 2);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [work.body, open]);

  return (
    <motion.div
      layout={!reduce}
      transition={{ duration: 0.35, ease: easeOut }}
      className={`relative self-center text-center ${onScroll ? "w-[calc(100%+1rem)] -mx-2 max-w-[26rem] drop-shadow-[0_6px_14px_rgba(74,58,18,0.2)]" : "w-full max-w-[24rem] px-6 py-5"}`}
      style={onScroll ? { padding: SCROLL.borderWidth } : undefined}
    >
      {onScroll ? (
        // The scroll itself, a little softer in the Cosmos.
        <span aria-hidden="true" style={SCROLL} className="absolute inset-0 dark:[filter:brightness(0.78)_saturate(0.9)]" />
      ) : (
        // No scroll: a soft glow behind the words, fading into the image.
        <span aria-hidden="true" className="absolute inset-0 rounded-[50%] bg-[radial-gradient(closest-side,rgba(251,247,240,0.7),rgba(251,247,240,0.4)_55%,transparent)] dark:bg-[radial-gradient(closest-side,rgba(11,11,31,0.7),rgba(11,11,31,0.4)_55%,transparent)]" />
      )}
      <motion.div layout={!reduce ? "position" : false} className="relative px-1 py-1">
        {work.title ? (
          <div className={`flex items-center justify-center gap-1.5 font-serif font-bold text-[17px] lg:text-[19px] leading-tight tracking-[0.05em] uppercase text-[#6A4F16] dark:text-[#F1C76A] ${glow}`}>
            <Feather size={13} strokeWidth={2} aria-hidden="true" /> {work.title}
          </div>
        ) : (
          <Feather size={14} strokeWidth={1.75} className="mx-auto text-[#7A6024] dark:text-gold" aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={() => more && setOpen(o => !o)}
          aria-expanded={more ? open : undefined}
          aria-label={more ? (open ? "Roll the piece back up" : "Unroll the whole piece") : undefined}
          className={`block w-full mt-1.5 ${more ? "cursor-pointer" : "cursor-default"}`}
        >
          <span
            ref={body}
            className={`font-serif italic text-[17px] lg:text-[20px] leading-[1.32] whitespace-pre-line ${open ? "block" : "line-clamp-3"} ${ink} ${glow}`}
          >
            {work.body}
          </span>
        </button>
        <div className={`mt-1.5 text-[12px] lg:text-caption ${inkSoft} ${glow}`}>
          By <span className={`font-semibold ${ink}`}>{name}</span>
          {offered && <> · {offered.replace(/^Offered/, "offered")}</>}
          {" · "}
          <button
            type="button"
            onClick={() => onOpen(work)}
            className="underline underline-offset-2 decoration-[color-mix(in_srgb,var(--gold)_60%,transparent)] hover:text-textPrimary dark:hover:text-cream"
          >
            read and support
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
