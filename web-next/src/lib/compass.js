// Shared selection logic for "Bring Me Back To Myself" and the Home screen.
// Both screens answer the same underlying question — "what matters to me
// right now?" — from the same data (values, items, chapters, journal
// insights), just at different depths (Home: one pick per section; Bring Me
// Back: a fuller view). Kept here once so the two screens can't quietly
// drift into picking different "current" dreams/quests/chapters.
//
// Deliberately reads only what's already been fetched (values/items/
// chapters/recentInsights) — no AI call happens just from opening these
// screens. The AI cost already happened when each journal insight/weekly
// reflection was generated; this just re-reads and synthesizes that.

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// Ongoing chapters (range_end null) win; otherwise whichever chapter's
// range actually contains today; otherwise the most recently started one.
// life_chapters has no "current" flag of its own, so this is inferred.
export function pickCurrentChapter(chapters) {
  if (!chapters || chapters.length === 0) return null;
  const today = todayKey();
  const ongoing = chapters.find(c => !c.range_end);
  if (ongoing) return ongoing;
  const containing = chapters.find(c => c.range_start <= today && (!c.range_end || c.range_end >= today));
  if (containing) return containing;
  return [...chapters].sort((a, b) => new Date(b.range_start) - new Date(a.range_start))[0];
}

// The most recently added, not-yet-done dream — "recent" because that's
// most likely to still be live in the user's mind, not because older
// dreams matter less.
export function pickDirection(items) {
  const dreams = (items || []).filter(i => i.type === "dream" && !i.done);
  if (dreams.length === 0) return null;
  return [...dreams].sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))[0];
}

// One concrete, achievable next action: a goal over a habit (a goal is a
// finish line; a habit already has its own daily check-in UI elsewhere), a
// habit over nothing.
export function pickTodaysQuest(items) {
  const goals = (items || []).filter(i => i.type === "goal" && !i.done);
  if (goals.length > 0) {
    return [...goals].sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))[0];
  }
  const habits = (items || []).filter(i => i.type === "habit" && !i.done);
  if (habits.length > 0) {
    return [...habits].sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))[0];
  }
  return null;
}

// Values the AI has actually connected to recent journal entries win over a
// generic "top rated" pick — that's what makes this feel current rather
// than a static profile field. Falls back to top-rated values when there's
// not enough journal history yet.
export function pickRelevantValues(values, recentInsights, limit = 3) {
  const fromJournal = [];
  (recentInsights || []).forEach(row => {
    (row.connections?.values || []).forEach(name => {
      if (!fromJournal.includes(name)) fromJournal.push(name);
    });
  });
  if (fromJournal.length > 0) return fromJournal.slice(0, limit);
  return [...(values || [])].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit).map(v => v.name);
}

// All non-rejected "pattern" category items across recent insights, newest
// first, deduplicated by text. Used by Bring Me Back's "patterns noticed"
// section; Home just takes the first one.
export function pickNoticedPatterns(recentInsights, limit = 5) {
  const patterns = [];
  (recentInsights || []).forEach(row => {
    (row.insights || [])
      .filter(item => item.category === "pattern" && item.status !== "rejected")
      .forEach(item => {
        if (!patterns.some(p => p.text === item.text)) {
          patterns.push({ text: item.text, entryDate: row.journal_entries?.entry_date });
        }
      });
  });
  return patterns.slice(0, limit);
}

// The most recent non-empty reflection question — a fresh one every time
// would mean an AI call on every Home load, which isn't worth the latency
// or cost for a question that's meant to sit with you for a while anyway.
export function pickReflectionQuestion(recentInsights) {
  const row = (recentInsights || []).find(r => r.reflection_question);
  return row?.reflection_question || null;
}

// One practical suggestion to close on — prefers the latest entry's
// suggested_next_step, falls back to today's quest so there's always
// *something* concrete offered.
export function pickNextStep(recentInsights, items) {
  const row = (recentInsights || []).find(r => r.suggested_next_step);
  if (row) return row.suggested_next_step;
  const quest = pickTodaysQuest(items);
  return quest ? `Take one small step on "${quest.name}".` : null;
}
