import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Footprints, Sparkles, Moon, ChevronRight, Wrench } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { ARCANA } from "../../constants/arcana";
import { useCourses, courseState, opensLine, PART_LABEL } from "../../lib/course";

// The courses a Seeker is walking, brought into their day: what's ready,
// what they're carrying, what's resting. And the tools they've kept, for
// the moments they need them.
export function useCourseNow() {
  const { heldArcana, courseProgress, toolUses, ownTools, walkFor, courseWalks } = useAppData();
  const held = useMemo(
    () => heldArcana.map(h => ARCANA.find(a => a.slug === h.slug)).filter(a => a?.format === "course"),
    [heldArcana]
  );
  const courses = useCourses(held);

  return useMemo(() => {
    const entries = [];
    const tools = [];
    held.forEach(arcanum => {
      const course = courses[arcanum.slug];
      if (!course) return;
      const state = courseState(course, arcanum.slug, courseProgress, walkFor(arcanum.slug));
      state.unlockedTools.forEach(id => {
        const lastUse = toolUses.find(u => u.slug === arcanum.slug && u.tool_id === id);
        tools.push({ key: `${arcanum.slug}:${id}`, tool: course.tools[id], to: `/learn/${arcanum.slug}/tool/${id}`, page: `/youniversity/arcanum/${arcanum.slug}/tool/${id}`, quick: !!course.tools[id].quick, lastAt: lastUse?.created_at || null });
      });
      if (state.complete || !state.next) return;
      // A week or more away: a gentle welcome back instead of a status.
      const away = state.lastAt && Date.now() - new Date(state.lastAt).getTime() >= 7 * 86400000;
      const n = state.next;
      const p = n.part;
      const coursePage = `/youniversity/arcanum/${arcanum.slug}`;
      if (n.status === "resting") {
        entries.push({ key: arcanum.slug, kind: "resting", icon: Moon, label: `${arcanum.name} · resting`, title: p.kind === "checkin" ? p.title : `${p.stage.name} opens ${opensLine(n.opensOn)}`, to: coursePage, arcanum });
      } else if (p.kind === "challenge") {
        entries.push({ key: arcanum.slug, kind: "carrying", icon: Footprints, label: away ? `Welcome back · ${arcanum.name}` : `Carrying · ${p.stage.name}`, title: p.title, to: away ? coursePage : `/learn/${arcanum.slug}/${p.id}`, arcanum });
      } else {
        entries.push({
          key: arcanum.slug, kind: "ready", icon: Sparkles,
          label: away ? `Welcome back · ${arcanum.name}` : `${arcanum.name} · ready for you`,
          title: p.kind === "checkin" ? p.title : `${p.stage.name} · ${PART_LABEL[p.kind]}`,
          // Away a while: the course page first, where the recap is.
          to: away ? coursePage : `/learn/${arcanum.slug}/${p.id}`, arcanum
        });
      }
    });
    // Hard-moment tools first, then the most recently used.
    tools.sort((a, b) => (b.quick - a.quick) || String(b.lastAt || "").localeCompare(String(a.lastAt || "")));
    const own = ownTools.map(t => ({ key: `own:${t.id}`, tool: { name: t.name, icon: Wrench, about: t.purpose || "" }, to: `/youniversity/tool/${t.id}`, page: `/youniversity/tool/${t.id}`, own: true }));
    return { entries, tools: [...tools, ...own] };
  }, [held, courses, courseProgress, toolUses, ownTools, courseWalks]); // eslint-disable-line react-hooks/exhaustive-deps
}

// One line per course in the Home "Today" card.
export function CourseNowRows({ divided = true }) {
  const { entries } = useCourseNow();
  if (!entries.length) return null;
  return (
    <div className={divided ? "mt-3 pt-3 border-t border-borderC space-y-2.5" : "space-y-2.5"}>
      {entries.map(e => {
        const Icon = e.icon;
        return (
          <Link key={e.key} to={e.to} className="flex items-center gap-2.5 text-bodySm">
            <Icon size={16} strokeWidth={1.75} className={e.kind === "resting" ? "text-textMuted flex-none" : "text-gold flex-none"} />
            <span className="flex-1 min-w-0">
              <span className="block text-caption text-textMuted">{e.label}</span>
              <span className={`block ${e.kind === "resting" ? "text-textSecondary" : "text-textPrimary"}`}>{e.title}</span>
            </span>
            <ChevronRight size={16} strokeWidth={1.75} className="text-textMuted flex-none" />
          </Link>
        );
      })}
    </div>
  );
}

// The Threshold's gentler version: a card per course that needs you today
// (resting courses stay quiet there).
export function CourseNowCards() {
  const { entries } = useCourseNow();
  const shown = entries.filter(e => e.kind !== "resting");
  if (!shown.length) return null;
  return (
    <section>
      <h2 className="font-serif text-h2 text-textPrimary mb-2.5">On your path</h2>
      <div className="space-y-3">
        {shown.map(e => {
          const Icon = e.icon;
          return (
            <Link key={e.key} to={e.to} className="flex items-center gap-3 rounded-card bg-surface1 shadow-card p-4">
              <Icon size={20} strokeWidth={1.75} className="text-gold flex-none" />
              <div className="flex-1 min-w-0">
                <div className="text-body text-textPrimary">{e.title}</div>
                <div className="text-caption text-textSecondary mt-0.5">
                  {e.kind === "carrying" ? `Your challenge from ${e.arcanum.name}. Lived it? Tap to mark it.` : e.label}
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// Bring Me Back to Myself: the tools a Seeker carries, ready in one tap.
export function ToolsToHand() {
  const { tools } = useCourseNow();
  if (!tools.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tools.slice(0, 6).map(t => {
        const Icon = t.tool.icon;
        return (
          <Link
            key={t.key}
            to={t.to}
            className={`inline-flex items-center gap-2 text-body px-3.5 py-2.5 rounded-full border transition-colors ${
              t.quick ? "bg-surface1 border-gold text-textPrimary" : "bg-surface1 border-borderC text-textPrimary hover:border-gold"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} className="text-gold" />
            {t.tool.name}
          </Link>
        );
      })}
    </div>
  );
}
