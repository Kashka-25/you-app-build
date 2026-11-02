import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { useHemisphere } from "../../lib/seasons";
import { currentChapter, XP_PER_COIN } from "../../lib/rpg";
import { PILLAR_COLORS, VALUE_PILLAR, XP_VALS } from "../../constants/app.const";
import HabitsToday from "../home/HabitsToday";

// The quest log: nothing new to keep track of, just what's already in YOU
// seen as quests. Habits are daily rituals (ticked right here, the same
// check-in as Home and PursYOUts), goals are side quests, dreams the main
// quests, and a value's challenges are its Trials. The season is the
// chapter, and its Season review is how the chapter ends.
export default function RpgQuests({ onOpenValues }) {
  const { items, valueChallenges, activeValues, completeValueChallenge } = useAppData();
  const { hemisphere } = useHemisphere();
  const chapter = currentChapter(hemisphere);
  const goals = items.filter(i => i.type === "goal" && !i.done);
  const dreams = items.filter(i => i.type === "dream" && !i.done);
  const held = new Set(activeValues.map(v => v.name));
  const trials = valueChallenges.filter(c => !c.completed && held.has(c.value_name)).slice(0, 6);
  const hasHabits = items.some(i => i.type === "habit" && !i.done);

  return (
    <div className="space-y-4">
      <div
        className="realm-frame gem p-4"
        style={{ background: "linear-gradient(135deg, rgba(221,183,106,.22), rgba(42,26,60,.95))" }}
      >
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-textMuted font-semibold">This chapter</div>
        <div className="realm-title text-[30px] leading-tight">{chapter.season}</div>
        <p className="text-bodySm text-textSecondary mt-1">
          Each season is a chapter of your story. This one closes on {chapter.endsOn}, and your Season review is its last page.
        </p>
      </div>

      <Group title="Daily rituals" sub="your habits, renewed each morning">
        {hasHabits ? <HabitsToday /> : <Empty to="/pursue" text="No habits yet. Start one in PursYOUts." />}
      </Group>

      <Group title="Main quests" sub="your dreams">
        {dreams.length ? dreams.map(d => {
          const steps = d.milestones || [];
          const done = steps.filter(m => m.done).length;
          return <QuestRow key={d.id} name={d.name} pillar={d.cat} xp={XP_VALS.dream} extra={steps.length ? `${done} of ${steps.length} steps` : null} />;
        }) : <Empty to="/pursue" text="No dream yet. Name one in PursYOUts." />}
      </Group>

      <Group title="Side quests" sub="your goals">
        {goals.length ? goals.map(g => <QuestRow key={g.id} name={g.name} pillar={g.cat} xp={XP_VALS.goal} />)
          : <Empty to="/pursue" text="No goals right now. Add one in PursYOUts." />}
      </Group>

      <Group title="Trials" sub="from your values">
        {trials.length ? trials.map(c => (
          <div key={c.id} className="flex items-center gap-3 py-1.5">
            <button
              type="button"
              onClick={() => completeValueChallenge(c.id).catch(e => console.error("[RpgQuests] trial failed:", e))}
              aria-label={`Complete: ${c.text}`}
              className="w-6 h-6 flex-none rounded-full border border-borderC hover:border-gold"
            />
            <div className="flex-1 min-w-0">
              <div className="text-body text-textPrimary leading-snug">{c.text}</div>
              <div className="text-caption text-textMuted">
                {c.value_name}{VALUE_PILLAR[c.value_name] ? ` · ${VALUE_PILLAR[c.value_name]}` : ""}
              </div>
            </div>
            <span className="flex-none text-[11px] font-medium text-gold">+{c.pts}</span>
          </div>
        )) : (
          <button type="button" onClick={onOpenValues} className="w-full flex items-center justify-between text-bodySm text-textSecondary py-2">
            No Trials waiting. Open a value to draw some.
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </Group>
    </div>
  );
}

function Group({ title, sub, children }) {
  return (
    <div className="realm-frame p-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="realm-title text-[20px] text-textPrimary">{title}</div>
        <div className="text-caption text-textMuted">{sub}</div>
      </div>
      {children}
    </div>
  );
}

// Goals and dreams are finished in PursYOUts, where their reflection lives.
function QuestRow({ name, pillar, xp, extra }) {
  return (
    <Link to="/pursue" className="flex items-center gap-3 py-1.5 min-h-[44px]">
      <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: PILLAR_COLORS[pillar] || "var(--gold)" }} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block text-body text-textPrimary truncate">{name}</span>
        <span className="block text-caption text-textMuted">{pillar || "No Pillar"}{extra ? ` · ${extra}` : ""}</span>
      </span>
      <span className="flex-none text-right text-[11px] font-medium text-gold leading-tight">+{xp} XP<br /><span className="inline-flex items-center gap-1"><i className="realm-coin" style={{ width: 11, height: 11 }} />{Math.floor(xp / XP_PER_COIN)}</span></span>
      <ChevronRight size={16} className="flex-none text-textMuted" aria-hidden="true" />
    </Link>
  );
}

function Empty({ to, text }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-bodySm text-textSecondary py-2">
      <Plus size={15} aria-hidden="true" />{text}
    </Link>
  );
}
