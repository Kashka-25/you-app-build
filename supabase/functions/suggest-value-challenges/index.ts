// Supabase Edge Function: suggest-value-challenges
//
// Generates new challenges for one Value, scaled to the user's current
// tier, in the same voice as the hand-written challenge library. Returns
// suggestions only — the app inserts what comes back into value_challenges.
//
// Deploy: supabase functions deploy suggest-value-challenges
// Uses the same ANTHROPIC_API_KEY secret as suggest-chapters.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
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

    const { valueName, tagline, tierName, existingTexts, sampleChallenges } = await req.json();
    if (!valueName) return jsonResponse({ error: "valueName is required" }, 400);

    const existingBlock = (existingTexts || []).map(t => `- ${t}`).join("\n") || "(none yet)";
    const samplesBlock = (sampleChallenges || [])
      .map(c => `- ${c.text} (${c.diff}, ${c.pts}pts)`)
      .join("\n") || "(no examples available)";

    const prompt = `You are writing new personal-growth challenges for someone building the value "${valueName}" inside a self-therapy app called YOU. Tagline: "${tagline || ""}".

They are currently in the "${tierName}" tier. Tier meanings: Awakening = just starting out, Practising = building consistency, Embodying = it's becoming natural, Mastering = refining and going deeper. Scale difficulty to fit — someone in Mastering should mostly get "bold"/"brave" challenges, not beginner "gentle" ones; someone in Awakening should get mostly "gentle" ones.

Do not repeat or closely paraphrase any of these existing challenges:
${existingBlock}

Match this exact voice and format (real examples from this value's library):
${samplesBlock}

Generate exactly 5 new challenges. Each needs:
- "text": one concrete, doable, grounded instruction in the same voice as the examples above. No therapy-speak, no clichés, no generic self-help phrasing.
- "diff": one of "gentle" (worth 2-4 points), "bold" (worth 4-6 points), "brave" (worth 6-8 points) — weight the mix toward what fits their current tier.
- "pts": an integer inside the range for that diff band.

Respond with ONLY a JSON array, no prose, no markdown code fences, matching this exact shape:
[{"text": "...", "diff": "...", "pts": 0}]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
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

    let challenges;
    try {
      const cleaned = text.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");
      challenges = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", text);
      return jsonResponse({ error: "AI response wasn't valid JSON", raw: text }, 502);
    }

    return jsonResponse({ challenges });
  } catch (e) {
    console.error("suggest-value-challenges error:", e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
