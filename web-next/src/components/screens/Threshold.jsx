import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ChevronRight, Wheat } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { easeOut } from "../ui/motion";
import TodayIntentions, { useTodayList } from "../sow/TodayIntentions";
import QuickList from "../sow/QuickList";
import TravellingToday from "../wandering/TravellingToday";
import { tendedDaysThisWeek, isSunday, weekStartKey, sowWeekStartKey, isWeekRested, harvestDue } from "../../lib/week";

export const THRESHOLD_SEEN = "you.threshold.seen";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// The portal — concentric rings around a still centre. Static until tapped
// (no autoplay motion); on tap the whole Threshold opens out into Home.
function Portal({ onEnter }) {
  return (
    <button onClick={onEnter} className="group flex flex-col items-center gap-3 mx-auto" aria-label="Step inside YOU">
      <span className="relative w-28 h-28 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[color-mix(in_srgb,var(--gold)_35%,transparent)]" />
        <span className="absolute inset-3 rounded-full border border-[color-mix(in_srgb,var(--gold)_55%,transparent)]" />
        <span className="absolute inset-6 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--sage),var(--forest)_70%)] shadow-card transition-transform duration-300 group-hover:scale-105" />
        <Sprout size={22} strokeWidth={1.75} className="relative text-cream" />
      </span>
      <span className="font-serif text-h3 text-textPrimary">Step inside</span>
    </button>
  );
}

// The week's planting, in one card: an invitation if nothing's planted
// yet, what's growing once it is, or a quiet note if the Seeker chose to
// rest the week. All three lead to the same Sow screen.
function WeekPlanting({ weekIntentions, items }) {
  const week = sowWeekStartKey();
  const planted = weekIntentions
    .filter(w => w.week_start === week)
    .map(w => items.find(i => i.id === w.item_id))
    .filter(Boolean);
  const rested = planted.length === 0 && isWeekRested(week);

  return (
    <Link to="/sow" className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-4">
      <Sprout size={20} strokeWidth={1.75} className="text-forestAccent flex-none" />
      <div className="flex-1 min-w-0">
        {planted.length > 0 ? (
          <>
            <div className="text-body text-textPrimary">{planted.map(i => i.name).join(" · ")}</div>
            <div className="text-caption text-textSecondary mt-0.5">Growing {isSunday() ? "next week" : "this week"} · tap to change</div>
          </>
        ) : rested ? (
          <>
            <div className="text-body text-textPrimary">You chose to rest {isSunday() ? "next week" : "this week"}.</div>
            <div className="text-caption text-textSecondary mt-0.5">Plant something after all</div>
          </>
        ) : (
          <>
            <div className="text-body text-textPrimary">Choose up to three pursuits to grow</div>
            <div className="text-caption text-textSecondary mt-0.5">About five minutes</div>
          </>
        )}
      </div>
      <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
    </Link>
  );
}

// The Threshold — the app's first layer. Opened once per session on
// launch: today, quietly, and one way in. Everything here is already-
// loaded data; nothing generates on open.
export default function Threshold() {
  const navigate = useNavigate();
  const { profile, loaded, weekIntentions, weekHarvests, items } = useAppData();
  const [entering, setEntering] = useState(false);
  const firstName = profile?.name?.split(" ")[0] || "Seeker";

  useEffect(() => {
    try { sessionStorage.setItem(THRESHOLD_SEEN, "1"); } catch { /* ignore */ }
  }, []);

  function enter() {
    setEntering(true);
    setTimeout(() => navigate("/", { replace: true }), 420);
  }

  const tendedDays = tendedDaysThisWeek(weekIntentions);
  const sownThisWeek = weekIntentions.some(w => w.week_start === weekStartKey());
  const hasIntentions = !useTodayList().isEmpty;
  const dateLabel = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-dvh bg-bg flex justify-center font-sans overflow-hidden">
      <motion.div
        animate={entering ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: easeOut }}
        className="w-full max-w-[640px] min-h-dvh px-5 flex flex-col"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 40px)", paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)" }}
      >
        <div className="text-label uppercase text-gold mb-1">{dateLabel}</div>
        <h1 className="font-serif text-hero text-textPrimary">{getGreeting()}, {firstName}</h1>
        {sownThisWeek && (
          <p className="text-bodySm text-textSecondary mt-1">
            {tendedDays === 0 ? "A fresh week of growing." : `Tended on ${tendedDays} ${tendedDays === 1 ? "day" : "days"} this week.`}
          </p>
        )}

        {!loaded && <div className="mt-8 text-body text-textSecondary flex-1">Gathering your day…</div>}

        {loaded && (
          <div className="mt-8 space-y-7 flex-1">
            {/* While travelling, where you are today comes first of all. */}
            <TravellingToday />

            {/* Today first: the one question that's always answerable. */}
            <section>
              <h2 className="font-serif text-h2 text-textPrimary mb-2.5">What do you want to plant today?</h2>
              <div className="rounded-card bg-surface1 shadow-card px-4 py-2">
                {hasIntentions && (
                  <>
                    <div className="text-label uppercase text-textMuted pt-2">From your week</div>
                    <TodayIntentions />
                    <div className="border-t border-borderC mt-1 pt-2" />
                  </>
                )}
                <QuickList showLabel={false} />
              </div>
            </section>

            {/* Then the week: plant it, or see what's growing. */}
            <section>
              <h2 className="font-serif text-h2 text-textPrimary mb-2.5">
                What do you want to plant {isSunday() ? "next week" : "this week"}?
              </h2>
              {harvestDue(weekIntentions, weekHarvests) && (
                <Link to="/harvest" className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-4 mb-3">
                  <Wheat size={20} strokeWidth={1.75} className="text-gold flex-none" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body text-textPrimary">{isSunday() ? "Harvest this week first" : "Harvest last week"}</div>
                    <div className="text-caption text-textSecondary mt-0.5">See what grew, and choose what to carry forward</div>
                  </div>
                  <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
                </Link>
              )}
              <WeekPlanting weekIntentions={weekIntentions} items={items} />
            </section>
          </div>
        )}

        <div className="pt-10">
          <Portal onEnter={enter} />
        </div>
      </motion.div>
    </div>
  );
}
