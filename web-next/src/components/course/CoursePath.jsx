import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Footprints, Check, Moon, Sprout, Lock, ArrowRight, Plus } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { courseState, opensLine, daysOnPath, partMinutes, PART_LABEL } from "../../lib/course";
import { niceDate } from "../../lib/arcana";
import { isCodexValue } from "../../lib/valueWords";
import { riseIn } from "../ui/motion";
import CourseHero from "./CourseHero";
import CourseComplete from "./CourseComplete";
import RestPrompt from "./RestPrompt";

const KIND_ICON = { checkin: Sprout, lesson: BookOpen, practice: Sparkles, challenge: Footprints };
const two = i => String(i + 1).padStart(2, "0");

function SectionHead({ eyebrow, title, sub, dark = false }) {
  return (
    <div className="mb-4">
      <div className={`text-label uppercase tracking-[0.16em] mb-1 ${dark ? "text-[#D8C38F]" : "text-gold"}`}>{eyebrow}</div>
      <h2 className={`font-serif text-[26px] leading-tight font-medium m-0 ${dark ? "text-white" : "text-textPrimary"}`}>{title}</h2>
      {sub && <p className={`text-bodySm mt-1.5 mb-0 ${dark ? "text-white/65" : "text-textSecondary"}`}>{sub}</p>}
    </div>
  );
}

// ── Stats ──
function Stat({ big, small }) {
  return (
    <div className="rounded-card bg-surface1 border border-borderC px-4 py-3.5">
      <div className="font-serif text-[26px] leading-none text-textPrimary">{big}</div>
      <div className="text-caption text-textMuted mt-1">{small}</div>
    </div>
  );
}

// ── One part, in a stage's list ──
function statusText(s) {
  if (s.status === "done") return `Done · ${niceDate(s.row.completed_on)}`;
  if (s.status === "open") return "Ready for you";
  if (s.status === "resting") return `Resting · opens ${opensLine(s.opensOn)}`;
  return "Later on the path";
}

function PartRow({ s, slug }) {
  const Icon = KIND_ICON[s.part.kind];
  const to = s.status === "open"
    ? `/learn/${slug}/${s.part.id}`
    : s.status === "done" && s.part.kind === "practice" ? `/youniversity/arcanum/${slug}/tool/${s.part.toolId}` : null;
  const label = s.part.kind === "checkin" ? s.part.title : `${PART_LABEL[s.part.kind]} · ${s.part.title}`;
  const inner = (
    <>
      <span className={`w-9 h-9 flex-none rounded-full flex items-center justify-center ${
        s.status === "done" ? "bg-surface3 text-gold" : s.status === "open" ? "bg-forestAccent text-onAccent" : "bg-surface2 border border-borderC text-textMuted"
      }`}>
        {s.status === "done" ? <Check size={16} strokeWidth={2.25} /> : s.status === "resting" ? <Moon size={15} strokeWidth={1.75} /> : s.status === "locked" ? <Lock size={14} strokeWidth={1.75} /> : <Icon size={16} strokeWidth={1.75} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-body ${s.status === "locked" ? "text-textMuted" : "text-textPrimary"}`}>{label}</span>
        <span className={`block text-caption ${s.status === "open" ? "text-forestAccent font-medium" : "text-textMuted"}`}>{statusText(s)}</span>
      </span>
      {to && <ArrowRight size={16} strokeWidth={1.75} className="text-textMuted flex-none" />}
    </>
  );
  return to
    ? <Link to={to} className="flex items-center gap-3 py-2.5 rounded-sm hover:bg-surface3/50 -mx-2 px-2">{inner}</Link>
    : <div className="flex items-center gap-3 py-2.5 -mx-2 px-2">{inner}</div>;
}

// ── Today: the next thing on the path ──
function Today({ arcanum, course, state, onRest }) {
  const navigate = useNavigate();
  const { next } = state;
  if (!next) return null;
  const go = () => navigate(`/learn/${arcanum.slug}/${next.part.id}`);
  const p = next.part;

  if (next.status === "resting") {
    return (
      <motion.div {...riseIn} className="rounded-card bg-surface1 shadow-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <Moon size={15} strokeWidth={1.75} className="text-gold" />
          <span className="text-label uppercase tracking-[0.12em] text-gold">Resting</span>
        </div>
        <div className="font-serif text-[22px] leading-snug text-textPrimary">Live with what you've found.</div>
        <div className="text-bodySm text-textSecondary mt-1.5">
          Next: {p.kind === "checkin" ? p.title : `${p.stage.name} · ${PART_LABEL[p.kind]}`}, opens {opensLine(next.opensOn)}.
        </div>
        <button onClick={onRest} className="mt-4 text-bodySm text-textSecondary underline underline-offset-4 decoration-borderC hover:text-textPrimary">
          Feel ready? Continue now
        </button>
      </motion.div>
    );
  }

  if (p.kind === "challenge") {
    const ch = p.stage.challenge;
    return (
      <motion.div {...riseIn} className="rounded-card bg-surface1 shadow-card p-5">
        <span className="inline-block text-label uppercase tracking-[0.1em] bg-surface3 text-forestAccent rounded-full px-2.5 py-1 mb-3">Your challenge · {p.stage.name}</span>
        <div className="font-serif text-[24px] leading-snug text-textPrimary">{ch.title}</div>
        <p className="font-serif italic text-[17px] leading-relaxed text-textPrimary mt-2 mb-0">{ch.body.split("\n\n")[0]}</p>
        <button onClick={go} className="w-full mt-5 min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest">
          I've lived it
        </button>
        <div className="text-caption text-textMuted text-center mt-2">No hurry. Carry it with you; it waits here.</div>
      </motion.div>
    );
  }

  const minutes = partMinutes(p);
  const Icon = p.kind === "practice" ? course.tools[p.toolId].icon : KIND_ICON[p.kind];
  return (
    <motion.div {...riseIn} className="rounded-card bg-surface1 shadow-card p-5">
      <span className="inline-block text-label uppercase tracking-[0.1em] bg-surface3 text-forestAccent rounded-full px-2.5 py-1 mb-3">
        {minutes} minute {p.kind === "checkin" ? "check-in" : PART_LABEL[p.kind].toLowerCase()}
      </span>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 flex-none rounded-full bg-surface3 text-gold flex items-center justify-center"><Icon size={20} strokeWidth={1.75} /></span>
        <div className="min-w-0">
          <div className="font-serif text-[24px] leading-snug text-textPrimary">
            {p.kind === "practice" ? p.title : p.kind === "checkin" ? p.title : p.stage.name}
          </div>
          <div className="text-bodySm text-textSecondary mt-0.5">
            {p.kind === "practice" ? course.tools[p.toolId].about : p.kind === "checkin" ? (p.closing ? "The same nine statements, to see what changed." : "Where you are now, before you begin.") : p.title}
          </div>
        </div>
      </div>
      <button onClick={go} className="w-full mt-5 min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest flex items-center justify-center gap-2">
        {state.done ? "Continue" : "Begin"} <ArrowRight size={17} strokeWidth={1.75} />
      </button>
    </motion.div>
  );
}

// ── The stage map: seven doors ──
function StageMap({ course, state, selected, onSelect }) {
  const row = useRef(null);
  useEffect(() => {
    const r = row.current;
    const el = r?.querySelector('[aria-current="true"]');
    if (!el) return;
    // Bring the chosen stage into view within the row only (never the page).
    const left = r.scrollLeft + el.getBoundingClientRect().left - r.getBoundingClientRect().left - 20;
    r.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [selected]);
  return (
    <div ref={row} className="flex gap-2.5 overflow-x-auto snap-x scroll-px-5 pt-2 pb-3 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Stages">
      {course.stages.map((stage, i) => {
        const parts = state.states.filter(s => s.part.stageIndex === i);
        const done = parts.every(s => s.status === "done");
        const current = !state.complete && state.currentStage === i;
        const on = selected === i;
        const Icon = course.tools[stage.practice.tool].icon;
        return (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={on}
            aria-current={on}
            onClick={() => onSelect(i)}
            className={`snap-start flex-none w-[128px] text-left rounded-card border p-3.5 transition-all duration-200 ${
              on ? "bg-surface1 border-gold shadow-card -translate-y-1" : "bg-surface2 border-borderC hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-gold">{two(i)}</span>
              {done ? (
                <span className="w-5 h-5 rounded-full bg-gold text-[#1A1F1D] flex items-center justify-center" aria-label="Done"><Check size={12} strokeWidth={3} /></span>
              ) : current ? (
                <span className="text-[10px] uppercase tracking-wide text-forestAccent font-semibold">Now</span>
              ) : null}
            </div>
            <Icon size={22} strokeWidth={1.5} className={`my-2.5 ${done || current ? "text-forestAccent" : "text-textMuted"}`} />
            <div className={`font-serif text-[17px] leading-tight ${done || current ? "text-textPrimary" : "text-textSecondary"}`}>{stage.name.replace(/^The /, "")}</div>
            <div className="text-caption text-textMuted mt-1 leading-snug">{stage.short}</div>
          </button>
        );
      })}
    </div>
  );
}

function StagePanel({ course, state, index, slug }) {
  const stage = course.stages[index];
  const parts = state.states.filter(s => s.part.stageIndex === index);
  const opening = state.states[0];
  const closing = state.states[state.states.length - 1];
  return (
    <motion.div key={stage.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-card bg-surface1 border border-borderC p-4 mt-1">
      <div className="text-label uppercase tracking-[0.12em] text-gold mb-0.5">Stage {stage.numeral}</div>
      <div className="font-serif text-[22px] text-textPrimary">{stage.name}</div>
      <div className="font-serif italic text-body text-textSecondary mb-2">{stage.question}</div>
      {index === 0 && <PartRow s={opening} slug={slug} />}
      {parts.map(s => <PartRow key={s.part.id} s={s} slug={slug} />)}
      {index === course.stages.length - 1 && <PartRow s={closing} slug={slug} />}
    </motion.div>
  );
}

// ── What you've gained: the tools, kept or still to come ──
function Gained({ arcanum, course, state }) {
  const { toolUses } = useAppData();
  return (
    <div className="rounded-card p-5 -mx-1" style={{ background: "#22332B" }}>
      <SectionHead dark eyebrow="Your Library" title="What you've gained" sub="These tools stay with you after the course ends. Return to them whenever you need them." />
      <div className="grid grid-cols-2 gap-2.5">
        {course.stages.map(stage => {
          const id = stage.practice.tool;
          const tool = course.tools[id];
          const Icon = tool.icon;
          const kept = state.unlockedTools.includes(id);
          const uses = toolUses.filter(u => u.slug === arcanum.slug && u.tool_id === id).length;
          const body = (
            <>
              <Icon size={20} strokeWidth={1.5} className={kept ? "text-[#D8C38F]" : "text-white/40"} />
              <div className={`font-serif text-[17px] leading-tight mt-2 ${kept ? "text-white" : "text-white/55"}`}>{tool.name}</div>
              <div className="text-caption text-white/55 mt-1 line-clamp-2">{tool.about}</div>
              <div className={`text-caption mt-2 flex items-center gap-1 ${kept ? "text-[#D8C38F]" : "text-white/40"}`}>
                {kept ? (uses ? `Used ${uses} time${uses === 1 ? "" : "s"}` : "Ready to use") : <><Lock size={11} strokeWidth={2} /> Stage {stage.numeral}</>}
              </div>
            </>
          );
          return kept ? (
            <Link key={id} to={`/youniversity/arcanum/${arcanum.slug}/tool/${id}`} className="rounded-[16px] p-3.5 border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] transition-colors">{body}</Link>
          ) : (
            <div key={id} className="rounded-[16px] p-3.5 border border-white/10 bg-white/[0.03]">{body}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Values honoured on the path ──
function Honoured({ rows }) {
  const { values, activeValues, valueSlots, addOwnValue } = useAppData();
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");
  const counts = {};
  rows.forEach(r => {
    const names = Array.isArray(r.data?.values) ? r.data.values : r.value_name ? [r.value_name] : [];
    names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  });
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const held = name => values.some(v => v.name.toLowerCase() === name.toLowerCase());
  // Words honoured that aren't among the Seeker's values yet.
  const waiting = list.filter(([name]) => !held(name));
  const room = activeValues.length < valueSlots;

  async function make(name) {
    setBusy(name);
    setNote("");
    try {
      await addOwnValue(name);
      setNote(`${name} is one of your values now. Future challenges can grow it.`);
    } catch (e) {
      console.error("[Honoured] add value failed:", e);
      setNote("Couldn't add it just now. Try again in a moment.");
    }
    setBusy(null);
  }

  return (
    <div>
      <SectionHead eyebrow="Your values" title="What you're protecting" sub="The values your challenges have honoured. Living them grows the ones you hold." />
      {list.length ? (
        <div className="flex flex-wrap gap-2">
          {list.map(([name, n]) => (
            <span key={name} className="inline-flex items-center gap-1.5 text-body px-3.5 py-2 rounded-full bg-surface1 border" style={{ borderColor: held(name) ? "var(--gold)" : "var(--border)" }}>
              {name}
              {!isCodexValue(name) && <span className="text-caption text-textMuted">your word</span>}
              <span className="text-caption text-gold font-semibold">×{n}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-bodySm text-textMuted">When you live a challenge, choose the values it honoured. They'll gather here.</div>
      )}
      {waiting.length > 0 && (
        <div className="rounded-card bg-surface1 border border-borderC p-4 mt-4">
          <div className="text-bodySm text-textPrimary mb-3">
            {waiting.length === 1 ? `You've honoured ${waiting[0][0]}, which isn't one of your values yet.` : "You've honoured some values that aren't yours yet."} Would you like to make {waiting.length === 1 ? "it" : "any of them"} one of your values?
          </div>
          <div className="flex flex-wrap gap-2">
            {waiting.map(([name]) => (
              <button
                key={name}
                type="button"
                disabled={!room || busy === name}
                onClick={() => make(name)}
                className="inline-flex items-center gap-1.5 text-bodySm px-3.5 py-2 rounded-full border border-dashed border-gold text-textPrimary hover:bg-surface2 disabled:opacity-50"
              >
                <Plus size={14} strokeWidth={1.75} /> {busy === name ? "Adding…" : `Make ${name} mine`}
              </button>
            ))}
          </div>
          {!room && <div className="text-caption text-textMuted mt-2">All your places for focus are in use. Rest a value in the YOU tab to make room.</div>}
        </div>
      )}
      {note && <div role="status" className="text-bodySm text-forestAccent mt-3">{note}</div>}
    </div>
  );
}

// ── The Sovereignty Code (or whichever tool keeps its latest words) ──
export function KeptWords({ arcanum, course }) {
  const { toolUses } = useAppData();
  const keeper = Object.entries(course.tools).find(([, t]) => t.showLatest);
  if (!keeper) return null;
  const [id, tool] = keeper;
  const latest = toolUses.find(u => u.slug === arcanum.slug && u.tool_id === id);
  const lines = (latest?.data?.[tool.showLatest] || []).filter(Boolean);
  if (!lines.length) return null;
  return (
    <div>
      <SectionHead eyebrow="Your integration" title={tool.name} sub={`Written ${niceDate(latest.used_on)}. Yours to return to, and to rewrite.`} />
      <Link to={`/youniversity/arcanum/${arcanum.slug}/tool/${id}`} className="block rounded-card bg-surface1 border border-borderC px-5 py-2 hover:border-gold">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3 py-3.5 border-b border-borderC last:border-b-0 font-serif text-[18px] leading-snug text-textPrimary">
            <span className="text-gold flex-none">{two(i)}</span>{l}
          </div>
        ))}
      </Link>
    </div>
  );
}

// A course Arcanum the Seeker holds.
export default function CoursePath({ arcanum, course }) {
  const navigate = useNavigate();
  const { courseProgress } = useAppData();
  const state = useMemo(() => courseState(course, arcanum.slug, courseProgress), [course, arcanum.slug, courseProgress]);
  const rows = courseProgress.filter(r => r.slug === arcanum.slug);
  const [selected, setSelected] = useState(state.currentStage);
  const [restOpen, setRestOpen] = useState(false);
  const mapRef = useRef(null);
  useEffect(() => { setSelected(state.currentStage); }, [state.currentStage]);

  const { next } = state;
  const stageNow = course.stages[state.currentStage];
  const last = course.stages[course.stages.length - 1].numeral;

  return (
    <div>
      <CourseHero arcanum={arcanum} eyebrow={`YOUniversity · ${state.complete ? "Completed" : "Your course"}`}>
        <div className="flex gap-2.5">
          {next && (
            <button
              onClick={() => (next.status === "open" ? navigate(`/learn/${arcanum.slug}/${next.part.id}`) : setRestOpen(true))}
              className="flex-1 min-h-[48px] rounded-full bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest flex items-center justify-center gap-2"
            >
              {next.status === "resting" ? "Resting" : state.done ? "Continue" : "Begin"} <ArrowRight size={17} strokeWidth={1.75} />
            </button>
          )}
          <button
            onClick={() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="flex-1 min-h-[48px] rounded-full border border-borderC bg-surface1 text-textPrimary text-body hover:bg-surface3"
          >
            See the path
          </button>
        </div>
      </CourseHero>

      <div className="grid grid-cols-2 gap-2.5 mb-7">
        <Stat big={state.complete ? "Done" : state.done ? `Stage ${stageNow.numeral}` : "Begin"} small={state.complete ? `all ${last} stages` : `of ${last}`} />
        <Stat big={`${state.percent}%`} small="of the path walked" />
        <Stat big={state.unlockedTools.length} small={`tool${state.unlockedTools.length === 1 ? "" : "s"} kept`} />
        <Stat big={daysOnPath(courseProgress, arcanum.slug)} small="days on the path" />
      </div>

      <div className="mb-9">
        {state.complete ? (
          <div className="rounded-card bg-surface1 shadow-card p-5">
            <CourseComplete arcanum={arcanum} course={course} state={state} rows={rows} />
          </div>
        ) : (
          <>
            <SectionHead eyebrow={next?.part.stage ? `Today · ${next.part.stage.name}` : "Today"} title={next?.status === "resting" ? "A pause." : "What's next for you."} />
            <Today arcanum={arcanum} course={course} state={state} onRest={() => setRestOpen(true)} />
          </>
        )}
      </div>

      <div ref={mapRef} className="mb-9 scroll-mt-20">
        <SectionHead eyebrow="Your path" title="Seven doors back to yourself." sub="Each stage brings a perspective, a practice and a real-world experiment. Tap one to see inside." />
        <StageMap course={course} state={state} selected={selected} onSelect={setSelected} />
        <StagePanel course={course} state={state} index={selected} slug={arcanum.slug} />
      </div>

      <div className="mb-9"><Gained arcanum={arcanum} course={course} state={state} /></div>
      <div className="mb-9"><Honoured rows={rows} /></div>
      {!state.complete && <div className="mb-9"><KeptWords arcanum={arcanum} course={course} /></div>}

      <RestPrompt
        open={restOpen}
        onClose={() => setRestOpen(false)}
        slug={arcanum.slug}
        next={next}
        onContinue={() => { setRestOpen(false); navigate(`/learn/${arcanum.slug}/${next.part.id}`); }}
      />
    </div>
  );
}
