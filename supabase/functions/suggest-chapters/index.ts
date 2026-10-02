// Supabase Edge Function: suggest-chapters
//
// Takes a list of the signed-in user's life moments and asks Claude to
// group them into named "chapters" (eras). Weekly Harvest notes, when sent,
// are context only: they can shape a chapter's name and blurb, but only
// moments are grouped. Returns suggestions only —
// nothing is saved here; the app persists what the user accepts.
//
// Deploy: supabase functions deploy suggest-chapters
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Requires a valid Supabase session (the app's supabase.functions.invoke
// call sends this automatically) — not a public/unauthenticated endpoint.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { logUsage } from "../_shared/usage.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// Haiku is the cheap/fast tier — plenty for grouping + naming a timeline.
// Override with a Supabase secret (ANTHROPIC_MODEL) if you want a different model.
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY is not configured on this function" }, 500);
    }

    // Memories are reflection text: signed-in Seekers who have consented only.
    const consent = await requireAiConsent(req, corsHeaders);
    if ("response" in consent) return consent.response;
    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const { moments, harvests } = await req.json();
    if (!Array.isArray(moments) || moments.length === 0) {
      return jsonResponse({ error: "No moments provided" }, 400);
    }

    // A clean chronological timeline reasons better than a wall of fields.
    const timeline = [...moments]
      .sort((a, b) => new Date(a.moment_date) - new Date(b.moment_date))
      .map(m => `${m.moment_date} — ${m.title}${m.description ? `: ${m.description}` : ""}`)
      .join("\n");

    const harvestLines = (Array.isArray(harvests) ? harvests : [])
      .filter(h => h && h.week_start && String(h.note || "").trim())
      .sort((a, b) => (a.week_start > b.week_start ? 1 : -1))
      .map(h => `week of ${h.week_start} — ${String(h.note).trim()}`)
      .join("\n");

    const prompt = `You are helping someone see their own life story reflected back to them inside a self-love and personal-growth app called YOU. Below is a chronological timeline of real moments from their life (title and optional description per line).

Group these moments into 2-5 "chapters" — meaningful, contiguous eras of their life, ordered chronologically, based on real thematic and temporal shifts you notice in the content (not arbitrary equal-sized slices). Each chapter needs:
- "title": a short, grounded, evocative name (2-5 words). Avoid clichés, avoid therapy-speak, avoid being twee. Ground it in what's actually in their moments, not generic life-stage labels.
- "range_start" and "range_end": ISO dates (YYYY-MM-DD) spanning the moments in that chapter. range_end may equal the most recent moment's date if the chapter is still ongoing.
- "blurb": one honest, warm sentence (under 20 words) capturing what this era was about for them.
- "moment_titles": the exact titles (verbatim) of the moments belonging to this chapter.

Every moment must belong to exactly one chapter. Respond with ONLY a JSON array, no prose, no markdown code fences, matching this exact shape:
[{"title": "...", "range_start": "YYYY-MM-DD", "range_end": "YYYY-MM-DD", "blurb": "...", "moment_titles": ["..."]}]

Timeline:
${timeline}${harvestLines ? `

Weekly harvest notes (things they chose to remember at the end of a week). Use these only as context for naming chapters and writing blurbs that reflect what each era really held; they are not moments, never list them in moment_titles, and don't invent moments from them:
${harvestLines}` : ""}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);
      return jsonResponse({ error: "AI request failed", detail: errText }, 502);
    }

    const data = await res.json();
    await logUsage({ req, fn: "suggest-chapters", data });
    const text = data.content?.[0]?.text || "[]";

    let chapters;
    try {
      const cleaned = text.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");
      chapters = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", text);
      return jsonResponse({ error: "AI response wasn't valid JSON", raw: text }, 502);
    }

    // Output moderation; moment_titles are the Seeker's own words, echoed back.
    const { value: safeChapters, stats } = moderate(chapters, ["moment_titles", "range_start", "range_end"]);
    if (stats.blocked) return jsonResponse({ error: "moderated", message: BLOCKED_MESSAGE }, 422);
    return jsonResponse({ chapters: safeChapters });
  } catch (e) {
    console.error("suggest-chapters error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
