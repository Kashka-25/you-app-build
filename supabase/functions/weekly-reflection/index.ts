// weekly-reflection — looks across a single week's journal entries (plus
// their saved per-entry insights, completed items, and light Life Atlas
// context) and asks Claude for the 8-section weekly review. Saved to
// weekly_reflections, upserted on (user_id, week_start) so re-running it is
// a conscious "regenerate", not something that silently changes on load.
//
// Deploy: supabase functions deploy weekly-reflection
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callClaude, parseJsonResponse } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are part of YOU, a personal life-journaling app. You are writing a weekly reflection by looking across everything the user journaled and did this week.

You are a mirror and reflective guide, never an authority. Use tentative language ("It looks like...", "A theme this week may have been...", "You mentioned..."). Never diagnose, never invent events or feelings that are not supported by what's provided, never claim certainty about emotional states. If the week's information is thin, say so plainly rather than padding with generic content.

Respond with JSON only, no prose outside the JSON, no markdown code fence, in this shape:
{
  "your_week": "what happened — important events/experiences, grounded only in what was provided",
  "what_mattered": "themes and values that appeared repeatedly",
  "accomplished": "progress toward goals, grounded in what was provided",
  "challenged": "recurring obstacles or difficulties mentioned",
  "learned": "possible lessons or insights, tentative",
  "patterns": "possible recurring behaviours, emotions, thoughts, or themes across the week's entries",
  "moving_toward": "connections to dreams and goals",
  "question_for_next_week": "one meaningful reflection question",
  "suggested_focus": "one small, realistic focus for the coming week"
}`;

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const weekStartDate = body.weekStart ? new Date(body.weekStart + "T00:00:00Z") : startOfWeek(new Date());
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const weekStart = toDateKey(weekStartDate);
    const weekEnd = toDateKey(weekEndDate);

    const [{ data: entries }, { data: memoryEntries }, { data: values }, { data: items }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id, content, mood, entry_date, tags, journal_ai_insights(summary, insights)")
        .eq("user_id", user.id)
        .gte("entry_date", weekStart)
        .lte("entry_date", weekEnd)
        .order("entry_date"),
      supabase.from("memory").select("name, type, cat, date_key").eq("user_id", user.id).gte("date_key", weekStart).lte("date_key", weekEnd),
      supabase.from("user_values").select("name, rating").eq("user_id", user.id),
      supabase.from("items").select("name, type, cat, done").eq("user_id", user.id).in("type", ["goal", "dream"]).limit(30)
    ]);

    if (!entries || entries.length === 0) {
      return json({
        reflection: null,
        empty: true,
        weekStart,
        weekEnd,
        message: "No journal entries this week yet — write something and check back."
      });
    }

    const contextDigest = {
      week_start: weekStart,
      week_end: weekEnd,
      entries: entries.map(e => ({
        date: e.entry_date,
        mood: e.mood,
        tags: e.tags,
        content: e.content,
        ai_summary: (e as { journal_ai_insights?: { summary?: string } }).journal_ai_insights?.summary || null
      })),
      completed_this_week: (memoryEntries || []).map(m => `${m.name} [${m.type}/${m.cat}]`),
      values: (values || []).map(v => `${v.name} (${v.rating || 0}/99)`),
      goals_and_dreams: (items || []).map(i => `${i.name} [${i.type}${i.done ? ", done" : ""}]`)
    };

    const raw = await callClaude({
      system: SYSTEM_PROMPT,
      maxTokens: 2000,
      messages: [{ role: "user", content: JSON.stringify(contextDigest, null, 2) }]
    });

    const sections = parseJsonResponse<Record<string, string>>(raw);

    const { data: saved, error: saveErr } = await supabase
      .from("weekly_reflections")
      .upsert(
        {
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          sections,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single();

    if (saveErr) return json({ error: saveErr.message }, 500);
    return json({ reflection: saved, empty: false });
  } catch (e) {
    console.error("[weekly-reflection]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function startOfWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}
