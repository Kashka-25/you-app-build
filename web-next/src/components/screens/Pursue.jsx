import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { BackRow, SectionTitle } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";

const FILTERS = ["all", "habit", "goal", "dream", "done"];

export default function Pursue() {
  const { items } = useAppData();
  const [filter, setFilter] = useState("all");

  const filtered = items.filter(i => {
    if (filter === "done") return i.done;
    if (filter !== "all" && i.type !== filter) return false;
    return filter === "all" ? !i.done : true;
  });
  const sorted = filter === "all" ? [...filtered.filter(i => !i.done), ...items.filter(i => i.done)] : filtered;

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Your pursuits</SectionTitle>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-bodySm px-3.5 py-1.5 rounded-full flex-none capitalize transition-colors duration-150 ${
              filter === f ? "bg-forestAccent text-surface2 font-medium" : "bg-surface3 text-textMuted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Your YOUniverse awaits your intentions. Tap Add to plant something."
        />
      ) : (
        sorted.map(item => <ItemCard key={item.id} item={item} />)
      )}
    </div>
  );
}
