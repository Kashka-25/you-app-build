import { useAppData } from "./AppDataContext";

// What the AI may read, chosen by each Seeker (Cassidy, Oct 27). The same
// list is enforced server-side in supabase/functions/_shared/sources.ts;
// keep the two in step. Course answers keep their own yes.
export const AI_SOURCES = [
  { key: "journal", label: "Your YOUrnal", says: "Entries you've written, so reflections, chapters and your season can see what you've been living." },
  { key: "moments", label: "Your Moments and chapters", says: "The memories you've added, with their writing, and the chapters of your story." },
  { key: "harvests", label: "Your weekly sowing and harvests", says: "What you chose to grow each week and the notes you kept at its end. Your Season is read from these." },
  { key: "pursuits", label: "Your habits, goals and dreams", says: "What you're growing and what you've completed." },
  { key: "values", label: "Your values and compass", says: "The values you hold and your True North." },
  { key: "mood", label: "Your mood check-ins", says: "How you've been arriving each day, as a score out of 100." }
];

// Before anyone chooses, the features read these; mood waits for a yes.
export const DEFAULT_AI_SOURCES = ["journal", "moments", "harvests", "pursuits", "values"];

export function useAiSources() {
  const { aiConsent } = useAppData();
  const list = Array.isArray(aiConsent?.sources) ? aiConsent.sources : DEFAULT_AI_SOURCES;
  return new Set(list);
}

// "your YOUrnal, Moments and harvests" for the "Draws from" lines.
export function describeSources(keys) {
  const names = { journal: "YOUrnal", moments: "Moments", harvests: "harvests", pursuits: "pursuits", values: "values", mood: "mood check-ins" };
  const list = keys.map(k => names[k]).filter(Boolean);
  if (!list.length) return "nothing yet";
  if (list.length === 1) return `your ${list[0]}`;
  return `your ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
