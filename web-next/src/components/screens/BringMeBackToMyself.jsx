import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, Map, MessageCircle, Search, Compass as CompassIcon, Sparkles, Telescope } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickCurrentChapter, pickNoticedPatterns, pickNextStep } from "../../lib/compass";
import { BackRow } from "../Primitives";
import { riseIn } from "../ui/motion";
import { GlowBubble } from "../ui/GlowBubble";

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// A section is a slow, deliberate beat in the scroll — not a dashboard
// tile. A hairline top border (border-borderC, which is already tuned
// per-mode) is the only separator, so this reads as one continuous
// reflection rather than a grid of widgets.
function Beat({ icon: Icon, label, children }) {
  return (
    <motion.div {...riseIn} className="mb-7 pt-6 border-t border-borderC first:border-t-0 first:pt-0">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} strokeWidth={1.75} className="text-gold" />
        <span className="text-label uppercase text-gold">{label}</span>
      </div>
      {children}
    </motion.div>
  );
}

// Respects the user's own light/dark toggle like every other screen — the
// "sanctuary" feeling comes from the floating glowing bubble below, not
// from forcing the whole shell dark.
export default function BringMeBackToMyself() {
  const { values, items, chapters, journalEntries, recentInsights, identityVisions, loaded, loadRecentInsights } = useAppData();
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || insightsLoaded) return;
    setInsightsLoaded(true);
    loadRecentInsights().catch(e => console.error("[BringMeBackToMyself] loadRecentInsights failed:", e));
  }, [loaded, insightsLoaded, loadRecentInsights]);

  if (!loaded) {
    return <div className="pt-8 px-5 text-body text-textSecondary">Loading…</div>;
  }

  const topValues = [...values].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const dreams = items.filter(i => i.type === "dream" && !i.done);
  const chapter = pickCurrentChapter(chapters);
  const recentEntries = journalEntries.slice(0, 3);
  const patterns = pickNoticedPatterns(recentInsights, 4);
  const active = items.filter(i => !i.done).slice(0, 5);
  const nextStep = pickNextStep(recentInsights, items);

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />

      <div className="flex flex-col items-center text-center pt-8 pb-6">
        <GlowBubble icon={CompassIcon} size={96} className="mb-8" />
        <div className="text-label uppercase tracking-wide text-gold mb-2">Bring me back to myself</div>
        <div className="font-serif text-hero text-textPrimary max-w-[300px]">What am I trying to create with my life?</div>
      </div>

      <Beat icon={CompassIcon} label="Your values">
        {topValues.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topValues.map(v => (
              <span key={v.name} className="text-bodySm bg-surface3 text-textPrimary px-3 py-1.5 rounded-full">{v.name}</span>
            ))}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">You haven't chosen your values yet — that's the first place to start.</div>
        )}
      </Beat>

      <Beat icon={Star} label="Your dreams">
        {dreams.length > 0 ? (
          <div className="space-y-1.5">
            {dreams.map(d => <div key={d.id} className="text-body text-textPrimary">{d.name}</div>)}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">No dreams set yet — what kind of life do you want?</div>
        )}
      </Beat>

      <Beat icon={Telescope} label="Who you're becoming">
        {identityVisions.length > 0 ? (
          <div className="space-y-2">
            {identityVisions.slice(0, 3).map(v => (
              <div key={v.id} className="text-body text-textPrimary">
                <span className="font-medium">{v.title}</span>
                <span className="text-textSecondary"> — {v.statement}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">Not a goal — who are you trying to become? Start with a title.</div>
        )}
        <Link to="/journey" state={{ tab: "identity" }} className="inline-block mt-2 text-bodySm text-gold underline">
          Open your visions
        </Link>
      </Beat>

      <Beat icon={Map} label="Your current chapter">
        {chapter ? (
          <>
            <div className="font-serif text-h3 text-textPrimary">{chapter.title}</div>
            {chapter.blurb && <div className="text-bodySm text-textSecondary mt-1">{chapter.blurb}</div>}
          </>
        ) : (
          <div className="text-bodySm text-textMuted">This season of your life doesn't have a name yet.</div>
        )}
      </Beat>

      <Beat icon={MessageCircle} label="What you've been talking about recently">
        {recentEntries.length > 0 ? (
          <div className="space-y-3">
            {recentEntries.map(e => (
              <div key={e.id}>
                <div className="text-caption text-textMuted mb-0.5">{niceDate(e.entry_date)}</div>
                <div className="font-serif text-body text-textSecondary italic">
                  "{e.content.length > 140 ? e.content.slice(0, 140) + "…" : e.content}"
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">Nothing written yet — your journal is where YOU starts to know you.</div>
        )}
      </Beat>

      <Beat icon={Search} label="Patterns YOU has noticed">
        {patterns.length > 0 ? (
          <div className="space-y-2">
            {patterns.map((p, i) => (
              <div key={i} className="text-bodySm text-textPrimary">A possible pattern: {p.text}</div>
            ))}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">Not enough written yet to notice a pattern — that comes with time.</div>
        )}
      </Beat>

      <Beat icon={CompassIcon} label="What you're currently doing">
        {active.length > 0 ? (
          <div className="space-y-1.5">
            {active.map(i => (
              <div key={i.id} className="text-bodySm text-textPrimary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-none" />
                {i.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-bodySm text-textMuted">Nothing active right now.</div>
        )}
      </Beat>

      <motion.div
        {...riseIn}
        className="rounded-card bg-gradient-to-br from-forest to-forestAccent p-5 pt-4 mt-3 flex flex-col items-center text-center"
        style={{ boxShadow: "0 0 40px -8px color-mix(in srgb, var(--gold) 45%, transparent)" }}
      >
        <GlowBubble icon={Sparkles} size={56} className="mb-3" />
        <span className="text-label uppercase text-[color-mix(in_srgb,var(--cream)_85%,transparent)] mb-2">
          One thing that could move you forward
        </span>
        <div className="font-serif text-h2 text-cream">
          {nextStep || "Write down what's on your mind — that's always a place to start."}
        </div>
        <Link to="/reflections" className="inline-block mt-3 text-bodySm text-gold underline">
          Go write about it
        </Link>
      </motion.div>
    </div>
  );
}
