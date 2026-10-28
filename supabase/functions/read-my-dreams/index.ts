// read-my-dreams — one reading across every dream a Seeker has recorded
// (Cassidy, Oct 27: "reflect upon all recorded dreams for patterns").
//
// Dreams are YOUrnal entries tagged #dream, so this needs the AI yes and
// the YOUrnal allowed (_shared/sources.ts). It reads each dream (its words,
// date and mood) with the symbols and feelings its own reading found, and,
// where allowed, the Seeker's values and pursuits so a pattern can be tied
// to waking life only where it really fits. Saved to public.dream_patterns,
// one row per Seeker, replaced on each fresh reading. Runs only when asked.
//
// Deploy: supabase functions deploy read-my-dreams
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { allowedSources } from "../_shared/sources.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MAX_DREAMS = 80;   // the most recent, if there are more
const SNIPPET = 700;

const tagKey = (t: string) => String(t).replace(/^#/, "").toLowerCase();
const isDream = (tags: string[] | null) => (tags || []).some(t => ["dream", "dreams"].includes(tagKey(t)));

const SYSTEM = `You are part of YOU, a self-love and personal-growth app. The user has recorded their night-time dreams over time and asked you to look across all of them for patterns.

You are a mirror, never an authority. Hold dream meanings lightly: personal association first, then common symbolism, Jungian ideas such as shadow and archetype, and each dream's feeling-tone. Never claim to know what a dream means, never treat dreams as prophecy, never diagnose. Use tentative language ("A possible thread...", "It may be..."). Only name a pattern that genuinely appears in more than one dream; if the dreams are few or don't repeat, say so plainly rather than inventing links. Tie a pattern to waking life only where their own words or the context given really support it. If they wrote their own interpretations, honour them. When you mention a dream's date in your words, write it as day and month in words ("the 8 October dream"), never as numbers like 10/08.

Fields:
- "overview": two or three sentences on what stands out across their dreams.
- "recurring_symbols": figures, places, objects or actions that return, each with how many dreams it appears in, the dates it appeared (YYYY-MM-DD, from the dreams given), and one or two tentative possibilities for what it might hold for them (under 40 words). Most charged first; at most eight.
- "recurring_feelings": feeling-tones that return, each with a short note on when or how they show up.
- "threads": up to four themes or shifts over time (e.g. something that changed after a certain point), each with a short title and two or three sentences.
- "waking_life": where these patterns may touch their waking life, only if supported; empty otherwise.
- "question": one question that invites them to find their own meaning.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overview", "recurring_symbols", "recurring_feelings", "threads", "waking_life", "question"],
  properties: {
    overview: { type: "string" },
    recurring_symbols: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["symbol", "count", "dates", "meaning"],
        properties: {
          symbol: { type: "string" },
          count: { type: "integer" },
          dates: { type: "array", items: { type: "string" } },
          meaning: { type: "string" }
        }
      }
    },
    recurring_feelings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["feeling", "note"],
        properties: { feeling: { type: "string" }, note: { type: "string" } }
      }
    },
    threads: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "text"],
        properties: { title: { type: "string" }, text: { type: "string" } }
      }
    },
    waking_life: { type: "array", items: { type: "string" } },
    question: { type: "string" }
  }
};

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

    const allow = await allowedSources(supabase, user.id);
    if (!allow.has("journal")) {
      return json({
        error: "source_off",
        message: "Your dreams live in your YOUrnal, which AI isn't allowed to read right now. You can change that under Settings → What AI can read."
      }, 403);
    }

    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const { data: rows, error } = await supabase
      .from("journal_entries")
      .select("id, content, mood, entry_date, tags")
      .eq("user_id", user.id)
      .not("tags", "is", null)
      .order("entry_date", { ascending: false })
      .limit(2000);
    if (error) return json({ error: error.message }, 500);

    const dreams = (rows || []).filter(r => isDream(r.tags) && String(r.content || "").trim()).slice(0, MAX_DREAMS);
    if (dreams.length < 2) {
      return json({
        empty: true,
        message: dreams.length
          ? "Only one dream so far. Record a few more with #dream and patterns can start to show."
          : "No dreams yet. Write one in your YOUrnal and tag it #dream."
      });
    }

    const none = Promise.resolve({ data: [] });
    const [{ data: readings }, { data: items }, { data: values }] = await Promise.all([
      supabase.from("journal_ai_insights").select("entry_id, dream").eq("user_id", user.id).in("entry_id", dreams.map(d => d.id)).not("dream", "is", null),
      allow.has("pursuits")
        ? supabase.from("items").select("name, type").eq("user_id", user.id).in("type", ["goal", "dream"]).limit(30)
        : none,
      allow.has("values") ? supabase.from("user_values").select("name").eq("user_id", user.id) : none
    ]);
    const readingOf = new Map((readings || []).map((r: { entry_id: string; dream: unknown }) => [r.entry_id, r.dream]));

    // Oldest first, so changes over time read in order.
    const timeline = [...dreams].reverse().map(d => {
      const r = readingOf.get(d.id) as { symbols?: { symbol: string }[]; feelings?: string[] } | undefined;
      return {
        date: d.entry_date,
        mood: d.mood || null,
        dream: String(d.content).slice(0, SNIPPET),
        ...(r ? { symbols_noted: (r.symbols || []).map(s => s.symbol), feelings_noted: r.feelings || [] } : {})
      };
    });

    const context = {
      goals_and_dreams: (items || []).map((i: { name: string; type: string }) => `${i.name} [${i.type}]`),
      values: (values || []).map((v: { name: string }) => v.name)
    };

    const raw = await callClaude({
      system: SYSTEM,
      maxTokens: 8000,
      usage: { req, fn: "read-my-dreams" },
      jsonSchema: SCHEMA,
      messages: [{
        role: "user",
        content: `THEIR DREAMS (${timeline.length}, oldest first)\n${JSON.stringify(timeline, null, 2)}\n\nWAKING-LIFE CONTEXT (only for genuine links; do not restate it)\n${JSON.stringify(context, null, 2)}`
      }]
    });

    const { value: reading, stats } = moderate(JSON.parse(raw), ["dates", "count", "symbol"]);
    if (stats.blocked) return json({ error: "moderated", message: BLOCKED_MESSAGE }, 422);

    const row = {
      user_id: user.id,
      reading,
      dream_count: dreams.length,
      first_dream: dreams[dreams.length - 1].entry_date,
      last_dream: dreams[0].entry_date,
      updated_at: new Date().toISOString()
    };
    // Kept for next time; if the table isn't there yet the reading still shows.
    const { error: saveErr } = await supabase.from("dream_patterns").upsert(row);
    if (saveErr) console.error("[read-my-dreams] save failed:", saveErr.message);
    return json({ empty: false, patterns: row });
  } catch (e) {
    console.error("[read-my-dreams]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
