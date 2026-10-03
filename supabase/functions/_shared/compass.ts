// The Seeker's compass — their own order of values for this season (from the
// Crossroads) and their compass line — as light context for reflections.
// Read through the Seeker's own session, so RLS keeps it to their row.
// deno-lint-ignore no-explicit-any
type Client = any;

export type CompassDigest = {
  true_north: string[];
  order: string[];
  compass_line: string | null;
  set_on: string;
};

export async function loadCompass(supabase: Client, userId: string): Promise<CompassDigest | null> {
  const { data, error } = await supabase
    .from("value_compass")
    .select("ordering, compass_line, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data || !Array.isArray(data.ordering) || !data.ordering.length) return null;
  return {
    true_north: data.ordering[0],
    order: data.ordering.map((g: string[]) => g.join(" = ")),
    compass_line: data.compass_line || null,
    set_on: String(data.created_at).slice(0, 10)
  };
}

// Added to a system prompt whenever the compass is in the context.
export const COMPASS_GUIDANCE = `About "compass" in the context: it is the Seeker's own chosen order of their values for this season (first is their True North; "=" means they felt two as equal) and, if present, their compass line, one sentence in their own words about how they want to live. It is the direction they chose for themselves. Where it genuinely connects, you may gently notice where what they wrote or did meets their compass, or seems to drift from it, always in tentative, kind language. Never judge, score or grade them against it, never suggest they are failing their values, and never mention the compass when it doesn't truly connect. A drift can also be a season, not a failing.`;
