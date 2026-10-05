// Course Arcana: turning a course's content into an ordered path of parts,
// and working out where the Seeker is on it from what they've finished.
// Pacing follows the device's own date: a part opens `rest` days after the
// one before it was finished. Nothing locks for being late; it just waits.
import { useEffect, useState } from "react";
import { localDateKey, addDaysKey } from "./week";

// ── Loading content ──
const cache = {};

// The course content for an Arcanum (lazy, cached). null while loading.
export function useCourse(arcanum) {
  const slug = arcanum?.slug;
  const [course, setCourse] = useState(() => (slug && cache[slug]) || null);
  useEffect(() => {
    if (!arcanum?.load) return;
    if (cache[slug]) { setCourse(cache[slug]); return; }
    let live = true;
    arcanum.load().then(mod => {
      cache[slug] = mod.default;
      if (live) setCourse(mod.default);
    }).catch(e => console.error("[course] load failed:", e));
    return () => { live = false; };
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  return course;
}

// Several at once (the Library): { slug: course } for those loaded so far.
export function useCourses(arcana) {
  const key = arcana.filter(a => a.load).map(a => a.slug).join(",");
  const [courses, setCourses] = useState(() => Object.fromEntries(arcana.filter(a => cache[a.slug]).map(a => [a.slug, cache[a.slug]])));
  useEffect(() => {
    let live = true;
    arcana.filter(a => a.load).forEach(a => {
      const done = c => { if (live) setCourses(prev => (prev[a.slug] ? prev : { ...prev, [a.slug]: c })); };
      if (cache[a.slug]) done(cache[a.slug]);
      else a.load().then(mod => { cache[a.slug] = mod.default; done(mod.default); }).catch(e => console.error("[course] load failed:", e));
    });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return courses;
}

// ── The path ──
export const PART_LABEL = { checkin: "Check-in", lesson: "Lesson", practice: "Practice", challenge: "Challenge" };

function challengeSteps(course, ch) {
  return [
    { type: "challenge", title: ch.title, body: ch.body },
    { type: "reflect", hint: "Optional.", ...ch.reflect },
    course.challengeValueStep
  ];
}

// Every part in order: opening check-in, each stage's lesson → practice →
// challenge, closing check-in.
export function buildParts(course) {
  const parts = [{
    id: course.opening.id, kind: "checkin", title: course.opening.title, rest: course.opening.rest ?? 0,
    steps: course.opening.steps
  }];
  course.stages.forEach((stage, i) => {
    const tool = course.tools[stage.practice.tool];
    parts.push(
      { id: `${stage.id}.lesson`, kind: "lesson", stage, stageIndex: i, title: stage.question, rest: stage.lesson.rest ?? 1, steps: stage.lesson.steps },
      { id: `${stage.id}.practice`, kind: "practice", stage, stageIndex: i, title: tool.name, toolId: stage.practice.tool, rest: stage.practice.rest ?? 1, steps: tool.steps },
      { id: `${stage.id}.challenge`, kind: "challenge", stage, stageIndex: i, title: stage.challenge.title, rest: stage.challenge.rest ?? 1, pts: stage.challenge.pts || 0, steps: challengeSteps(course, stage.challenge) }
    );
  });
  parts.push({ id: course.closing.id, kind: "checkin", closing: true, title: course.closing.title, rest: 0, steps: course.closing.steps });
  return parts;
}

// Where the Seeker is: each part's status, the next part, how far along.
//   done · open · resting (opensOn, after) · locked
// Rest is suggested, never enforced: a finished part whose rest the Seeker
// chose to skip (rest_skipped_at) lets the next one open straight away.
// The walk a Seeker is on: the latest one started, or 1.
export function currentWalk(slug, walks = [], rows = []) {
  const nums = [
    ...walks.filter(w => w.slug === slug).map(w => w.walk),
    ...rows.filter(r => r.slug === slug).map(r => r.walk || 1)
  ];
  return nums.length ? Math.max(...nums) : 1;
}

// Every walk of a course, oldest first, with its dates.
export function walkLog(slug, walks = [], rows = []) {
  const n = currentWalk(slug, walks, rows);
  return Array.from({ length: n }, (_, i) => {
    const walk = i + 1;
    const w = walks.find(x => x.slug === slug && x.walk === walk);
    const mine = rows.filter(r => r.slug === slug && (r.walk || 1) === walk);
    const firstAt = mine.reduce((m, r) => (!m || r.completed_at < m ? r.completed_at : m), null);
    return { walk, startedAt: w?.started_at || firstAt, completedAt: w?.completed_at || null, parts: mine.length };
  });
}

// `walk` picks which time through to read; tools kept on any walk stay kept.
export function courseState(course, slug, allRows, walk = null) {
  const parts = buildParts(course);
  const mineAll = allRows.filter(r => r.slug === slug);
  const w = walk || currentWalk(slug, [], mineAll);
  const rows = mineAll.filter(r => (r.walk || 1) === w);
  const doneById = Object.fromEntries(rows.map(r => [r.part_id, r]));
  const today = localDateKey();
  let blocked = false;
  const states = parts.map((part, i) => {
    if (doneById[part.id]) return { part, status: "done", row: doneById[part.id] };
    if (blocked) return { part, status: "locked" };
    blocked = true;
    const prev = parts[i - 1];
    if (!prev) return { part, status: "open" };
    const prevRow = doneById[prev.id];
    const opensOn = addDaysKey(prevRow.completed_on, prev.rest || 0);
    if (opensOn <= today || prevRow.rest_skipped_at) return { part, status: "open" };
    return { part, status: "resting", opensOn, after: prev };
  });
  const done = states.filter(s => s.status === "done").length;
  const next = states.find(s => s.status === "open" || s.status === "resting") || null;
  const complete = done === parts.length;
  const currentStage = next?.part.stageIndex ?? (complete ? course.stages.length - 1 : 0);
  return {
    parts, states, next, complete, done, total: parts.length,
    percent: Math.round((done / parts.length) * 100),
    currentStage,
    completedOn: complete ? doneById[course.closing.id].completed_on : null,
    walk: w,
    rows,
    lastAt: rows.reduce((m, r) => (!m || r.completed_at > m ? r.completed_at : m), null),
    unlockedTools: [...new Set(parts.filter(p => p.kind === "practice" && mineAll.some(r => r.part_id === p.id)).map(p => p.toolId))]
  };
}

// Days the Seeker has spent on the path (distinct local dates of a finished part).
export function daysOnPath(rows, slug) {
  return new Set(rows.filter(r => r.slug === slug).map(r => r.completed_on)).size;
}

// A rough time for a part, for "5 minute practice".
export function partMinutes(part) {
  if (part.kind === "challenge") return null;
  return part.minutes || Math.max(2, Math.round(part.steps.length * 0.8));
}

// "today", "tomorrow", or "Thursday 9 Oct".
export function opensLine(dateKey) {
  const today = localDateKey();
  if (dateKey <= today) return "today";
  if (dateKey === addDaysKey(today, 1)) return "tomorrow";
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export function partName(part) {
  if (part.kind === "checkin") return part.title;
  return `Stage ${part.stage.numeral} · ${PART_LABEL[part.kind]}`;
}

// One line for the Library card.
export function courseLine(state, course) {
  if (state.complete) return "Completed";
  if (!state.done) return "Not begun yet";
  const n = state.next;
  const last = course.stages[course.stages.length - 1].numeral;
  const where = n.part.stage ? `Stage ${n.part.stage.numeral} of ${last}` : n.part.title;
  return n.status === "resting" ? `${where} · next opens ${opensLine(n.opensOn)}` : `${where} · ready for you`;
}

// ── Answers ──
// A step's answer as plain text lines, for summaries.
export function answerLines(step, value) {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) return [];
  switch (step.type) {
    case "list": return value.filter(Boolean);
    case "choose": return [Array.isArray(value) ? value.join(", ") : value];
    case "scenario": return [step.options[value]?.text].filter(Boolean);
    default: return [String(value)];
  }
}

// [{ label, lines }] for every answered step that has a label.
export function summarize(steps, data = {}) {
  return steps
    .filter(s => s.key && s.label && s.type !== "scale" && s.type !== "value")
    .map(s => ({ label: s.label, lines: answerLines(s, data[s.key]) }))
    .filter(x => x.lines.length);
}
