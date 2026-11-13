// The line under the YOU logo while YOU opens (sprint C4, Cassidy 13 Nov:
// "a breath and a line for today"). One line a day, picked by the local
// date, so it's the same every time YOU opens that day: predictable, never
// a surprise per open. index.html paints the splash before this code
// arrives, so it keeps its own copy of these lines (dailyLine.test.js
// checks the two match); change both together.
export const DAILY_LINES = [
  "Come back to yourself, whenever you're ready.",
  "Take a breath. You're here.",
  "Nothing to catch up on. Just you.",
  "Arrive as you are.",
  "Slowly is still forward.",
  "There's room here for all of you.",
  "You can't rush a bloom.",
  "A quiet moment, just for you.",
  "Every day is a page of your story.",
  "Gently. There's no hurry here."
];

// Days since 1 Jan 1970 by the local calendar date.
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function dailyLine(date = new Date()) {
  return DAILY_LINES[dayNumber(date) % DAILY_LINES.length];
}
