import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Check, Wind, RotateCcw, Plus, Sparkles, Moon } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { PILLARS, PILLAR_COLORS } from "../../constants/app.const";
import { DropdownSection } from "../Primitives";
import { Button } from "../ui/Button";
import AddItemModal from "../pursue/AddItemModal";
import { useActivePursuits } from "../../lib/activePursuits";
import { EmptyState } from "../ui/EmptyState";
import ItemCard from "../pursue/ItemCard";
import { SegmentedControl } from "../ui/SegmentedControl";
import WanderingsList from "../wandering/WanderingsList";
import { PillarTitle } from "../ui/Pillar";

// Two views: the pursuits themselves, and the Wanderings that grow out of
// Dreams. Open on Wanderings with router state { view: "wanderings" }.
const VIEWS = [
  { value: "pursuits", label: "PursYOUts" },
  { value: "wanderings", label: "Wanderings" }
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "habit", label: "Habits" },
  { value: "goal", label: "Goals" },
  { value: "dream", label: "Dreams" },
  { value: "idea", label: "Ideas" },
  { value: "done", label: "Done" }
];

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

// Each Pillar's heading wears its colour, so it stands apart from the
// quiet "Completed" fold beneath it (Cassidy, Oct 28). Active pursuits sit
// at the top of the page, so a Pillar counts only what's resting in it.
function PillarHeading({ cat, count }) {
  return <PillarTitle pillar={cat} count={count} countLabel="resting" />;
}

function CompletedLabel({ n }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-caption font-medium uppercase tracking-wider text-textMuted">
      <Check size={13} strokeWidth={2} aria-hidden="true" /> Completed · {n}
    </span>
  );
}

export default function Pursue() {
  const { items, releasedItems, restoreItem } = useAppData();
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const { isActive } = useActivePursuits();
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
  // On "all", each Pillar shows what's growing, with its completed
  // pursuits folded underneath (Cassidy, Oct 25).
  // Active pursuits sit together at the top, highlighted (Cassidy, Nov 2);
  // everything else rests in its Pillar below until it's activated.
  const active = sorted.filter(i => isActive(i));
  const resting = sorted.some(i => !i.done && !isActive(i));
  const groups = PILLARS.map(cat => {
    const list = sorted.filter(i => i.cat === cat && !isActive(i));
    return filter === "all"
      ? { cat, list: list.filter(i => !i.done), done: list.filter(i => i.done) }
      : { cat, list, done: [] };
  }).filter(g => g.list.length + g.done.length > 0);

  return (
    <div className="pt-1 pb-24 px-5">
      {/* A painted header (Cassidy, Nov 2), like YOUrnal's: the three plants
          from the YOU set, the name, and a way to plant something new. A main
          page of its own, so no back link. */}
      <section aria-labelledby="pursue-title" className="relative mt-3 mb-4 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/tool-pursuits.webp"
          alt=""
          width="520"
          height="370"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_30%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/70 via-40% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/70" />
        <div className="relative flex flex-col justify-end min-h-[168px] p-4 pt-16">
          <h1 id="pursue-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">Your PursYOUts</h1>
          <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">The habits, goals and dreams you're growing.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Plant something</Button>
          </div>
        </div>
      </section>

      <div className="mb-4">
        <SegmentedControl options={VIEWS} value={view} onChange={setView} />
      </div>

      {view === "wanderings" ? <WanderingsList /> : (
      <>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`text-bodySm px-3.5 min-h-[34px] rounded-full flex-none transition-colors duration-150 ${
              filter === f.value ? "bg-forestAccent text-onAccent font-medium" : "bg-surface3 text-textSecondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {sorted.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Your YOUniverse awaits your intentions. Tap Add to plant something."
        />
      ) : (
        <>
        {active.length > 0 && (
          <section aria-labelledby="pursue-active" className="mb-5">
            <h2 id="pursue-active" className="flex items-center gap-2 font-serif text-h3 text-textPrimary m-0 mb-2">
              <Sparkles size={16} strokeWidth={1.75} className="text-gold" aria-hidden="true" /> Active
              <span className="font-sans text-caption text-textMuted">{active.length}</span>
            </h2>
            {active.map(item => <ItemCard key={item.id} item={item} />)}
          </section>
        )}
        {resting && (
          <>
            <h2 className="flex items-center gap-2 font-serif text-h3 text-textPrimary m-0 mb-1">
              <Moon size={15} strokeWidth={1.75} className="text-textMuted" aria-hidden="true" /> Resting
            </h2>
            <p className="text-caption text-textMuted m-0 mb-2">Here until you're ready: tap Activate on any of them.</p>
          </>
        )}
        {groups.map(({ cat, list, done }) => (
          <DropdownSection key={cat} title={<PillarHeading cat={cat} count={list.length} />} defaultOpen>
            {list.length > 0 && <GroupNode items={list} depth={0} />}
            {done.length > 0 && (
              <DropdownSection title={<CompletedLabel n={done.length} />} level={1}>
                <GroupNode items={done} depth={1} />
              </DropdownSection>
            )}
          </DropdownSection>
        ))}
        </>
      )}

      {releasedItems.length > 0 && (
        <DropdownSection title={`Released (${releasedItems.length})`}>
          <ReleasedList items={releasedItems} onRestore={restoreItem} />
        </DropdownSection>
      )}
      </>
      )}

      <AddItemModal open={adding} onClose={() => setAdding(false)} defaultType={["habit", "goal", "dream", "idea"].includes(filter) ? filter : "habit"} />
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
