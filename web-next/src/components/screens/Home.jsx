import { Link } from "react-router-dom";
import { useAppData } from "../../lib/AppDataContext";
import { SectionTitle } from "../Primitives";
import { HeroCard, MediaCard } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";

const EXPLORE = [
  { to: "/atlas", title: "Living Atlas", label: "Tend your world", image: "/images/atlas.jpg" },
  { to: "/healing", title: "Healing Journey", label: "Parked — coming soon", image: "/images/healing-forest.jpg" },
  { to: "/events", title: "Events", label: "Upcoming" },
  { to: "/ai-companion", title: "YOU Companion", label: "Insights" },
  { to: "/reflections", title: "Reflections", label: "Journal" },
  { to: "/empatherapy", title: "Empatherapy", label: "Parked" }
];

export default function Home() {
  const { items, level, totalXP } = useAppData();
  const active = items.filter(i => !i.done).slice(0, 3);

  return (
    <div className="pt-1 pb-24 px-5">
      <HeroCard
        eyebrow="Current Chapter"
        title={level.name}
        subtitle={level.desc}
        imageLight="/images/home-light.jpg"
        imageDark="/images/home-dark.jpg"
      >
        <div className="text-caption text-[color-mix(in_srgb,var(--cream)_80%,transparent)] mt-3">
          {totalXP} total XP
        </div>
      </HeroCard>

      <div className="flex justify-between items-center">
        <SectionTitle>Today's Journey</SectionTitle>
        <Link to="/pursue" className="text-caption text-textSecondary">see all</Link>
      </div>
      {active.length === 0 ? (
        <EmptyState
          title="Nothing active yet"
          description="Tap Add to plant a habit, goal, or dream — your first step starts the journey."
        />
      ) : (
        active.map(item => <ItemCard key={item.id} item={item} />)
      )}

      <SectionTitle>Explore</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {EXPLORE.map(e => (
          <Link key={e.to} to={e.to}>
            <MediaCard size="wide" title={e.title} label={e.label} image={e.image} />
          </Link>
        ))}
      </div>
    </div>
  );
}
