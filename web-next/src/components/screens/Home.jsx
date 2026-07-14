import { Link } from "react-router-dom";
import { useAppData } from "../../lib/AppDataContext";
import { Placeholder, SectionTitle, ExploreLink } from "../Primitives";
import ItemCard from "../pursue/ItemCard";

export default function Home() {
  const { items, level, totalXP } = useAppData();
  const active = items.filter(i => !i.done).slice(0, 3);

  return (
    <div className="pt-1 pb-24 px-5">
      <div className="rounded-card p-4 mb-4 min-h-[180px]" style={{ background: "linear-gradient(180deg, var(--forest-accent) 0%, var(--surface-1) 100%)" }}>
        <div className="text-[11px] uppercase tracking-wide text-gold mb-1.5">current chapter</div>
        <div className="font-serif text-[22px] font-medium mb-1">{level.name}</div>
        <div className="text-[13px] text-textSecondary">{level.desc}</div>
        <div className="text-[12px] text-textMuted mt-3">{totalXP} total XP</div>
      </div>

      <div className="flex justify-between items-center">
        <SectionTitle>Today's journey</SectionTitle>
        <Link to="/pursue" className="text-[12px] text-textSecondary">see all</Link>
      </div>
      {active.length === 0 ? (
        <Placeholder label="today's journey">No active pursuits yet — tap Add to plant a habit, goal, or dream.</Placeholder>
      ) : (
        active.map(item => <ItemCard key={item.id} item={item} />)
      )}

      <SectionTitle>Explore</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <ExploreLink to="/atlas" label="living atlas" sub="tend your world" />
        <ExploreLink to="/healing" label="healing journey" sub="parked" />
        <ExploreLink to="/events" label="events" sub="upcoming" />
        <ExploreLink to="/ai-companion" label="YOU companion" sub="insights" />
        <ExploreLink to="/reflections" label="reflections" sub="journal" />
        <ExploreLink to="/empatherapy" label="empatherapy" sub="parked" />
      </div>
    </div>
  );
}
