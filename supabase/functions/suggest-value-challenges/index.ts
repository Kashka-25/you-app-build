// Supabase Edge Function: suggest-value-challenges
//
// Generates new challenges for one Value, scaled to the user's current
// tier, in the same voice as the hand-written challenge library. Returns
// suggestions only - the app inserts what comes back into value_challenges.
//
// Personal when allowed (Cassidy, Oct 27: "asking for consent to draw upon
// their data to personalize the challenges"): with the general AI yes, it
// also reads what this Seeker lets AI read (_shared/sources.ts) - recent
// YOUrnal snippets, pursuits, their other values - so challenges fit the
// life they're actually living. Without that yes, only the value's name
// and tier are sent, as before.
//
// Deploy: supabase functions deploy suggest-value-challenges
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { allowedSources } from "../_shared/sources.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate } from "../_shared/moderate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MAX_ENTRIES = 25;
const SNIPPET = 240;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["challenges"],
  properties: {
    challenges: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "diff", "pts"],
        properties: {
          text: { type: "string" },
          diff: { type: "string", enum: ["gentle", "bold", "brave"] },
          pts: { type: "integer" }
        }
      }
    }
  }
};

const PTS: Record<string, [number, number]> = { gentle: [2, 4], bold: [4, 6], brave: [6, 8] };

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Counts toward the AI allowance either way.
    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const { valueName, tagline, tierName, existingTexts, sampleChallenges } = await req.json();
    if (!valueName) return json({ error: "valueName is required" }, 400);

    // Their own material only with the general yes, and only the parts allowed.
    const { data: consentRow } = await supabase.from("ai_consent").select("granted").eq("user_id", user.id).maybeSingle();
    const allow = consentRow?.granted ? await allowedSources(supabase, user.id) : new Set<string>();
    const none = Promise.resolve({ data: [] });
    const [{ data: entries }, { data: items }, { data: values }] = await Promise.all([
      allow.has("journal")
        ? supabase.from("journal_entries").select("content, entry_date").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(MAX_ENTRIES)
        : none,
      allow.has("pursuits")
        ? supabase.from("items").select("name, type, done").eq("user_id", user.id).in("type", ["habit", "goal", "dream"]).limit(30)
        : none,
      allow.has("values") ? supabase.from("user_values").select("name, rating").eq("user_id", user.id) : none
    ]);

    const written = (entries || []).filter((e: { content?: string }) => String(e.content || "").trim());
    const life = [
      written.length
        ? `Recent YOUrnal entries (snippets, newest first):\n${written
            .map((e: { content: string; entry_date: string }) => `${e.entry_date}: ${e.content.replace(/\s+/g, " ").slice(0, SNIPPET)}`)
            .join("\n")}`
        : "",
      (items || []).length
        ? `What they're growing:\n${(items || []).map((i: { name: string; type: string; done: boolean }) => `- ${i.name} [${i.type}${i.done ? ", done" : ""}]`).join("\n")}`
        : "",
      (values || []).length
        ? `Their values:\n${(values || []).map((v: { name: string; rating: number }) => `- ${v.name} (${v.rating || 0}/99)`).join("\n")}`
        : ""
    ].filter(Boolean).join("\n\n");

    const existingBlock = (existingTexts || []).map((t: string) => `- ${t}`).join("\n") || "(none yet)";
    const samplesBlock = (sampleChallenges || [])
      .map((c: { text: string; diff: string; pts: number }) => `- ${c.text} (${c.diff}, ${c.pts}pts)`)
      .join("\n") || "(no examples available)";

    const prompt = `You are writing new personal-growth challenges for someone building the value "${valueName}" inside a self-love and personal-growth app called YOU. Tagline: "${tagline || ""}".

They are currently in the "${tierName}" tier. Tier meanings: Awakening = just starting out, Practising = building consistency, Embodying = it's becoming natural, Mastering = refining and going deeper. Scale difficulty to fit - someone in Mastering should mostly get "bold"/"brave" challenges; someone in Awakening mostly "gentle" ones.

Do not repeat or closely paraphrase any of these existing challenges:
${existingBlock}

Match this exact voice and format (real examples from this value's library):
${samplesBlock}
${life ? `
THEIR LIFE RIGHT NOW (shared with their permission). Use it so at least three of the challenges fit what they're actually living, doing and wanting - their places, people, habits and goals - in a way they'd recognise. Never quote their entries back, never mention that you read them, never assume more than is written, and never press on anything painful. Keep each challenge kind and doable.

${life}
` : ""}
Generate exactly 5 new challenges. Each needs:
- "text": one concrete, doable, grounded instruction in the same voice as the examples. No therapy-speak, no clichés, no generic self-help phrasing.
- "diff": "gentle" (2-4 points), "bold" (4-6 points) or "brave" (6-8 points), weighted to their tier.
- "pts": an integer inside the range for that diff.`;

    const raw = await callClaude({
      system: "You write challenges for YOU, a self-love and personal-growth app. You are a mirror and a guide, never an authority.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4000,
      usage: { req, fn: "suggest-value-challenges" },
      jsonSchema: SCHEMA
    });
    const parsed = JSON.parse(raw) as { challenges: { text: string; diff: string; pts: number }[] };
    const fixed = (parsed.challenges || []).map(c => {
      const [lo, hi] = PTS[c.diff] || PTS.bold;
      return { ...c, pts: Math.min(hi, Math.max(lo, Math.round(c.pts))) };
    });

    // Output moderation: a challenge whose text is removed is dropped.
    const { value: safe } = moderate(fixed, ["diff", "pts"]);
    return json({ challenges: safe.filter(c => c && c.text), personal: Boolean(life) });
  } catch (e) {
    console.error("[suggest-value-challenges]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
