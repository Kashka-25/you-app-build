import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Sun, Sprout, Wheat, Sparkles } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { pickCurrentChapter } from "../../lib/compass";
import { MOODS } from "../ui/Input";
import TodayIntentions, { useTodayList } from "../sow/TodayIntentions";
import QuickList from "../sow/QuickList";
import HabitsToday from "../home/HabitsToday";
import { usePlugin } from "../../lib/plugins";
import { useCourseNow } from "../course/CourseNow";
import WelcomeHero from "../home/WelcomeHero";
import DailyCheckIn from "../home/DailyCheckIn";
import JourneyProgressCard from "../home/JourneyProgressCard";
import { PracticeCard } from "../home/PracticeAndTools";
import ArtworkSheet from "../showcase/ArtworkSheet";
import { useAuth } from "../../lib/AuthContext";
import { useShowcase } from "../../lib/showcaseApi";
import { backgroundMode, pickFeatured } from "../../lib/showcase";
import { tendedDaysThisWeek, needsSowing, isSunday, weekStartKey, harvestDue, localDateKey as todayKey } from "../../lib/week";
import { latestReview, nudgeDue, useHemisphere } from "../../lib/seasons";
import { MEMENTOS } from "../../constants/mementos";
import { useActivePursuits } from "../../lib/activePursuits";

// Home answers three things, in this order: how am I arriving, where am I
// on my path, and what's one step I can take. Everything reads data that's
// already loaded (see lib/compass.js), so opening Home never calls AI.
export default function Home() {
  const {
    items, chapters, journalEntries, profile, loaded,
    todos, weekIntentions, weekHarvests, compass, moodLog
  } = useAppData();
  const todayList = useTodayList();
  const hasIntentions = !todayList.isEmpty;
  const sownIds = [...todayList.due, ...todayList.restedToday].map(x => x.item.id);
  const { isActive } = useActivePursuits();
  const hasHabits = items.some(i => i.type === "habit" && isActive(i) && !sownIds.includes(i.id));
  const todoOn = usePlugin("todo_list");
  // Home stays simple (Cassidy, Nov 3): the welcome, the check-in and
  // Today. YOUniversity's path and practice, and Showcase's featured piece,
  // only come with their extras.
  const youniversityOn = usePlugin("youniversity");
  const showcaseOn = usePlugin("showcase");
  const { entries: courses, tools } = useCourseNow();
  const { userId } = useAuth();
  const showcase = useShowcase(userId);
  const [openWork, setOpenWork] = useState(null);
  const [artMode] = useState(backgroundMode);

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

  // The course itself is continued from the journey card just below, so the
  // welcome's button goes somewhere else (Cassidy, Oct 24: "Continue your
  // journey only needs to show up once").
  // Only someone brand new gets a button on the welcome; everyone else has
  // Today right beside it instead.
  const cta = isNew ? { to: "/journey", label: "Begin your journey" } : null;

  const tendedDays = tendedDaysThisWeek(weekIntentions);
  const sownThisWeek = weekIntentions.some(w => w.week_start === weekStartKey());
  const offerSow = needsSowing(weekIntentions);
  const featuredArt = showcaseOn ? pickFeatured(showcase.works, "home_background") : null;
  const featuredWords = previewWords() || (showcaseOn ? pickFeatured(showcase.works, "featured_words") : null);

  return (
    // Phones: one column, in the order the questions are asked. Laptops: a
    // grid (journey beside the practice, Today beside YOUnderstanding,
    // the tools in a row), each cell stretching to its row's height.
    <div
      className="pt-1 px-5 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5 lg:pb-10 lg:[&>*]:h-full lg:[&>*>section]:h-full"
      style={{ paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="lg:col-span-7 lg:order-1">
        <WelcomeHero greeting={greeting} subtitle={subtitle} subtitleIsCompass={subtitleIsCompass} mood={todayMood} cta={cta} art={featuredArt} words={featuredWords} artMode={artMode} onOpenArt={setOpenWork} />
      </div>

      {/* Arriving comes first (Cassidy, Nov 1): until today's check-in, it
          sits right under the welcome; once answered it steps aside and
          Today moves up. On a laptop it keeps its own row below. */}
      <div className="lg:col-span-12 lg:order-2 empty:hidden">
        <DailyCheckIn />
      </div>

      {/* Today sits with the welcome (Cassidy, Oct 25: "the most used stuff
          for ease of access"): first on a phone, beside it on a laptop. */}
      <div className="lg:col-span-5 lg:order-1">
      <section aria-labelledby="home-today" className="rounded-card bg-surface1 shadow-card p-4">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 id="home-today" className="font-serif text-h3 text-textPrimary m-0">
            <span className="inline-flex items-center gap-2">
              <Sun size={16} strokeWidth={1.75} className="text-gold" aria-hidden="true" /> Today
            </span>
          </h2>
          {sownThisWeek && tendedDays > 0 && (
            <span className="text-caption text-textSecondary">Tended {tendedDays} {tendedDays === 1 ? "day" : "days"} this week</span>
          )}
        </div>

        <TodayIntentions />

        {hasHabits && (
          <div className={hasIntentions ? "mt-2 pt-2 border-t border-borderC" : ""}>
            <HabitsToday skipIds={sownIds} />
          </div>
        )}

        {todoOn && (
          <div className={hasIntentions || hasHabits ? "mt-2 pt-2 border-t border-borderC" : ""}>
            <QuickList showLabel={hasIntentions} />
          </div>
        )}

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

      {/* When the year turns, YOU invites a Season review (lib/seasons.js). */}
      <SeasonNudge />

      {/* With YOUniversity on: the path being walked, and its practice right
          under it (Cassidy, Nov 1). */}
      {youniversityOn && (
        <>
          <div className="lg:col-span-7 lg:order-3">
            <JourneyProgressCard entries={courses} />
          </div>
          <div className="lg:col-span-5 lg:order-3">
            <PracticeCard tool={tools[0]} />
          </div>
        </>
      )}

      {isNew && todos.length === 0 && !hasIntentions && (
        <p className="lg:col-span-12 lg:order-8 rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textMuted m-0">
          Tap Add below to plant a habit, goal or dream, or write your first journal entry. Home fills in from there.
        </p>
      )}

      <ArtworkSheet
        work={openWork}
        saved={Boolean(openWork && showcase.saves[openWork.id])}
        onSavedChange={showcase.setSaved}
        onClose={() => setOpenWork(null)}
      />
    </div>
  );
}

// "Winter has ended. Your Winter review is ready." Shown for three weeks
// after a solstice or equinox, until the review is done.
function SeasonNudge() {
  const { seasons } = useAppData();
  const { hemisphere } = useHemisphere();
  const review = latestReview(hemisphere);
  if (!nudgeDue(review, seasons)) return null;
  return (
    <div className="lg:col-span-12 lg:order-2">
      <Link
        to="/season-review"
        className="flex items-center gap-3 rounded-card px-4 py-3 text-[#FFF8EE] shadow-card"
        style={{ background: "linear-gradient(120deg, #8D7AB0 0%, #4C5F7A 55%, #2A1C12 100%)" }}
      >
        <Sparkles size={20} strokeWidth={1.5} className="flex-none" />
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-h3 leading-tight">
            {review.kind === "equinox" ? "The equinox has come" : `${review.ending} has ended`}
          </span>
          <span className="block text-caption opacity-85">{review.title} is ready: a look back at {review.kind === "equinox" ? "the last six months" : "the season"}.</span>
        </span>
        <ChevronRight size={18} strokeWidth={1.75} className="flex-none opacity-80" />
      </Link>
    </div>
  );
}

// On a local dev copy only: /?preview-words=154 shows one of Cassidy's own
// lines (constants/mementos.js) as the featured words, to see a real piece
// on the welcome without touching the live Showcase. Add
// &preview-image=tool-wanderings (a file in /images/home, .webp) to give it
// an image, and &preview-scroll=0 to show it without the scroll.
function previewWords() {
  if (!import.meta.env.DEV) return null;
  const q = new URLSearchParams(window.location.search);
  const id = Number(q.get("preview-words"));
  const m = id && MEMENTOS.find(x => x.id === id && x.kind === "creator");
  if (!m) return null;
  const image = q.get("preview-image");
  return {
    id: `preview-${m.id}`, title: m.source || null, body: m.text, artist: { display_name: m.author }, credits: [],
    imageUrl: image && /^[\w-]+$/.test(image) ? `/images/home/${image}.webp` : null,
    words_scroll: q.get("preview-scroll") !== "0"
  };
}
