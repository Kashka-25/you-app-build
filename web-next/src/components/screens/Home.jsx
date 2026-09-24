import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Star, Target, Search, ChevronRight, Check, Flame, BookOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLAR_COLORS } from "../../constants/app.const";
import {
  pickCurrentChapter, pickDirection, pickTodaysQuest, pickRelevantValues, pickNoticedPatterns, pickReflectionQuestion
} from "../../lib/compass";
import { HeroCard, ReflectionCard } from "../ui/Card";
import { GlowBubble } from "../ui/GlowBubble";
import { MOODS } from "../ui/Input";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const ITEM_ICON = { dream: Star, goal: Target, habit: Flame };

// One quick-glance tile in the "Today's Journey" strip — icon + name, no
// interaction beyond linking to Pursue. Check-ins/completion stay on
// Pursue's ItemCard, which already does that well; this is a glanceable
// index, not a second place to manage items.
function ItemChip({ item }) {
  const Icon = ITEM_ICON[item.type] || Flame;
  return (
    <Link to="/pursue" className="flex-none w-[76px] text-center">
      <GlowBubble icon={Icon} size={48} color={PILLAR_COLORS[item.cat]} className="mx-auto mb-1.5" />
      <div className="text-caption text-textSecondary leading-tight line-clamp-2">{item.name}</div>
    </Link>
  );
}

// A single row inside the "Right now" card — icon, small label, one line of
// content. Grouping direction/quest/values into rows under one card (rather
// than three separate cards) is what keeps Home from reading as a stack of
// identical boxes.
function NowRow({ icon: Icon, label, children, divider = true }) {
  return (
    <div className={divider ? "pb-3 mb-3 border-b border-borderC" : ""}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={13} strokeWidth={1.75} className="text-textMuted" />
        <span className="text-caption uppercase text-textMuted">{label}</span>
      </div>
      {children}
    </div>
  );
}

// Every section here answers from data that's already loaded — see
// lib/compass.js — so opening Home never triggers an AI call; it only
// re-reads what's already been generated elsewhere (journal insights,
// values, chapters, items).
export default function Home() {
  const {
    items, values, chapters, journalEntries, recentInsights, profile, loaded, completeItem, loadRecentInsights
  } = useAppData();
  const firstName = profile?.name?.split(" ")[0] || "Seeker";
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || insightsLoaded) return;
    setInsightsLoaded(true);
    loadRecentInsights().catch(e => console.error("[Home] loadRecentInsights failed:", e));
  }, [loaded, insightsLoaded, loadRecentInsights]);

  if (!loaded) {
    return <div className="pt-8 px-5 text-body text-textSecondary">Loading your day…</div>;
  }

  const chapter = pickCurrentChapter(chapters);
  const direction = pickDirection(items);
  const quest = pickTodaysQuest(items);
  const relevantValues = pickRelevantValues(values, recentInsights);
  const latestEntry = journalEntries[0];
  const patterns = pickNoticedPatterns(recentInsights, 1);
  const question = pickReflectionQuestion(recentInsights);
  const hasNowContent = direction || quest || relevantValues.length > 0;
  const hasInsight = patterns.length > 0 || question;
  const activeItems = items.filter(i => !i.done).slice(0, 6);
  const todaysMood = latestEntry?.entry_date === todayKey() ? MOODS.find(m => m.key === latestEntry.mood) : null;

  return (
    <div className="pt-1 pb-24 px-5">
      <HeroCard
        eyebrow={`${getGreeting()}, ${firstName}`}
        title={chapter ? chapter.title : "What matters to you right now?"}
        subtitle={chapter ? chapter.blurb : "Let's find out together."}
        imageLight="/images/home-light.jpg"
        imageDark="/images/home-dark.jpg"
      >
        {todaysMood && (
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-black/25 border border-white/10">
            <todaysMood.Icon size={14} strokeWidth={1.75} className="text-cream" />
            <span className="text-bodySm font-medium text-cream">Feeling {todaysMood.label.toLowerCase()} today</span>
          </div>
        )}
      </HeroCard>

      {activeItems.length > 0 && (
        // overflow-x-auto forces overflow-y to an effective "auto" too (per
        // spec, an axis can't stay "visible" once its sibling axis isn't),
        // which was clipping the bubbles' glow halo top and bottom with no
        // room to breathe. py-4 gives that clip box enough headroom that
        // the halo (and its float animation) renders in full instead of
        // getting cut off at the row's edge.
        <div className="flex gap-3 overflow-x-auto py-4 -mx-5 px-5 -mt-2">
          {activeItems.map(item => <ItemChip key={item.id} item={item} />)}
        </div>
      )}

      <Link to="/bring-me-back" className="block mt-4 mb-4">
        <div className="rounded-card bg-gradient-to-br from-forest to-forestAccent p-4 shadow-card flex items-center gap-3.5">
          <GlowBubble icon={Compass} size={44} />
          <div className="flex-1 min-w-0">
            <div className="font-serif text-h3 text-cream">Bring me back to myself</div>
            <div className="text-bodySm text-[color-mix(in_srgb,var(--cream)_85%,transparent)]">What am I trying to create with my life?</div>
          </div>
          <ChevronRight size={18} strokeWidth={1.75} className="text-cream flex-none" />
        </div>
      </Link>

      {hasNowContent && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-4">
          <div className="text-label uppercase text-gold mb-3">Right now</div>

          {direction && (
            <NowRow icon={Star} label="Direction">
              <Link to="/pursue" className="text-body text-textPrimary">{direction.name}</Link>
            </NowRow>
          )}

          {quest && (
            <NowRow icon={Target} label="Today's quest">
              <div className="flex items-center justify-between gap-3">
                <div className="text-body text-textPrimary">{quest.name}</div>
                <button
                  onClick={() => completeItem(quest.id)}
                  aria-label="Mark done"
                  className="w-6 h-6 flex-none rounded-full border border-borderC text-textMuted flex items-center justify-center hover:border-forestAccent hover:text-forestAccent"
                >
                  <Check size={12} strokeWidth={2.5} />
                </button>
              </div>
            </NowRow>
          )}

          {relevantValues.length > 0 && (
            <NowRow icon={Compass} label="Values" divider={false}>
              <div className="flex flex-wrap gap-1.5">
                {relevantValues.map(name => (
                  <span key={name} className="text-caption bg-surface3 text-textSecondary px-2.5 py-1 rounded-full">{name}</span>
                ))}
              </div>
            </NowRow>
          )}
        </div>
      )}

      {latestEntry && (
        <Link to="/reflections" className="block mb-4">
          <ReflectionCard
            icon={BookOpen}
            date={niceDate(latestEntry.entry_date)}
            prompt="From your journal"
            text={latestEntry.content.length > 160 ? latestEntry.content.slice(0, 160) + "…" : latestEntry.content}
          />
        </Link>
      )}

      {hasInsight && (
        <div className="rounded-card bg-surface1 border-l-2 border-forestAccent shadow-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <GlowBubble icon={Search} size={36} />
            <span className="text-label uppercase text-forestAccent">YOUnderstanding</span>
          </div>
          {patterns.length > 0 && (
            <div className="font-serif text-body text-textPrimary italic mb-2.5">{patterns[0].text}</div>
          )}
          {question && <div className="text-bodySm text-textSecondary">{question}</div>}
        </div>
      )}

      {!hasNowContent && !latestEntry && !hasInsight && (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textMuted">
          Tap Add to plant a habit, goal, or dream, or write your first journal entry — Home will start filling in from there.
        </div>
      )}
    </div>
  );
}
