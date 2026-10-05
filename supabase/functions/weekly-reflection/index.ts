// weekly-reflection — looks across a single week's journal entries (plus
// their saved per-entry insights, completed items, and light Life Atlas
// context) and asks Claude for the 8-section weekly review. Saved to
// weekly_reflections, upserted on (user_id, week_start) so re-running it is
// a conscious "regenerate", not something that silently changes on load.
//
// Deploy: supabase functions deploy weekly-reflection
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { callClaude, parseJsonResponse } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";
import { loadCompass, COMPASS_GUIDANCE } from "../_shared/compass.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are part of YOU, a self-love and personal-growth app where people journal their lives. You are writing a weekly reflection by looking across everything the user journaled and did this week.

You are a mirror and reflective guide, never an authority. Use tentative language ("It looks like...", "A theme this week may have been...", "You mentioned..."). Never diagnose, never invent events or feelings that are not supported by what's provided, never claim certainty about emotional states. If the week's information is thin, say so plainly rather than padding with generic content.

If "course_reflections" are provided, they are the user's own answers from a YOUniversity course they are walking (a lesson, a practice or a real-world challenge), included because they chose to include them. Weave them in only where they genuinely connect to the week; never quote them back at length, and never treat course prompts as facts about the user.

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

    const consent = await requireAiConsent(req, corsHeaders);
    if ("response" in consent) return consent.response;
    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const weekStartDate = body.weekStart ? new Date(body.weekStart + "T00:00:00Z") : startOfWeek(new Date());
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const weekStart = toDateKey(weekStartDate);
    const weekEnd = toDateKey(weekEndDate);

    // Course answers join only with their own, separate yes.
    const { data: consentRow } = await supabase.from("ai_consent").select("include_courses").eq("user_id", user.id).maybeSingle();
    const includeCourses = Boolean(consentRow?.include_courses);

    const [{ data: entries }, { data: memoryEntries }, { data: values }, { data: items }, compass, { data: courseRows }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id, content, mood, entry_date, tags, journal_ai_insights(summary, insights)")
        .eq("user_id", user.id)
        .gte("entry_date", weekStart)
        .lte("entry_date", weekEnd)
        .order("entry_date"),
      supabase.from("memory").select("name, type, cat, date_key").eq("user_id", user.id).gte("date_key", weekStart).lte("date_key", weekEnd),
      supabase.from("user_values").select("name, rating").eq("user_id", user.id),
      supabase.from("items").select("name, type, cat, done").eq("user_id", user.id).in("type", ["goal", "dream"]).limit(30),
      loadCompass(supabase, user.id),
      includeCourses
        ? supabase.from("arcanum_progress").select("slug, part_id, summary, completed_on")
            .eq("user_id", user.id).gte("completed_on", weekStart).lte("completed_on", weekEnd).order("completed_on")
        : Promise.resolve({ data: [] })
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
      compass,
      goals_and_dreams: (items || []).map(i => `${i.name} [${i.type}${i.done ? ", done" : ""}]`),
      ...(includeCourses && courseRows && courseRows.length ? {
        course_reflections: courseRows
          .filter(r => Array.isArray(r.summary) && r.summary.length)
          .map(r => ({
            date: r.completed_on,
            course: r.slug.replace(/-/g, " "),
            part: r.part_id.replace(".", " · "),
            words: (r.summary as { label: string; lines: string[] }[]).map(w => `${w.label}: ${w.lines.join(" / ")}`)
          }))
      } : {})
    };

    const raw = await callClaude({
      system: compass ? `${SYSTEM_PROMPT}

${COMPASS_GUIDANCE}` : SYSTEM_PROMPT,
      maxTokens: 2000, usage: { req, fn: "weekly-reflection" },
      messages: [{ role: "user", content: JSON.stringify(contextDigest, null, 2) }]
    });

    const { value: sections, stats } = moderate(parseJsonResponse<Record<string, string>>(raw));
    if (stats.blocked) return json({ error: "moderated", message: BLOCKED_MESSAGE }, 422);

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
