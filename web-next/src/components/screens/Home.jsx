import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { SectionTitle } from "../Primitives";
import { HeroCard } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";

const MAX_VISIBLE = 3;
const COMPLETE_LINGER_MS = 900;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { items, level, profile, loaded } = useAppData();
  const firstName = profile?.name?.split(" ")[0] || "Seeker";

  // Holds the item ids Today's Journey is currently showing. A completed
  // item lingers here briefly instead of vanishing the instant it's done,
  // so the checkmark moment is actually visible before it's replaced.
  const [visibleIds, setVisibleIds] = useState(() => items.filter(i => !i.done).slice(0, MAX_VISIBLE).map(i => i.id));

  useEffect(() => {
    setVisibleIds(prev => {
      const stillPresent = prev.filter(id => items.some(i => i.id === id));
      const activeIds = items.filter(i => !i.done).map(i => i.id);
      const openSlots = MAX_VISIBLE - stillPresent.length;
      const additions = activeIds.filter(id => !stillPresent.includes(id)).slice(0, Math.max(0, openSlots));
      return [...stillPresent, ...additions];
    });
  }, [items]);

  useEffect(() => {
    const justCompleted = visibleIds.filter(id => items.find(i => i.id === id)?.done);
    if (justCompleted.length === 0) return;
    const timer = setTimeout(() => {
      setVisibleIds(prev => prev.filter(id => !justCompleted.includes(id)));
    }, COMPLETE_LINGER_MS);
    return () => clearTimeout(timer);
  }, [visibleIds, items]);

  const visibleItems = visibleIds.map(id => items.find(i => i.id === id)).filter(Boolean);

  // Loading gate is intentionally static (no spinner/pulse) — avoids a
  // flash of the wrong empty state, and avoids motion nobody asked for.
  if (!loaded) {
    return <div className="pt-8 px-5 text-body text-textSecondary">Loading your day…</div>;
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <HeroCard
        title={`${getGreeting()}, ${firstName}`}
        subtitle={level.desc}
        imageLight="/images/home-light.jpg"
        imageDark="/images/home-dark.jpg"
      >
        <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-black/25 border border-white/10">
          <span className="text-label uppercase text-[color-mix(in_srgb,var(--cream)_70%,transparent)]">
            Current Chapter
          </span>
          <span className="text-bodySm font-medium text-cream">{level.name}</span>
        </div>
      </HeroCard>

      <div className="flex justify-between items-start mt-5">
        <SectionTitle>Today's Journey</SectionTitle>
        <Link to="/pursue" className="flex items-center gap-0.5 text-bodySm text-textSecondary flex-none pt-1">
          View all
          <ChevronRight size={16} strokeWidth={1.75} />
        </Link>
      </div>
      <div className="text-bodySm text-textSecondary -mt-2 mb-3">Your next right steps.</div>

      {visibleItems.length === 0 ? (
        <EmptyState
          title="Nothing active yet"
          description="Tap Add to plant a habit, goal, or dream — your first step starts the journey."
        />
      ) : (
        visibleItems.map(item => <ItemCard key={item.id} item={item} />)
      )}

      <Link to="/atlas" className="block mt-6">
        <div className="rounded-card bg-surface1 shadow-card p-3.5 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-sm overflow-hidden flex-none">
            <img src="/images/atlas.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-h3 font-medium text-textPrimary">Living Atlas</div>
            <div className="text-bodySm text-textSecondary">See how your world is growing</div>
          </div>
          <ChevronRight size={18} strokeWidth={1.75} className="text-textSecondary flex-none" />
        </div>
      </Link>
    </div>
  );
}
