import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Leaf, Snowflake, Sparkles, Sun, X, Flower2 } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { latestReview, niceRange, useHemisphere, SEASON_SKY } from "../../lib/seasons";
import { seasonStats } from "../../lib/seasonStats";
import { easeOut } from "../ui/motion";
import MoodFace from "../home/MoodFace";
import DrawsFrom from "../ui/DrawsFrom";

const ICON = { Summer: Sun, Autumn: Leaf, Winter: Snowflake, Spring: Flower2 };

// The Season review (Cassidy, Oct 28: "like how Spotify does its year
// recap... it becomes an experience"). A story to tap through: the season,
// what you lived, how you felt and grew, then YOU's reading of it, saved
// to your seasons. The equinoxes look back six months, with light and shadow.
export default function SeasonReview() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const data = useAppData();
  const { readSeason, seasons } = data;
  const { hemisphere, chosen, setHemisphere } = useHemisphere();
  const review = latestReview(hemisphere);
  const stats = useMemo(() => seasonStats(data, review.from, review.to), [data, review.from, review.to]);
  const saved = seasons.find(s => s.based_on?.turning === review.turning) || null;
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState(saved);
  const [message, setMessage] = useState("");
  const sky = SEASON_SKY[review.kind === "equinox" ? "Equinox" : review.ending];
  const Icon = review.kind === "equinox" ? Sparkles : ICON[review.ending] || Sparkles;

  async function read() {
    setReading(true);
    setMessage("");
    try {
      const res = await readSeason({ from: review.from, to: review.to, kind: review.kind, turning: review.turning, title: review.title });
      if (res?.empty) setMessage(res.message);
      else setResult(res.season);
    } catch (e) {
      if (e?.code !== "consent_declined") setMessage(e?.friendly || "Your season couldn't be read just now. Try again later.");
    }
    setReading(false);
  }

  const slides = [
    // 1. The season itself
    <div key="intro" className="text-center">
      <Icon size={44} strokeWidth={1.25} className="mx-auto mb-4 opacity-90" />
      <div className="text-label uppercase tracking-[0.2em] opacity-80 mb-2">{niceRange(review.from, review.to)}</div>
      <h1 className="font-serif text-[40px] leading-tight m-0">{review.title}</h1>
      <p className="text-body opacity-85 mt-3 max-w-[30ch] mx-auto">{review.subtitle}</p>
      <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-black/20 p-1 text-caption" role="radiogroup" aria-label="Your half of the world">
        {[["south", "Southern"], ["north", "Northern"]].map(([h, label]) => (
          <button
            key={h}
            type="button"
            role="radio"
            aria-checked={hemisphere === h}
            onClick={() => setHemisphere(h).catch(() => {})}
            className={`px-3 min-h-[32px] rounded-full ${hemisphere === h ? "bg-white/90 text-[#2A1C12] font-medium" : "opacity-80"}`}
          >
            {label} hemisphere
          </button>
        ))}
      </div>
      {!chosen && <div className="text-caption opacity-75 mt-2">Guessed from your time zone. Tap to change.</div>}
    </div>,

    // 2. What you lived
    <div key="lived">
      <div className="text-label uppercase tracking-[0.2em] opacity-80 mb-3">What you lived</div>
      <Big n={stats.entries} label={stats.entries === 1 ? "YOUrnal entry" : "YOUrnal entries"} sub={stats.words ? `${stats.words.toLocaleString()} words` : null} />
      <Big n={stats.moments} label={stats.moments === 1 ? "moment kept" : "moments kept"} sub={stats.momentTitles.join(" · ") || null} />
      <Big n={stats.habitDays} label="days you tended a habit" sub={stats.bestTotal ? `including ${stats.bestTotal.text}` : null} />
      {stats.focusMinutes > 0 && <Big n={Math.round(stats.focusMinutes / 60 * 10) / 10} label="hours of focus" />}
    </div>,

    // 3. How you felt and grew
    <div key="felt">
      <div className="text-label uppercase tracking-[0.2em] opacity-80 mb-3">How you felt, and what grew</div>
      {stats.moodAvg != null ? (
        <div className="flex items-center gap-4 mb-5">
          <MoodFace score={stats.moodAvg} size={72} />
          <div>
            <div className="font-serif text-h1 leading-none">{stats.moodWord}</div>
            <div className="text-caption opacity-80 mt-1">on average, across {stats.moodCount} check-ins</div>
          </div>
        </div>
      ) : (
        <p className="text-bodySm opacity-80 mb-5">No mood check-ins this season.</p>
      )}
      <Big n={stats.xp} label="XP grown" sub={stats.topPillar ? `most of it in ${stats.topPillar.name}` : null} />
      {stats.completed.length > 0 && <Big n={stats.completed.length} label={stats.completed.length === 1 ? "pursuit completed" : "pursuits completed"} sub={stats.completed.slice(0, 3).join(" · ")} />}
      {stats.topTags.length > 0 && <div className="text-bodySm opacity-85 mt-2">You wrote most about {stats.topTags.map(t => `#${t}`).join(", ")}.</div>}
    </div>,

    // 4. YOU's reading
    <div key="reading">
      <div className="text-label uppercase tracking-[0.2em] opacity-80 mb-3">YOU's reading</div>
      {result ? (
        <div>
          <div className="font-serif text-[34px] leading-tight">{result.name}</div>
          {result.blurb && <p className="text-body opacity-90 mt-2">{result.blurb}</p>}
          {result.signals?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {result.signals.map(sig => <span key={sig} className="text-caption bg-black/25 px-2 py-0.5 rounded-full">{sig}</span>)}
            </div>
          )}
          <Part label="What grew" text={result.based_on?.review?.grew} />
          <Part label="Light" text={result.based_on?.review?.light} />
          <Part label="Shadow" text={result.based_on?.review?.shadow} />
          <Part label="Keep in balance" text={result.based_on?.review?.balance} />
          <Part label="Carry forward" text={result.based_on?.review?.carry} />
          <div className="text-caption opacity-80 mt-4">Saved to your seasons.</div>
        </div>
      ) : (
        <div>
          <p className="text-body opacity-90">
            {review.kind === "equinox"
              ? "Let YOU read these six months: what brought light, what asked for care, and what to keep in balance."
              : "Let YOU read this season: its name, what grew, and something to carry forward."}
          </p>
          <button
            type="button"
            onClick={read}
            disabled={reading}
            className="mt-5 inline-flex items-center gap-2 min-h-[48px] px-6 rounded-full bg-white/90 text-[#2A1C12] font-medium disabled:opacity-60"
          >
            <Sparkles size={17} strokeWidth={1.75} /> {reading ? "Listening to your season…" : "Read my season"}
          </button>
          {message && <p className="text-bodySm opacity-90 mt-3">{message}</p>}
          <div className="mt-4 opacity-80 [&_*]:!text-inherit">
            <DrawsFrom uses={["harvests", "journal", "moments", "values", "mood"]} />
          </div>
        </div>
      )}
    </div>
  ];

  const last = step === slides.length - 1;
  const go = d => setStep(n => Math.max(0, Math.min(slides.length - 1, n + d)));

  return (
    <div className="fixed inset-0 z-50 text-[#FFF8EE] font-sans flex justify-center" style={{ background: sky }}>
      <div className="w-full max-w-[520px] flex flex-col px-6" style={{ paddingTop: "max(env(safe-area-inset-top), 14px)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
        {/* progress, like a story */}
        <div className="flex gap-1.5 mb-3" aria-hidden="true">
          {slides.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-white/90" : "bg-white/25"}`} />
          ))}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate(-1)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 flex items-center overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="w-full"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
              {slides[step]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => go(-1)} aria-label="Back" className="w-12 min-h-[50px] rounded-full bg-black/20 flex items-center justify-center">
              <ArrowLeft size={18} strokeWidth={1.75} />
            </button>
          )}
          {last ? (
            <button type="button" onClick={() => navigate("/")} className="flex-1 min-h-[50px] rounded-full bg-black/25 font-medium">Back to YOU</button>
          ) : (
            <button type="button" onClick={() => go(1)} className="flex-1 min-h-[50px] rounded-full bg-white/90 text-[#2A1C12] font-medium inline-flex items-center justify-center gap-2">
              {step === 0 ? "Begin" : "Next"} <ArrowRight size={17} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Big({ n, label, sub }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-[44px] leading-none">{n || 0}</span>
        <span className="text-body opacity-90">{label}</span>
      </div>
      {sub && <div className="text-caption opacity-75 mt-0.5 line-clamp-2">{sub}</div>}
    </div>
  );
}

function Part({ label, text }) {
  if (!text) return null;
  return (
    <div className="mt-4">
      <div className="text-label uppercase tracking-[0.15em] opacity-75 mb-0.5">{label}</div>
      <div className="text-body opacity-95">{text}</div>
    </div>
  );
}
