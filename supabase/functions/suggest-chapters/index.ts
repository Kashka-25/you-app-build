// Supabase Edge Function: suggest-chapters
//
// Takes a list of the signed-in user's life moments and asks Claude to
// group them into named "chapters" (eras). Returns suggestions only —
// nothing is saved here; the app persists what the user accepts.
//
// Deploy: supabase functions deploy suggest-chapters
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Requires a valid Supabase session (the app's supabase.functions.invoke
// call sends this automatically) — not a public/unauthenticated endpoint.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

    const { moments } = await req.json();
    if (!Array.isArray(moments) || moments.length === 0) {
      return jsonResponse({ error: "No moments provided" }, 400);
    }

    // A clean chronological timeline reasons better than a wall of fields.
    const timeline = [...moments]
      .sort((a, b) => new Date(a.moment_date) - new Date(b.moment_date))
      .map(m => `${m.moment_date} — ${m.title}${m.description ? `: ${m.description}` : ""}`)
      .join("\n");

    const prompt = `You are helping someone see their own life story reflected back to them inside a personal-growth app called YOU. Below is a chronological timeline of real moments from their life (title and optional description per line).

Group these moments into 2-5 "chapters" — meaningful, contiguous eras of their life, ordered chronologically, based on real thematic and temporal shifts you notice in the content (not arbitrary equal-sized slices). Each chapter needs:
- "title": a short, grounded, evocative name (2-5 words). Avoid clichés, avoid therapy-speak, avoid being twee. Ground it in what's actually in their moments, not generic life-stage labels.
- "range_start" and "range_end": ISO dates (YYYY-MM-DD) spanning the moments in that chapter. range_end may equal the most recent moment's date if the chapter is still ongoing.
- "blurb": one honest, warm sentence (under 20 words) capturing what this era was about for them.
- "moment_titles": the exact titles (verbatim) of the moments belonging to this chapter.

Every moment must belong to exactly one chapter. Respond with ONLY a JSON array, no prose, no markdown code fences, matching this exact shape:
[{"title": "...", "range_start": "YYYY-MM-DD", "range_end": "YYYY-MM-DD", "blurb": "...", "moment_titles": ["..."]}]

Timeline:
${timeline}`;

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

    return jsonResponse({ chapters });
  } catch (e) {
    console.error("suggest-chapters error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
