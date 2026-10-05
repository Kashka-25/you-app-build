import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Wind, RotateCcw } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS } from "../../constants/app.const";
import { BackRow, SectionTitle, DropdownSection } from "../Primitives";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";
import { SegmentedControl } from "../ui/SegmentedControl";
import WanderingsList from "../wandering/WanderingsList";

// Two views: the pursuits themselves, and the Wanderings that grow out of
// Dreams. Open on Wanderings with router state { view: "wanderings" }.
const VIEWS = [
  { value: "pursuits", label: "Pursuits" },
  { value: "wanderings", label: "Wanderings" }
];

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
  const { items, releasedItems, restoreItem } = useAppData();
  const [filter, setFilter] = useState("all");
  const location = useLocation();
  const [view, setView] = useState(location.state?.view || "pursuits");
  useEffect(() => {
    if (location.state?.view) setView(location.state.view);
  }, [location.key]);

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
      <div className="mb-4">
        <SegmentedControl options={VIEWS} value={view} onChange={setView} />
      </div>

      {view === "wanderings" ? <WanderingsList /> : (
      <>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-bodySm px-3.5 py-1.5 rounded-full flex-none capitalize transition-colors duration-150 ${
              filter === f ? "bg-forestAccent text-onAccent font-medium" : "bg-surface3 text-textMuted"
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

      {releasedItems.length > 0 && (
        <DropdownSection title={`Released (${releasedItems.length})`}>
          <ReleasedList items={releasedItems} onRestore={restoreItem} />
        </DropdownSection>
      )}
      </>
      )}
    </div>
  );
}

// Pursuits let go at Harvest — archived, not deleted. Their history and XP
// stay; bringing one back returns it to Pursue, Sow and Home as it was.
function ReleasedList({ items, onRestore }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function restore(id) {
    setBusy(id);
    setError("");
    try {
      await onRestore(id);
    } catch (e) {
      console.error("[Pursue] restore failed:", e);
      setError("Couldn't bring that back. Check your connection and try again.");
    }
    setBusy(null);
  }

  return (
    <div className="mb-4">
      <p className="text-bodySm text-textSecondary mb-3">Let go with thanks. Bring any of them back whenever you like.</p>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 py-2 border-b border-borderC last:border-b-0">
          <Wind size={15} strokeWidth={1.75} className="text-textMuted flex-none" />
          <div className="flex-1 min-w-0">
            <div className="text-body text-textPrimary">{item.name}</div>
            <div className="text-caption text-textMuted capitalize">
              {item.type} · {item.cat} · released {new Date(item.releasedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
            </div>
          </div>
          <button
            onClick={() => restore(item.id)}
            disabled={busy === item.id}
            className="flex-none inline-flex items-center gap-1 text-caption text-forestAccent font-medium disabled:opacity-50"
          >
            <RotateCcw size={13} strokeWidth={1.75} />
            {busy === item.id ? "Restoring…" : "Bring back"}
          </button>
        </div>
      ))}
      {error && <div className="text-caption text-error mt-2">{error}</div>}
    </div>
  );
}
