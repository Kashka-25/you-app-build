import { useState } from "react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { BackRow, SectionTitle, DropdownSection } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";

const FILTERS = ["all", "habit", "goal", "dream", "done"];

function pathSegments(item) {
  return (item.subcat || "").split("/").map(s => s.trim()).filter(Boolean);
}

// Splits a list of items into ones that stop at this depth (rendered
// directly) vs ones that continue deeper, bucketed by their next segment
// (e.g. depth 0 on "Music/Songs" buckets under "Music"; depth 1 on what's
// left buckets under "Songs"). Recursing this one level at a time is what
// lets "Creative -> Music -> Songs" nest to arbitrary depth from a single
// free-text field instead of needing fixed subcategory/sub-subcategory
// columns.
function splitByDepth(items, depth) {
  const direct = [];
  const childMap = {};
  for (const item of items) {
    const segs = pathSegments(item);
    if (segs.length <= depth) {
      direct.push(item);
    } else {
      const key = segs[depth];
      (childMap[key] || (childMap[key] = [])).push(item);
    }
  }
  const children = Object.keys(childMap).sort().map(name => ({ name, items: childMap[name] }));
  return { direct, children };
}

function GroupNode({ items, depth }) {
  const { direct, children } = splitByDepth(items, depth);
  return (
    <>
      {direct.map(item => <ItemCard key={item.id} item={item} />)}
      {children.map(({ name, items: childItems }) => (
        <DropdownSection key={name} title={`${name} (${childItems.length})`} level={depth + 1} defaultOpen>
          <GroupNode items={childItems} depth={depth + 1} />
        </DropdownSection>
      ))}
    </>
  );
}

export default function Pursue() {
  const { items } = useAppData();
  const [filter, setFilter] = useState("all");

  const filtered = items.filter(i => {
    if (filter === "done") return i.done;
    if (filter !== "all" && i.type !== filter) return false;
    return filter === "all" ? !i.done : true;
  });
  const sorted = filter === "all" ? [...filtered.filter(i => !i.done), ...items.filter(i => i.done)] : filtered;

  // Grouped by life area — a flat list stopped being scannable once there
  // were more than a handful of items. PILLARS gives a fixed, consistent
  // order; groups with nothing in them (given the current filter) are
  // skipped rather than shown empty.
  const groups = PILLARS.map(cat => ({ cat, list: sorted.filter(i => i.cat === cat) })).filter(g => g.list.length > 0);

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
        groups.map(({ cat, list }) => (
          <DropdownSection key={cat} title={`${cat} (${list.length})`} defaultOpen>
            <GroupNode items={list} depth={0} />
          </DropdownSection>
        ))
      )}
    </div>
  );
}
