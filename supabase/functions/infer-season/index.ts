// infer-season — names the season a Seeker seems to be in ("Season of
// Letting Go"), from the last ten weeks of every part of YOU they allow the
// AI to read (_shared/sources.ts; Cassidy, Oct 27: "draw from all relevant
// sources to make an accurate season"):
//   · weekly Harvests: the notes kept, and what was carried, rested and
//     released (with the sown pursuits);
//   · YOUrnal entries, and the weekly reflections drawn from them;
//   · Moments from that stretch;
//   · their compass (values), and their mood, week by week.
// Saved to public.seasons; the newest row is the current season.
//
// Only runs on an explicit ask (never on load), and only with AI consent.
//
// Deploy: supabase functions deploy infer-season
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { callClaude, parseJsonResponse } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";
import { loadCompass, COMPASS_GUIDANCE } from "../_shared/compass.ts";
import { allowedSources, SOURCE_NAMES } from "../_shared/sources.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MODEL = "claude-opus-5-5";
const WEEKS_BACK = 10;
const MAX_ENTRIES = 60;
const SNIPPET = 280;

const SYSTEM_PROMPT = `You are part of YOU, a self-love and personal-growth app that treats a life as a living story. You name the "season" a person seems to be in over roughly the last ten weeks, from their own material: weekly Harvests (notes they chose to keep at the end of a week, and whether they carried each pursuit forward, rested it or released it), journal entries, the moments they marked, and, when given, their mood week by week and their compass.

Give most weight to what they chose and wrote themselves (harvest notes, journal entries, moments). Mood and the compass add colour only.

A season is the felt quality of this stretch of life, not an achievement or a diagnosis. Name it in the form "Season of …" with two to four plain, grounded words drawn from what they actually wrote and chose (e.g. "Season of Slow Roots", "Season of Letting Go", "Season of Coming Home"). Avoid clichés, therapy-speak and grandiosity.

You are a mirror, never an authority. Use tentative, warm language ("It looks like…", "You seem to be…"). Never invent events or feelings that the material doesn't support. If the material is thin, say so gently in the blurb rather than padding it.

Respond with JSON only, no prose outside it and no code fence:
{
  "name": "Season of …",
  "blurb": "one or two sentences (under 40 words) on why, grounded in their words and choices",
  "signals": ["two to four short phrases (under 8 words each) from their own material that point to this season"]
}`;

// The Monday that starts the week holding `date` (YYYY-MM-DD).
function mondayOf(date: string) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

// The week's average mood (0–100), from scores or (older entries) words.
const MID: Record<string, number> = { rough: 10, low: 30, okay: 50, good: 70, great: 90 };
function averageMood(rows: { score: number | null; mood: string }[]) {
  const scores = rows.map(r => (r.score != null ? r.score : MID[r.mood])).filter((v): v is number => v != null);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

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

    // Only the parts of YOU this Seeker lets the AI read.
    const allow = await allowedSources(supabase, user.id);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - WEEKS_BACK * 7);
    const from = mondayOf(since.toISOString().slice(0, 10));
    const none = Promise.resolve({ data: [] });

    // Reads go through the Seeker's own session, so RLS keeps it to their rows.
    const [{ data: harvests }, { data: intentions }, { data: entries }, { data: reflections }, { data: moments }, { data: moods }, compass] = await Promise.all([
      allow.has("harvests")
        ? supabase.from("week_harvests").select("week_start, note").eq("user_id", user.id).gte("week_start", from).order("week_start")
        : none,
      allow.has("harvests")
        ? supabase.from("week_intentions").select("week_start, outcome, value_name, tended_dates, items(name, type, cat)").eq("user_id", user.id).gte("week_start", from)
        : none,
      allow.has("journal")
        ? supabase.from("journal_entries").select("content, entry_date").eq("user_id", user.id).gte("entry_date", from).order("entry_date", { ascending: false }).limit(MAX_ENTRIES)
        : none,
      // Weekly reflections are drawn from the YOUrnal.
      allow.has("journal")
        ? supabase.from("weekly_reflections").select("week_start, sections").eq("user_id", user.id).gte("week_start", from)
        : none,
      allow.has("moments")
        ? supabase.from("life_moments").select("title, description, moment_date").eq("user_id", user.id).gte("moment_date", from).order("moment_date")
        : none,
      allow.has("mood")
        ? supabase.from("mood_log").select("score, mood, date_key").eq("user_id", user.id).gte("date_key", from)
        : none,
      allow.has("values") ? loadCompass(supabase, user.id) : Promise.resolve(null)
    ]);

    // One line per week, holding everything from that week.
    const weekKeys = new Set<string>();
    (harvests || []).forEach(h => weekKeys.add(h.week_start));
    (entries || []).forEach(e => weekKeys.add(mondayOf(e.entry_date)));
    (moments || []).forEach(m => weekKeys.add(mondayOf(m.moment_date)));
    const weeks = [...weekKeys].sort();

    if (weeks.length === 0) {
      const used = [...allow].filter(s => ["harvests", "journal", "moments"].includes(s));
      return json({
        empty: true,
        message: used.length
          ? "There isn't enough from the last ten weeks yet. Gather a weekly harvest, write in your YOUrnal or add a Moment, and your season can be read."
          : "Your Season reads your harvests, YOUrnal and Moments, but you've chosen to keep them from the AI. You can change that in Your Own Universe → AI reflections."
      });
    }

    const digest = weeks.map(week => {
      const harvest = (harvests || []).find(h => h.week_start === week);
      const sown = (intentions || []).filter(i => i.week_start === week);
      const reflection = (reflections || []).find(r => r.week_start === week);
      const inWeek = (date: string) => mondayOf(date) === week;
      const moodRows = (moods || []).filter(m => inWeek(m.date_key));
      return {
        week_of: week,
        ...(harvest?.note && { note_they_kept: harvest.note }),
        ...(sown.length && {
          what_they_sowed: sown.map(i => ({
            pursuit: (i as { items?: { name?: string } }).items?.name || null,
            value: i.value_name,
            days_tended: (i.tended_dates || []).length,
            chose_to: i.outcome // carried | rested | released
          }))
        }),
        ...((entries || []).some(e => inWeek(e.entry_date)) && {
          journal: (entries || []).filter(e => inWeek(e.entry_date) && (e.content || "").trim()).map(e => e.content.trim().slice(0, SNIPPET))
        }),
        ...((moments || []).some(m => inWeek(m.moment_date)) && {
          moments: (moments || []).filter(m => inWeek(m.moment_date)).map(m => (m.description ? `${m.title}: ${m.description}` : m.title))
        }),
        ...(reflection && { weekly_reflection: reflection.sections?.patterns || reflection.sections?.your_week || null }),
        ...(moodRows.length && { average_mood_out_of_100: averageMood(moodRows) })
      };
    });

    const used = [...allow];
    const raw = await callClaude({
      // The compass only helps name what the season means for the direction
      // they chose; the season itself comes from what they lived and wrote.
      system: compass ? `${SYSTEM_PROMPT}

${COMPASS_GUIDANCE} Name the season from their own material, not from the compass.` : SYSTEM_PROMPT,
      model: MODEL,
      fallbacks: true,
      // Opus 5.5 always thinks first; this leaves room for that plus the short JSON.
      maxTokens: 8000,
      usage: { req, fn: "infer-season" },
      messages: [{
        role: "user",
        content: `Drawn only from what they allow the AI to read: ${used.map(s => SOURCE_NAMES[s]).join(", ")}.\n\n${JSON.stringify(compass ? { recent_weeks: digest, compass } : { recent_weeks: digest }, null, 2)}`
      }]
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
        based_on: {
          harvests: (harvests || []).length,
          notes: (harvests || []).filter(h => (h.note || "").trim()).length,
          entries: (entries || []).length,
          moments: (moments || []).length,
          from: weeks[0],
          to: weeks[weeks.length - 1],
          sources: used
        },
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
