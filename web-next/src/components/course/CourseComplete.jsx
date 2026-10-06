import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { riseIn } from "../ui/motion";
import { GlowBubble } from "../ui/GlowBubble";
import { niceDate } from "../../lib/arcana";
import { useAppData } from "../../lib/AppDataContext";

// Before → after for one statement, as two rows of dots. The words say it
// too, so it never relies on colour alone.
function Dots({ n, of, tone }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < n ? tone : "border border-borderC"}`} />
      ))}
    </span>
  );
}

export function WhatChanged({ course, before = {}, after = {} }) {
  const scale = course.checkIn.scale;
  return (
    <div className="space-y-2.5">
      {course.checkIn.statements.map(st => {
        const b = before[st.key];
        const a = after[st.key];
        if (!b || !a) return null;
        const moved = a > b ? "Grew" : a < b ? "Shifted" : "Held steady";
        return (
          <div key={st.key} className="rounded-sm bg-surface1 p-3.5">
            <div className="text-bodySm text-textPrimary mb-2">{st.text}</div>
            <div className="grid grid-cols-[52px_1fr_auto] items-center gap-x-2 gap-y-1 text-caption text-textMuted">
              <span>Before</span><Dots n={b} of={scale.length} tone="bg-textMuted" /><span>{scale[b - 1]}</span>
              <span>Now</span><Dots n={a} of={scale.length} tone="bg-gold" /><span className="text-textPrimary">{scale[a - 1]}</span>
            </div>
            <div className={`text-caption mt-1.5 ${a > b ? "text-forestAccent font-medium" : "text-textMuted"}`}>{moved}</div>
          </div>
        );
      })}
    </div>
  );
}

// The close of a course: what changed, the tools kept, and their own words.
export default function CourseComplete({ arcanum, course, state, rows, compact = false }) {
  const { toolUses } = useAppData();
  const byId = Object.fromEntries(rows.map(r => [r.part_id, r]));
  const before = byId[course.opening.id]?.data?.scores;
  const after = byId[course.closing.id]?.data?.scores;
  const note = byId[course.closing.id]?.data?.note;
  // The latest Sovereignty Code (or whichever tool keeps its latest words).
  const keeper = Object.entries(course.tools).find(([, t]) => t.showLatest);
  const latest = keeper && toolUses.find(u => u.slug === arcanum.slug && u.tool_id === keeper[0]);
  const code = (latest?.data?.[keeper[1].showLatest] || []).filter(Boolean);

  return (
    <motion.div {...riseIn}>
      {!compact && (
        <div className="flex flex-col items-center text-center mb-6">
          <GlowBubble icon={arcanum.icon} size={84} className="mb-5" />
          <h2 className="font-serif text-hero text-textPrimary m-0">{course.completion.title}</h2>
          <p className="font-serif italic text-[17px] text-textSecondary mt-3 mb-0 max-w-[420px]">{course.completion.line}</p>
          {state.completedOn && <div className="text-caption text-textMuted mt-3">Completed {niceDate(state.completedOn)}</div>}
        </div>
      )}

      {before && after && (
        <div className="mb-6">
          <div className="text-label uppercase text-gold mb-2">What changed</div>
          <WhatChanged course={course} before={before} after={after} />
          {note && <div className="font-serif italic text-body text-textPrimary mt-3">"{note}"</div>}
        </div>
      )}

      {code?.length > 0 && (
        <div className="rounded-card bg-surface1 shadow-card p-4 mb-6">
          <div className="text-label uppercase text-gold mb-2">{keeper[1].name}</div>
          <ol className="space-y-1.5 m-0 pl-0 list-none">
            {code.map((c, i) => (
              <li key={i} className="flex gap-2.5 font-serif text-[17px] leading-snug text-textPrimary">
                <span className="text-gold">{i + 1}</span>{c}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-2">
        <div className="text-label uppercase text-gold mb-2">Tools you keep</div>
        <div className="flex flex-wrap gap-2">
          {state.unlockedTools.map(id => {
            const t = course.tools[id];
            const Icon = t.icon;
            return (
              <Link key={id} to={`/youniversity/arcanum/${arcanum.slug}/tool/${id}`} className="inline-flex items-center gap-1.5 text-bodySm text-textPrimary bg-surface1 border border-borderC rounded-full px-3 py-1.5 hover:border-forestAccent">
                <Icon size={14} strokeWidth={1.75} className="text-gold" /> {t.name}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
