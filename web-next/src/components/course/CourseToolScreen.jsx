import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Trash2, Sparkles, Lock } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getArcanum } from "../../constants/arcana";
import { useCourse, courseState, summarize } from "../../lib/course";
import { niceDate } from "../../lib/arcana";
import { BackRow } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ArcanumIcon } from "../youniversity/YOUniversity";

function Summary({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map(({ label, lines }) => (
        <div key={label}>
          <div className="text-caption text-textMuted">{label}</div>
          {lines.map((l, i) => <div key={i} className="text-bodySm text-textPrimary whitespace-pre-wrap">{l}</div>)}
        </div>
      ))}
    </div>
  );
}

function UseCard({ use, tool, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const items = summarize(tool.steps, use.data);
  const preview = items[0]?.lines[0];
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center gap-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="text-body text-textPrimary">{niceDate(use.used_on)}</div>
          {preview && !open && <div className="text-caption text-textMuted truncate">{preview}</div>}
        </div>
        <ChevronDown size={16} strokeWidth={1.75} className={`text-textMuted flex-none transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pt-3">
          {items.length ? <Summary items={items} /> : <div className="text-bodySm text-textMuted">Used without writing anything.</div>}
          <div className="flex gap-2.5 mt-4">
            {confirm ? (
              <>
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirm(false)}>Keep it</Button>
                <Button variant="secondary" size="sm" className="flex-1" onClick={onDelete}>Yes, let it go</Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" icon={Trash2} className="flex-1" onClick={() => setConfirm(true)}>Let this one go</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// A tool a course gave the Seeker: use it again, and every past use.
export default function CourseToolScreen() {
  const { slug, toolId } = useParams();
  const navigate = useNavigate();
  const { arcanaLoaded: loaded, heldArcana, courseProgress, toolUses, deleteToolUse, walkFor } = useAppData();
  const arcanum = getArcanum(slug);
  const course = useCourse(arcanum);
  const state = useMemo(() => (course ? courseState(course, slug, courseProgress, walkFor(slug)) : null), [course, slug, courseProgress]); // eslint-disable-line react-hooks/exhaustive-deps
  const uses = toolUses.filter(u => u.slug === slug && u.tool_id === toolId);
  const tool = course?.tools[toolId];
  const stage = course?.stages.find(s => s.practice.tool === toolId);

  if (!loaded || !course) return <div className="pt-1 pb-24 px-5"><BackRow /><div className="text-body text-textSecondary mt-4">Loading…</div></div>;
  const unlocked = heldArcana.some(h => h.slug === slug) && state.unlockedTools.includes(toolId);
  if (!tool || !unlocked) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={Lock} title="Not unlocked yet" description={tool ? `${tool.name} joins your Library when you reach it on the path.` : "This tool couldn't be found."} />
      </div>
    );
  }

  const latest = tool.showLatest && uses[0]?.data?.[tool.showLatest]?.filter(Boolean);

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex items-start gap-3 mt-4 mb-3">
        <ArcanumIcon icon={tool.icon} />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-h2 font-medium m-0">{tool.name}</h1>
          <Link to={`/youniversity/arcanum/${slug}`} className="text-caption text-textMuted hover:text-textPrimary">
            Tool · from {arcanum.name}{stage ? `, Stage ${stage.numeral}` : ""}
          </Link>
        </div>
      </div>
      <div className="text-body text-textSecondary mb-5">{tool.about}</div>

      {latest?.length > 0 && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-5">
          <div className="text-label uppercase text-gold mb-2">Yours now</div>
          <ol className="space-y-1.5 m-0 pl-0 list-none">
            {latest.map((c, i) => (
              <li key={i} className="flex gap-2.5 font-serif text-[17px] leading-snug text-textPrimary">
                <span className="text-gold">{i + 1}</span>{c}
              </li>
            ))}
          </ol>
        </div>
      )}

      <Button className="w-full mb-1" icon={Sparkles} onClick={() => navigate(`/learn/${slug}/tool/${toolId}`)}>
        {latest?.length ? "Rewrite it" : "Use it now"}
      </Button>
      <div className="text-caption text-textMuted text-center mb-6">
        {uses.length ? `Used ${uses.length} time${uses.length === 1 ? "" : "s"} · last ${niceDate(uses[0].used_on)}` : "Not used yet"}
      </div>

      <div className="text-label uppercase text-gold mb-2">Every time you've used it</div>
      {uses.length ? (
        uses.map(u => <UseCard key={u.id} use={u} tool={tool} onDelete={() => deleteToolUse(u.id).catch(e => console.error("[CourseTool] delete failed:", e))} />)
      ) : (
        <div className="text-bodySm text-textMuted">Nothing yet. Each time you use it, it's kept here, privately.</div>
      )}
    </div>
  );
}
