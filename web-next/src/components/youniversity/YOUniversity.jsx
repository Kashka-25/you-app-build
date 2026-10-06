import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Check, Wrench, BookOpen, ChevronRight, Clock } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { ARCANA, FORMATS, getArcanum } from "../../constants/arcana";
import { arcanumProgress, progressLine, toolLine, niceDate } from "../../lib/arcana";
import { useCourses, courseState, courseLine } from "../../lib/course";
import { BackRow } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { riseIn } from "../ui/motion";
import OwnToolModal from "./OwnToolModal";
import GiftCode from "./GiftCode";

const TABS = [
  { value: "library", label: "Library" },
  { value: "explore", label: "Explore" }
];

export function ArcanumIcon({ icon: Icon, own = false }) {
  return (
    <div className={`w-11 h-11 flex-none rounded-full flex items-center justify-center ${own ? "bg-surface3 text-textSecondary" : "bg-surface3 text-gold"}`}>
      <Icon size={20} strokeWidth={1.75} />
    </div>
  );
}

function Row({ to, icon, own, name, meta, sub }) {
  return (
    <motion.div {...riseIn}>
      <Link to={to} className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-4 mb-3 hover:bg-surface3/60 transition-colors duration-150">
        <ArcanumIcon icon={icon} own={own} />
        <div className="flex-1 min-w-0">
          <div className="text-body text-textPrimary font-medium">{name}</div>
          <div className="text-caption text-textMuted">{meta}</div>
          {sub && <div className="text-caption text-textSecondary mt-0.5">{sub}</div>}
        </div>
        <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
      </Link>
    </motion.div>
  );
}

function Library({ onAddOwn, onExplore }) {
  const { heldArcana, ownTools, reflections, courseProgress, toolUses, walkFor, courseWalks } = useAppData();
  const [filter, setFilter] = useState("all");

  const held = useMemo(() => heldArcana.map(h => ({ ...getArcanum(h.slug), source: h.source })).filter(a => a.slug), [heldArcana]);
  const courses = useCourses(held);
  const states = useMemo(
    () => Object.fromEntries(Object.entries(courses).map(([slug, c]) => [slug, courseState(c, slug, courseProgress, walkFor(slug))])),
    [courses, courseProgress, courseWalks] // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Tools a course has given: each stage's practice, once it's done.
  const tools = useMemo(() => held.flatMap(a => (states[a.slug]?.unlockedTools || []).map(id => {
    const uses = toolUses.filter(u => u.slug === a.slug && u.tool_id === id);
    return { key: `${a.slug}:${id}`, slug: a.slug, id, tool: courses[a.slug].tools[id], from: a.name, uses };
  })), [held, states, courses, toolUses]);

  // Only the filters that have something in them, so none leads nowhere.
  const filters = useMemo(() => {
    const formats = [...new Set(held.map(a => a.format)), ...(tools.length ? ["tool"] : [])];
    return [
      { value: "all", label: "All" },
      ...Object.keys(FORMATS).filter(f => formats.includes(f)).map(f => ({ value: f, label: FORMATS[f] + "s" })),
      ...(ownTools.length ? [{ value: "own", label: "My own" }] : [])
    ];
  }, [held, tools.length, ownTools.length]);
  const active = filters.some(f => f.value === filter) ? filter : "all";

  if (!held.length && !ownTools.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Your Library is waiting"
        description="Arcana you add from Explore live here, along with any tools you've picked up along the way."
        actionLabel="Explore the Arcana"
        onAction={onExplore}
      />
    );
  }

  const showArcana = active !== "own" && active !== "tool";
  const showTools = (active === "all" || active === "tool") && tools.length > 0;
  const showOwn = active === "all" || active === "own";
  const status = a => (a.free ? "Free" : a.source === "gift" ? "A gift" : "Yours");

  return (
    <div>
      {filters.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter your Library">
          {filters.map(f => (
            <button
              key={f.value}
              type="button"
              aria-pressed={active === f.value}
              onClick={() => setFilter(f.value)}
              className={`text-bodySm px-3 py-1 rounded-full border transition-colors duration-150 ${
                active === f.value ? "border-forestAccent text-forestAccent bg-surface1 font-medium" : "border-borderC text-textSecondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {showArcana && held.filter(a => active === "all" || a.format === active).map(a => (
        <Row
          key={a.slug}
          to={`/youniversity/arcanum/${a.slug}`}
          icon={a.icon}
          name={a.name}
          meta={`${FORMATS[a.format]} · ${status(a)}`}
          sub={a.format === "course"
            ? (states[a.slug] ? courseLine(states[a.slug], courses[a.slug]) : "")
            : progressLine(arcanumProgress(a, reflections))}
        />
      ))}

      {showTools && (
        <>
          {active === "all" && <div className="text-label uppercase text-gold mt-5 mb-2">Tools</div>}
          {tools.map(t => (
            <Row
              key={t.key}
              to={`/youniversity/arcanum/${t.slug}/tool/${t.id}`}
              icon={t.tool.icon}
              name={t.tool.name}
              meta={`Tool · from ${t.from}`}
              sub={t.uses.length ? `Used ${t.uses.length} time${t.uses.length === 1 ? "" : "s"} · last ${niceDate(t.uses[0].used_on)}` : "Not used yet"}
            />
          ))}
        </>
      )}

      {showOwn && ownTools.length > 0 && (
        <>
          {active === "all" && (held.length > 0 || tools.length > 0) && <div className="text-label uppercase text-gold mt-5 mb-2">My own</div>}
          {ownTools.map(t => (
            <Row
              key={t.id}
              to={`/youniversity/tool/${t.id}`}
              icon={Wrench}
              own
              name={t.name}
              meta={t.learned_from ? `Your own · from ${t.learned_from}` : "Your own"}
              sub={toolLine(t)}
            />
          ))}
        </>
      )}

      <Button variant="secondary" size="sm" icon={Plus} className="w-full mt-2" onClick={onAddOwn}>
        Add a tool of your own
      </Button>
    </div>
  );
}

function Explore() {
  const { heldArcana, addArcanum } = useAppData();
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState("");

  async function add(slug) {
    setAdding(slug);
    setError("");
    try {
      await addArcanum(slug);
    } catch (e) {
      console.error("[YOUniversity] add Arcanum failed:", e);
      setError("Couldn't add that just now. Check your connection and try again.");
    }
    setAdding(null);
  }

  return (
    <div>
      {error && <div role="alert" className="text-bodySm text-red-500 mb-3">{error}</div>}
      {ARCANA.map(a => {
        const held = heldArcana.some(h => h.slug === a.slug);
        return (
          <motion.div key={a.slug} {...riseIn} className="rounded-card bg-surface1 shadow-card p-4 mb-3">
            <Link to={`/youniversity/arcanum/${a.slug}`} className="flex items-start gap-3">
              <ArcanumIcon icon={a.icon} />
              <div className="flex-1 min-w-0">
                <div className="font-serif text-h3 text-textPrimary">{a.name}</div>
                <div className="text-caption text-textMuted mb-1">{FORMATS[a.format]} · {a.free ? "Free" : a.comingSoon ? "Coming soon" : "Paid"}</div>
                <div className="text-bodySm text-textSecondary">{a.tagline}</div>
              </div>
            </Link>
            <div className="mt-3 flex justify-end">
              {held ? (
                <Link to={`/youniversity/arcanum/${a.slug}`} className="inline-flex items-center gap-1.5 text-bodySm text-forestAccent font-medium px-2 py-2">
                  <Check size={16} strokeWidth={2} /> In your Library
                </Link>
              ) : !a.free ? (
                <Link to={`/youniversity/arcanum/${a.slug}`} className="inline-flex items-center gap-1.5 text-bodySm text-textSecondary border border-borderC rounded-full px-3.5 py-1.5">
                  <Clock size={14} strokeWidth={1.75} /> Coming soon
                </Link>
              ) : (
                <Button size="sm" icon={Plus} disabled={adding === a.slug} onClick={() => add(a.slug)}>
                  {adding === a.slug ? "Adding…" : "Add to Library"}
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
      <div className="text-bodySm text-textMuted text-center mt-5 px-4">More Arcana are being written.</div>
      <div className="mt-4 flex justify-center"><GiftCode /></div>
    </div>
  );
}

// YOUniversity: the learning and toolkit side of YOU. Library holds what the
// Seeker has (Arcana and their own tools); Explore is where Arcana are found.
export default function YOUniversity() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "explore" ? "explore" : "library";
  const [addOpen, setAddOpen] = useState(false);
  const setTab = t => setParams(t === "library" ? {} : { tab: t }, { replace: true });

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0">YOUniversity</h1>
      <div className="text-bodySm text-textSecondary mt-2 mb-4">
        Your Arcana: the tools and teachings you carry, to return to whenever you need them.
      </div>
      <div className="mb-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === "explore" ? <Explore /> : <Library onAddOwn={() => setAddOpen(true)} onExplore={() => setTab("explore")} />}
      <OwnToolModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
