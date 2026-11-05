import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight, Footprints, Sparkles, Sprout } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickNoticedPatterns, pickNextStep, reflectionQuestions, questionOfTheWeek } from "../../lib/compass";
import { weekStartKey } from "../../lib/week";
import { Guide } from "../ui/Guide";
import AskYOU from "./AskYOU";

const SHOWN_THREADS = 4;

function niceDate(key) {
  return key ? new Date(key + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "";
}

// YOUnderstanding (Cassidy, Nov 2: "I open it and have no idea what its
// purpose is"): the threads YOU has noticed running through your YOUrnal,
// gathered from every entry you've asked to be reflected on, with a
// question to sit with and one small step. Says plainly what it is and how
// it grows. Reads reflections already made; never calls AI itself.
// What YOU notices leads (Cassidy, Nov 4), with Ask YOU, your own question
// answered from everything you've shared, folded just beneath it.
export default function YOUnderstandingView() {
  const { recentInsights, loadRecentInsights, loaded, items } = useAppData();
  const [asked, setAsked] = useState(false);
  const navigate = useNavigate();
  const [allThreads, setAllThreads] = useState(false);
  const [askAbout, setAskAbout] = useState(null); // { text, nonce }

  useEffect(() => {
    if (!loaded || asked) return;
    setAsked(true);
    loadRecentInsights(20).catch(e => console.error("[YOUnderstandingView] load failed:", e));
  }, [loaded, asked, loadRecentInsights]);

  const patterns = pickNoticedPatterns(recentInsights, 30);
  const sortedThreads = [...patterns].sort((a, b) => (b.entryDate || "").localeCompare(a.entryDate || ""));
  const shownThreads = allThreads ? sortedThreads : sortedThreads.slice(0, SHOWN_THREADS);
  // The question to sit with turns each week on its own, and "Another
  // question" steps through the rest (Cassidy, Nov 5; no AI). Each keeps
  // the small step from its own reflection.
  const questions = reflectionQuestions(recentInsights);
  const [shift, setShift] = useState(0);
  const at = questions.length ? (questionOfTheWeek(questions, weekStartKey()) + shift) % questions.length : 0;
  const question = questions[at]?.question || null;
  const step = questions[at]?.step || (recentInsights?.length ? pickNextStep([], items) : null);
  const reflected = recentInsights?.length || 0;

  return (
    <>
      {/* Short, with the how-it-works folded away (Cassidy, Nov 4). */}
      <div className="mb-4">
        <h2 className="font-serif text-h2 text-textPrimary m-0">What YOU notices</h2>
        <p className="text-bodySm text-textSecondary m-0 mt-1">
          The threads running through your YOUrnal{reflected ? `, from the last ${reflected} ${reflected === 1 ? "entry" : "entries"} you had reflected on` : ""}.
        </p>
        <Guide className="mt-0.5">
          Each time you ask for a reflection on a YOUrnal entry, YOU looks for what keeps coming up: feelings, people, places,
          hopes. They gather here, across all your entries, so you can see your patterns over time. It only reads what you've
          allowed in your AI settings.
        </Guide>
      </div>

      {/* Ask YOU, second: right under What YOU notices (Cassidy, Nov 4). */}
      <AskYOU prefill={askAbout} />

      {patterns.length === 0 && !question ? (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textSecondary">
          Nothing gathered yet. Open an entry in your YOUrnal and tap <span className="font-medium text-textPrimary">Get a reflection</span>.
          The threads it notices will start to collect here.
          <Link to="/reflections" className="mt-3 flex items-center gap-1.5 min-h-[40px] text-forestAccent font-medium">
            Go to your YOUrnal <ArrowRight size={15} strokeWidth={1.75} />
          </Link>
        </div>
      ) : (
        <>
          {/* Each thread its own card, newest first, light so the dark gold
              stays Ask YOU's (Cassidy, Nov 4). Tap to open the entry it came
              from, or ask YOU about it. The newest four show; the rest fold. */}
          {patterns.length > 0 && (
            <section aria-labelledby="threads-title" className="mb-4">
              <h3 id="threads-title" className="flex items-center gap-1.5 text-label uppercase text-textSecondary m-0 mb-2">
                <Sparkles size={13} strokeWidth={1.75} className="text-gold" aria-hidden="true" /> Threads in your writing
              </h3>
              <p className="text-caption text-textMuted m-0 -mt-1 mb-2.5">
                Noticed by YOU each time you ask for a reflection on a YOUrnal entry.
              </p>
              <ul className="list-none m-0 p-0 space-y-2.5">
                {shownThreads.map(p => (
                  <li key={p.text} className="rounded-card bg-surface1 shadow-card overflow-hidden" style={{ borderLeft: "3px solid color-mix(in srgb, var(--gold) 70%, transparent)" }}>
                    <button
                      type="button"
                      onClick={() => p.entryId && navigate("/reflections", { state: { openEntry: p.entryId } })}
                      disabled={!p.entryId}
                      className="w-full text-left px-4 pt-3.5 pb-2 flex items-start gap-3"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block font-serif italic text-body text-textPrimary leading-snug">{p.text}</span>
                        {p.entryDate && <span className="block text-caption text-textMuted mt-1.5">From your entry on {niceDate(p.entryDate)}</span>}
                      </span>
                      {p.entryId && <ChevronRight size={18} strokeWidth={1.75} className="flex-none mt-0.5 text-textMuted" aria-hidden="true" />}
                    </button>
                    <div className="px-4 pb-3">
                      <button
                        type="button"
                        onClick={() => setAskAbout({ text: `Help me understand this thread in my life: "${p.text}"`, nonce: Date.now() })}
                        className="inline-flex items-center gap-1.5 min-h-[36px] text-caption font-medium text-gold"
                      >
                        <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" /> Ask YOU about this
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {sortedThreads.length > SHOWN_THREADS && (
                <button
                  type="button"
                  onClick={() => setAllThreads(a => !a)}
                  aria-expanded={allThreads}
                  className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] text-bodySm font-medium text-forestAccent"
                >
                  {allThreads ? "Show fewer" : `See all threads (${sortedThreads.length})`}
                  <ChevronDown size={16} strokeWidth={1.75} className={`transition-transform ${allThreads ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              )}
            </section>
          )}

          {/* The page ends on one calm invitation, set apart from the threads
              (Cassidy, Nov 5): a soft card in the accent colour, centred, with a sprout to
              mark it as something to carry into the day. */}
          {(question || step) && (
            <section
              aria-label="Something to carry"
              className="relative rounded-card p-5 pt-8 mb-4 mt-6 text-center shadow-card"
              style={{
                background: "linear-gradient(180deg, color-mix(in srgb, var(--forest-accent) 14%, var(--surface-1)) 0%, var(--surface-1) 100%)",
                border: "1px solid color-mix(in srgb, var(--forest-accent) 28%, transparent)"
              }}
            >
              <span
                className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-card"
                style={{ background: "color-mix(in srgb, var(--forest-accent) 85%, black)", color: "var(--cream)" }}
                aria-hidden="true"
              >
                <Sprout size={18} strokeWidth={1.75} />
              </span>
              {question && (
                <>
                  <div className="text-label uppercase tracking-[0.14em] text-forestAccent mb-2">A question to sit with</div>
                  <p className="font-serif text-[21px] text-textPrimary m-0 leading-snug max-w-[34ch] mx-auto">{question}</p>
                </>
              )}
              {question && step && (
                <div className="flex items-center gap-3 my-4" aria-hidden="true">
                  <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--forest-accent)_30%,transparent)]" />
                  <Footprints size={14} strokeWidth={1.75} className="text-forestAccent" />
                  <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--forest-accent)_30%,transparent)]" />
                </div>
              )}
              {step && (
                <>
                  <div className="text-label uppercase tracking-[0.14em] text-forestAccent mb-1.5">One small step</div>
                  <p className="text-body text-textPrimary m-0 max-w-[38ch] mx-auto">{step}</p>
                </>
              )}
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShift(n => n + 1)}
                  className="block mx-auto mt-3 min-h-[36px] text-caption font-medium text-forestAccent underline underline-offset-2"
                >
                  Another question ({at + 1} of {questions.length})
                </button>
              )}
              {question && (
                <Link
                  to="/reflections"
                  className="mt-4 inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent text-bodySm font-medium"
                >
                  Write about it in your YOUrnal <ArrowRight size={15} strokeWidth={1.75} />
                </Link>
              )}
            </section>
          )}
        </>
      )}

    </>
  );
}
