// infer-season — reads the Seeker's recent Harvests (the notes they kept,
// and what they carried forward, rested and released each week), with
// their weekly reflections as extra context, and names the season they
// seem to be in ("Season of Letting Go"). Saved to public.seasons; the
// newest row is the current season.
//
// Only runs on an explicit ask (never on load), and only with AI consent:
// Harvest notes are reflection text.
//
// Deploy: supabase functions deploy infer-season
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { callClaude, parseJsonResponse } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";
import { loadCompass, COMPASS_GUIDANCE } from "../_shared/compass.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MODEL = "claude-opus-5-5";
const WEEKS_BACK = 10;

const SYSTEM_PROMPT = `You are part of YOU, a self-love and personal-growth app that treats a life as a living story. You name the "season" a person seems to be in, from their own weekly Harvests: short notes they chose to keep at the end of each week, plus what they decided to carry forward, rest, or release.

A season is the felt quality of this stretch of life, not an achievement or a diagnosis. Name it in the form "Season of …" with two to four plain, grounded words drawn from what they actually wrote and chose (e.g. "Season of Slow Roots", "Season of Letting Go", "Season of Coming Home"). Avoid clichés, therapy-speak and grandiosity.

You are a mirror, never an authority. Use tentative, warm language ("It looks like…", "You seem to be…"). Never invent events or feelings that the material doesn't support. If the material is thin, say so gently in the blurb rather than padding it.

Respond with JSON only, no prose outside it and no code fence:
{
  "name": "Season of …",
  "blurb": "one or two sentences (under 40 words) on why, grounded in their words and choices",
  "signals": ["two to four short phrases (under 8 words each) from their harvests that point to this season"]
}`;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const consent = await requireAiConsent(req, corsHeaders);
    if ("response" in consent) return consent.response;
    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    // Reads go through the Seeker's own session, so RLS keeps it to their rows.
    const { data: harvests } = await supabase
      .from("week_harvests")
      .select("week_start, note")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(WEEKS_BACK);

    if (!harvests || harvests.length === 0) {
      return json({ empty: true, message: "No harvests yet. Gather a week's harvest and your season can be read from it." });
    }

    const weeks = harvests.map(h => h.week_start);
    const [{ data: intentions }, { data: reflections }, compass] = await Promise.all([
      supabase
        .from("week_intentions")
        .select("week_start, outcome, value_name, tended_dates, items(name, type, cat)")
        .eq("user_id", user.id)
        .in("week_start", weeks),
      supabase
        .from("weekly_reflections")
        .select("week_start, sections")
        .eq("user_id", user.id)
        .in("week_start", weeks),
      loadCompass(supabase, user.id)
    ]);

    const digest = harvests
      .slice()
      .reverse()
      .map(h => {
        const sown = (intentions || []).filter(i => i.week_start === h.week_start);
        const reflection = (reflections || []).find(r => r.week_start === h.week_start);
        return {
          week_of: h.week_start,
          note_they_kept: h.note || null,
          what_they_sowed: sown.map(i => ({
            pursuit: (i as { items?: { name?: string } }).items?.name || null,
            value: i.value_name,
            days_tended: (i.tended_dates || []).length,
            chose_to: i.outcome // carried | rested | released
          })),
          weekly_reflection: reflection?.sections?.patterns || reflection?.sections?.your_week || null
        };
      });

    const notes = harvests.filter(h => (h.note || "").trim()).length;
    const raw = await callClaude({
      // The season is still read from the harvests; the compass only helps
      // name what the season means for the direction they chose.
      system: compass ? `${SYSTEM_PROMPT}

${COMPASS_GUIDANCE} Name the season from the harvests themselves, not from the compass.` : SYSTEM_PROMPT,
      model: MODEL,
      fallbacks: true,
      // Opus 5.5 always thinks first; this leaves room for that plus the short JSON.
      maxTokens: 8000,
      usage: { req, fn: "infer-season" },
      messages: [{ role: "user", content: JSON.stringify(compass ? { recent_weeks: digest, compass } : { recent_weeks: digest }, null, 2) }]
    });
    const { value: season, stats } = moderate(parseJsonResponse<{ name: string; blurb: string; signals?: string[] }>(raw));
    if (stats.blocked) return json({ error: "moderated", message: BLOCKED_MESSAGE }, 422);
    if (!season?.name) return json({ error: "The season couldn't be read just now." }, 502);

    const { data: saved, error: saveErr } = await supabase
      .from("seasons")
      .insert({
        user_id: user.id,
        name: season.name.trim(),
        blurb: (season.blurb || "").trim(),
        signals: Array.isArray(season.signals) ? season.signals.filter(Boolean).slice(0, 4) : [],
        based_on: { harvests: harvests.length, notes, from: weeks[weeks.length - 1], to: weeks[0] },
        model: MODEL
      })
      .select()
      .single();
    if (saveErr) return json({ error: saveErr.message }, 500);

    return json({ season: saved, empty: false });
  } catch (e) {
    console.error("[infer-season]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
