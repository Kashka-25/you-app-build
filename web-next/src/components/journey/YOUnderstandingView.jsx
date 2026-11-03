import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Footprints, HelpCircle } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickNoticedPatterns, pickReflectionQuestion, pickNextStep } from "../../lib/compass";
import { AiCard, AiLabel } from "../ui/Premium";
import AskYOU from "./AskYOU";

function niceDate(key) {
  return key ? new Date(key + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "";
}

// YOUnderstanding (Cassidy, Nov 2: "I open it and have no idea what its
// purpose is"): the threads YOU has noticed running through your YOUrnal,
// gathered from every entry you've asked to be reflected on, with a
// question to sit with and one small step. Says plainly what it is and how
// it grows. Reads reflections already made; never calls AI itself.
// Ask YOU sits on top (Cassidy, Nov 2): your own question, answered from
// everything you've shared, only when you ask.
export default function YOUnderstandingView() {
  const { recentInsights, loadRecentInsights, loaded, items } = useAppData();
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (!loaded || asked) return;
    setAsked(true);
    loadRecentInsights(20).catch(e => console.error("[YOUnderstandingView] load failed:", e));
  }, [loaded, asked, loadRecentInsights]);

  const patterns = pickNoticedPatterns(recentInsights, 6);
  const question = pickReflectionQuestion(recentInsights);
  const step = recentInsights?.length ? pickNextStep(recentInsights, items) : null;
  const reflected = recentInsights?.length || 0;

  return (
    <>
      <AskYOU />

      <div className="rounded-card bg-surface1 shadow-card p-4 mb-4">
        <h2 className="font-serif text-h2 text-textPrimary m-0">What YOU notices</h2>
        <p className="text-bodySm text-textSecondary m-0 mt-1.5">
          Each time you ask for a reflection on a YOUrnal entry, YOU looks for what keeps coming up: feelings, people, places,
          hopes. YOUnderstanding gathers those threads here, across all your entries, so you can see your patterns over time.
        </p>
        <p className="text-caption text-textMuted m-0 mt-2">
          {reflected
            ? `Drawn from the last ${reflected} ${reflected === 1 ? "entry" : "entries"} you had reflected on. It only reads what you've allowed in your AI settings.`
            : "It only reads what you've allowed in your AI settings."}
        </p>
      </div>

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
          {patterns.length > 0 && (
            <AiCard className="mb-4">
              <AiLabel>Threads running through your writing</AiLabel>
              <ul className="list-none m-0 p-0 mt-2.5 space-y-3">
                {patterns.map(p => (
                  <li key={p.text} className="border-l-2 border-[#E8C877]/60 pl-3">
                    <p className="font-serif italic text-body text-[var(--ai-text)] m-0">{p.text}</p>
                    {p.entryDate && <span className="text-caption text-[var(--ai-text-2)]">From your entry on {niceDate(p.entryDate)}</span>}
                  </li>
                ))}
              </ul>
            </AiCard>
          )}

          {question && (
            <div className="rounded-card bg-surface1 shadow-card p-4 mb-4">
              <div className="flex items-center gap-1.5 text-label uppercase text-forestAccent mb-1.5">
                <HelpCircle size={13} strokeWidth={1.75} aria-hidden="true" /> A question to sit with
              </div>
              <p className="font-serif text-h3 text-textPrimary m-0 leading-snug">{question}</p>
              <Link to="/reflections" className="mt-2 inline-flex items-center gap-1.5 min-h-[40px] text-bodySm text-forestAccent font-medium">
                Write about it in your YOUrnal <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
            </div>
          )}

          {step && (
            <div className="rounded-card bg-surface1 shadow-card p-4 mb-4">
              <div className="flex items-center gap-1.5 text-label uppercase text-gold mb-1.5">
                <Footprints size={13} strokeWidth={1.75} aria-hidden="true" /> One small step
              </div>
              <p className="text-body text-textPrimary m-0">{step}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
