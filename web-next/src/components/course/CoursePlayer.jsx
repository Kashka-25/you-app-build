import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Library, Sprout } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { getArcanum } from "../../constants/arcana";
import { useCourse, courseState, opensLine, partName, PART_LABEL } from "../../lib/course";
import { LoadingScreen } from "../ui/LoadingScreen";
import { GlowBubble } from "../ui/GlowBubble";
import { riseIn } from "../ui/motion";
import StepRunner from "./StepRunner";
import CourseComplete from "./CourseComplete";
import RestPrompt from "./RestPrompt";

function Shell({ children }) {
  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto font-sans">
      {/* my-auto centres short screens; long ones scroll from the top. */}
      <div className="min-h-full max-w-[560px] mx-auto px-5 py-10 flex flex-col">
        <div className="my-auto">{children}</div>
      </div>
    </div>
  );
}

const primary = "w-full min-h-[52px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest";
const quiet = "w-full min-h-[48px] rounded-sm border border-borderC bg-surface1 text-textPrimary text-body hover:bg-surface3 mt-2.5";

// The moment after a part: what was kept, and when the next part opens.
function Kept({ icon, title, lines, next, onPath, onLibrary, onRestNow }) {
  return (
    <Shell>
      <motion.div {...riseIn} className="flex flex-col items-center text-center">
        <GlowBubble icon={icon} size={84} className="mb-6" />
        <h1 className="font-serif text-hero text-textPrimary m-0">{title}</h1>
        {lines.map(l => <p key={l} className="text-body text-textSecondary mt-3 mb-0 max-w-[400px]">{l}</p>)}
        {next && (
          <div className="mt-6 rounded-card bg-surface1 shadow-card px-5 py-4 w-full max-w-[400px]">
            <div className="text-label uppercase text-gold mb-1">Next</div>
            <div className="text-body text-textPrimary">{next.part.kind === "checkin" ? next.part.title : `${partName(next.part)} · ${next.part.title}`}</div>
            <div className="text-bodySm text-textSecondary mt-0.5">
              {next.status === "resting" ? `Opens ${opensLine(next.opensOn)}. Rest is part of it: live with what you've found.` : "Ready whenever you are."}
            </div>
            {next.status === "resting" && onRestNow && (
              <button onClick={onRestNow} className="mt-2.5 text-bodySm text-textSecondary underline underline-offset-4 decoration-borderC hover:text-textPrimary">
                Feel ready? Continue now
              </button>
            )}
          </div>
        )}
        <div className="w-full max-w-[400px] mt-8">
          <button className={primary} onClick={onPath}>Back to the path</button>
          {onLibrary && <button className={quiet} onClick={onLibrary}>Open my Library</button>}
        </div>
      </motion.div>
    </Shell>
  );
}

function andList(names) {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// What growing values says: who grew, who reached a new tier, and any
// value named that isn't one of theirs yet.
function grownLines(grown) {
  if (!grown) return [];
  const lines = [];
  const names = grown.values.map(v => v.valueName);
  if (names.length) lines.push(`${andList(names)} ${names.length === 1 ? "grows" : "grow"}.`);
  grown.values.filter(v => v.crossedInto).forEach(v => lines.push(`${v.valueName} has reached ${v.crossedInto}.`));
  if (grown.notHeld.length) {
    lines.push(`${andList(grown.notHeld)} ${grown.notHeld.length === 1 ? "isn't one of your values" : "aren't among your values"} yet, so ${grown.notHeld.length === 1 ? "it's" : "they're"} kept with this challenge. Add ${grown.notHeld.length === 1 ? "it" : "them"} in the YOU tab and future challenges can grow ${grown.notHeld.length === 1 ? "it" : "them"}.`);
  }
  return lines;
}

// What the moment after a part says, by kind.
function keptFor(part, tool, result) {
  switch (part.kind) {
    case "checkin":
      return { icon: Sprout, title: "Your starting point is kept", lines: ["At the very end you'll answer the same nine statements again, and see what changed."] };
    case "lesson":
      return { icon: Check, title: "Lesson complete", lines: [`${part.stage.name} · ${part.stage.question}`] };
    case "practice":
      return { icon: tool?.icon || Library, title: `${tool?.name} is in your Library`, lines: ["Return to it any time, as often as you need. Every use is saved privately."] };
    default:
      return {
        icon: Check, title: "Lived",
        lines: [
          "Every small step like this one changes how you live.",
          ...grownLines(result.grown)
        ]
      };
  }
}

// Plays one part of a course (/learn/:slug/:partId), or a kept tool again
// (/learn/:slug/tool/:toolId).
export default function CoursePlayer() {
  const { slug, partId, toolId } = useParams();
  const navigate = useNavigate();
  const { arcanaLoaded: loaded, heldArcana, courseProgress, completeCoursePart, saveToolUse } = useAppData();
  const arcanum = getArcanum(slug);
  const course = useCourse(arcanum);
  const [result, setResult] = useState(null); // what was just finished
  const [pending, setPending] = useState(false); // saving the last step
  const [restOpen, setRestOpen] = useState(false);
  // Going on to the next part (or tool) starts it fresh.
  useEffect(() => { setResult(null); setRestOpen(false); }, [partId, toolId]);

  const state = useMemo(() => (course ? courseState(course, slug, courseProgress) : null), [course, slug, courseProgress]);
  const path = `/youniversity/arcanum/${slug}`;
  const held = heldArcana.some(h => h.slug === slug);

  if (!arcanum || !loaded || !course) {
    return <div className="fixed inset-0 z-40 bg-bg flex items-center justify-center"><LoadingScreen label="Opening" /></div>;
  }
  if (!held) {
    return (
      <Shell>
        <div className="text-center">
          <div className="font-serif text-h1 text-textPrimary mb-2">This Arcanum isn't in your Library yet</div>
          <button className={`${primary} mt-6`} onClick={() => navigate(path, { replace: true })}>See {arcanum.name}</button>
        </div>
      </Shell>
    );
  }

  // ── Using a kept tool again ──
  if (toolId) {
    const tool = course.tools[toolId];
    const toolPage = `${path}/tool/${toolId}`;
    if (!tool || !state.unlockedTools.includes(toolId)) return <Navigate to={path} replace />;
    if (result) {
      return (
        <Kept
          icon={tool.icon}
          title="Saved privately to your Library"
          lines={[`Your ${tool.name} is kept with every other time you've used it.`]}
          onPath={() => navigate(toolPage, { replace: true })}
        />
      );
    }
    return (
      <StepRunner
        steps={tool.steps}
        eyebrow={tool.name}
        title={arcanum.name}
        draftKey={`${slug}:tool:${toolId}`}
        finishLabel="Keep it"
        onClose={() => navigate(toolPage, { replace: true })}
        onFinish={async data => { await saveToolUse({ slug, toolId, data }); setResult({}); }}
      />
    );
  }

  // ── A part of the path ──
  const entry = state.states.find(s => s.part.id === partId);
  if (!entry) return <Navigate to={path} replace />;
  const { part } = entry;

  if (result) {
    const after = courseState(course, slug, courseProgress);
    if (part.closing) {
      return (
        <Shell>
          <CourseComplete arcanum={arcanum} course={course} state={after} rows={courseProgress.filter(r => r.slug === slug)} />
          <div className="mt-8">
            <button className={primary} onClick={() => navigate(path, { replace: true })}>Back to the path</button>
            <button className={quiet} onClick={() => navigate("/youniversity", { replace: true })}>Open my Library</button>
          </div>
        </Shell>
      );
    }
    const tool = part.kind === "practice" ? course.tools[part.toolId] : null;
    const kept = keptFor(part, tool, result);
    return (
      <>
        <Kept
          {...kept}
          next={after.next}
          onPath={() => navigate(path, { replace: true })}
          onLibrary={part.kind === "practice" ? () => navigate(`${path}/tool/${part.toolId}`, { replace: true }) : null}
          onRestNow={() => setRestOpen(true)}
        />
        <RestPrompt
          open={restOpen}
          onClose={() => setRestOpen(false)}
          slug={slug}
          next={after.next}
          onContinue={() => navigate(`/learn/${slug}/${after.next.part.id}`, { replace: true })}
        />
      </>
    );
  }

  if (!pending && (entry.status === "done" || entry.status === "locked" || entry.status === "resting")) {
    return (
      <Shell>
        <div className="text-center">
          <div className="font-serif text-h1 text-textPrimary mb-2">
            {entry.status === "done" ? "You've finished this part" : entry.status === "resting" ? `This opens ${opensLine(entry.opensOn)}` : "This part opens later on the path"}
          </div>
          <div className="text-body text-textSecondary">Nothing is lost. Continue when you're ready.</div>
          <button className={`${primary} mt-6`} onClick={() => navigate(path, { replace: true })}>Back to the path</button>
          {entry.status === "resting" && (
            <button className={quiet} onClick={() => setRestOpen(true)}>Feel ready? Continue now</button>
          )}
        </div>
        <RestPrompt open={restOpen} onClose={() => setRestOpen(false)} slug={slug} next={entry} onContinue={() => setRestOpen(false)} />
      </Shell>
    );
  }

  const eyebrow = part.kind === "checkin" ? part.title : `Stage ${part.stage.numeral} · ${part.stage.name}`;
  const title = part.kind === "checkin" ? arcanum.name : `${PART_LABEL[part.kind]} · ${part.title}`;

  return (
    <StepRunner
      steps={part.steps}
      eyebrow={eyebrow}
      title={title}
      draftKey={`${slug}:${part.id}`}
      finishLabel={part.kind === "practice" ? "Keep it" : part.kind === "challenge" ? "Mark it lived" : "Finish"}
      onClose={() => navigate(path, { replace: true })}
      onFinish={async data => {
        setPending(true);
        try {
          const { grown } = await completeCoursePart({ slug, part, data });
          setResult({ grown });
        } finally {
          setPending(false);
        }
      }}
    />
  );
}
