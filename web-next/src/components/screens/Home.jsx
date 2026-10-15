import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Sun, Sprout, Wheat, Timer } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickCurrentChapter, pickNoticedPatterns, pickReflectionQuestion } from "../../lib/compass";
import { GlowBubble } from "../ui/GlowBubble";
import { MOODS } from "../ui/Input";
import TodayIntentions, { useTodayList } from "../sow/TodayIntentions";
import QuickList from "../sow/QuickList";
import { useCourseNow } from "../course/CourseNow";
import WelcomeHero from "../home/WelcomeHero";
import DailyCheckIn from "../home/DailyCheckIn";
import JourneyProgressCard from "../home/JourneyProgressCard";
import { PracticeCard, QuickTools } from "../home/PracticeAndTools";
import { tendedDaysThisWeek, needsSowing, isSunday, weekStartKey, harvestDue, localDateKey as todayKey } from "../../lib/week";

// Home answers three things, in this order: how am I arriving, where am I
// on my path, and what's one step I can take. Everything reads data that's
// already loaded (see lib/compass.js), so opening Home never calls AI.
export default function Home() {
  const {
    items, chapters, journalEntries, recentInsights, profile, loaded, loadRecentInsights,
    todos, weekIntentions, weekHarvests, compass, moodLog, logMood
  } = useAppData();
  const hasIntentions = !useTodayList().isEmpty;
  const { entries: courses, tools } = useCourseNow();
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  useEffect(() => {
    if (!loaded || insightsLoaded) return;
    setInsightsLoaded(true);
    loadRecentInsights().catch(e => console.error("[Home] loadRecentInsights failed:", e));
  }, [loaded, insightsLoaded, loadRecentInsights]);

  if (!loaded) {
    return (
      <div className="pt-1 px-5 space-y-4" aria-busy="true" aria-label="Loading your day">
        <div className="h-[220px] rounded-card bg-surface1 animate-pulse" />
        <div className="h-[150px] rounded-card bg-surface1 animate-pulse" />
        <div className="h-[170px] rounded-card bg-surface1 animate-pulse" />
      </div>
    );
  }

  const today = todayKey();
  const firstName = profile?.name?.trim().split(" ")[0] || "";
  const isNew = items.length === 0 && journalEntries.length === 0;
  const greeting = firstName ? `${isNew ? "Welcome" : "Welcome back"}, ${firstName}.` : isNew ? "Welcome to YOU." : "Welcome back.";

  const chapter = pickCurrentChapter(chapters);
  const subtitleIsCompass = Boolean(compass?.compass_line);
  const subtitle = compass?.compass_line || chapter?.title || "A little progress, every day.";

  // Today's answer: the newest check-in, or a mood given with today's entry.
  const checkIn = moodLog.find(m => m.date_key === today && MOODS.some(x => x.key === m.mood))?.mood;
  const entryMood = journalEntries[0]?.entry_date === today ? journalEntries[0].mood : null;
  const todayMoodKey = checkIn || entryMood || null;
  const todayMood = MOODS.find(m => m.key === todayMoodKey) || null;

  const nextCourse = courses.find(c => c.kind !== "resting");
  const cta = nextCourse
    ? { to: nextCourse.to, label: "Continue my journey" }
    : { to: "/journey", label: isNew ? "Begin your journey" : "Open your YOUrney" };

  const patterns = pickNoticedPatterns(recentInsights, 1);
  const question = pickReflectionQuestion(recentInsights);
  const hasInsight = patterns.length > 0 || question;
  const tendedDays = tendedDaysThisWeek(weekIntentions);
  const sownThisWeek = weekIntentions.some(w => w.week_start === weekStartKey());
  const offerSow = needsSowing(weekIntentions);

  return (
    // Phones: one column, in the order the questions are asked. Laptops: a
    // grid (journey beside the practice, Today beside YOUnderstanding,
    // the tools in a row), each cell stretching to its row's height.
    <div
      className="pt-1 px-5 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:pb-10 lg:[&>*]:h-full lg:[&>*>section]:h-full"
      style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="lg:col-span-12 lg:order-1">
        <WelcomeHero greeting={greeting} subtitle={subtitle} subtitleIsCompass={subtitleIsCompass} mood={todayMood} cta={cta} />
      </div>

      <div className="lg:col-span-12 lg:order-2">
        <DailyCheckIn todayMood={todayMoodKey} onPick={logMood} />
      </div>

      <div className="lg:col-span-7 lg:order-3">
        <JourneyProgressCard entries={courses} />
      </div>

      <div className={`${hasInsight ? "lg:col-span-7" : "lg:col-span-12"} lg:order-5`}>
      <section aria-labelledby="home-today" className="rounded-card bg-surface1 shadow-card p-4">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 id="home-today" className="font-serif text-h3 text-textPrimary m-0">
            <Link to="/threshold" className="inline-flex items-center gap-2">
              <Sun size={16} strokeWidth={1.75} className="text-gold" aria-hidden="true" /> Today
            </Link>
          </h2>
          {sownThisWeek && tendedDays > 0 && (
            <span className="text-caption text-textSecondary">Tended {tendedDays} {tendedDays === 1 ? "day" : "days"} this week</span>
          )}
        </div>

        <TodayIntentions />

        <div className={hasIntentions ? "mt-2 pt-2 border-t border-borderC" : ""}>
          <QuickList showLabel={hasIntentions} />
        </div>

        <Link to="/focus" className="flex items-center gap-2.5 min-h-[44px] text-bodySm text-forestAccent mt-3 pt-3 border-t border-borderC">
          <Timer size={16} strokeWidth={1.75} />
          <span className="flex-1">{hasIntentions ? "A focus session for something else" : "Start a focus session"}</span>
          <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" />
        </Link>

        {harvestDue(weekIntentions, weekHarvests) && (
          <Link to="/harvest" className="flex items-center gap-2.5 min-h-[44px] text-bodySm text-textPrimary mt-2 pt-2 border-t border-borderC">
            <Wheat size={16} strokeWidth={1.75} className="text-gold" />
            <span className="flex-1">{isSunday() ? "Harvest this week" : "Harvest last week"}: see what grew</span>
            <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" />
          </Link>
        )}

        {offerSow ? (
          <Link to="/sow" className="flex items-center gap-2.5 min-h-[44px] text-bodySm text-forestAccent mt-2 pt-2 border-t border-borderC">
            <Sprout size={16} strokeWidth={1.75} />
            <span className="flex-1">{isSunday() ? "Sow next week" : "Sow your week"}: what do you want to grow?</span>
            <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted" />
          </Link>
        ) : sownThisWeek && (
          <Link to="/sow" className="inline-block mt-2 text-caption text-textMuted min-h-[32px]">Change your sowing</Link>
        )}
      </section>
      </div>

      <div className="lg:col-span-5 lg:order-4">
        <PracticeCard tool={tools[0]} />
      </div>

      <div className="lg:col-span-12 lg:order-7">
        <QuickTools />
      </div>

      {hasInsight && (
        <div className="lg:col-span-5 lg:order-6">
        <section aria-label="YOUnderstanding" className="rounded-card bg-surface1 border-l-2 border-forestAccent shadow-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <GlowBubble icon={Search} size={36} />
            <span className="text-label uppercase text-forestAccent">YOUnderstanding</span>
          </div>
          {patterns.length > 0 && <div className="font-serif text-body text-textPrimary italic mb-2.5">{patterns[0].text}</div>}
          {question && <div className="text-bodySm text-textSecondary">{question}</div>}
        </section>
        </div>
      )}

      {isNew && todos.length === 0 && !hasIntentions && (
        <p className="lg:col-span-12 lg:order-8 rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textMuted m-0">
          Tap Add below to plant a habit, goal or dream, or write your first journal entry. Home fills in from there.
        </p>
      )}
    </div>
  );
}
