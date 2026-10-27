// What the AI may read, chosen by each Seeker (Cassidy, Oct 27: "offer all
// relevant parts as choices that are properly wired in so AI stays within
// its consensual parameters"). Stored in public.ai_consent.sources; the
// app shows the same list (web-next/src/lib/aiSources.js).
//
// Every AI feature that gathers from across YOU asks this first and reads
// only what's allowed, server-side, so a stale app or a direct call can't
// widen it. Acting on one thing the Seeker opened and asked about (this
// entry, this dream, this page) needs only the general yes in ai_consent;
// the choices here govern what else it may look at.
//
// Course answers keep their own yes (ai_consent.include_courses).

export type Source = "journal" | "moments" | "harvests" | "pursuits" | "values" | "mood";

// Before anyone chose, the features read these; kept so nothing changes
// for them until they do. Mood is new, so it waits for a yes.
export const DEFAULT_SOURCES: Source[] = ["journal", "moments", "harvests", "pursuits", "values"];

// deno-lint-ignore no-explicit-any
export async function allowedSources(supabase: any, userId: string): Promise<Set<Source>> {
  const { data } = await supabase.from("ai_consent").select("sources").eq("user_id", userId).maybeSingle();
  const list = Array.isArray(data?.sources) ? data.sources : DEFAULT_SOURCES;
  return new Set(list as Source[]);
}

export const SOURCE_NAMES: Record<Source, string> = {
  journal: "your YOUrnal",
  moments: "your Moments and chapters",
  harvests: "your weekly sowing and harvests",
  pursuits: "your habits, goals and dreams",
  values: "your values and compass",
  mood: "your mood check-ins"
};
