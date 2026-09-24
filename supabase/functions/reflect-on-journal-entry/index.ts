// reflect-on-journal-entry — reads one journal entry (plus a light digest
// of the user's values/goals/dreams/chapters and recent entry summaries),
// asks Claude for a gentle, non-authoritative reflection, and saves it to
// journal_ai_insights (upsert on entry_id — regenerating is a conscious
// replace, same spirit as suggest-chapters).
//
// Deploy: supabase functions deploy reflect-on-journal-entry
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { callClaude, parseJsonResponse } from "../_shared/anthropic.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SYSTEM_PROMPT = `You are part of YOU, a personal life-journaling app. You are reflecting on a single journal entry the user just wrote.

Your role is a mirror and reflective guide, never an authority. Follow these rules strictly:
- Use tentative, invitational language: "I noticed...", "A possible pattern is...", "You mentioned...", "This may connect with...". Never state a psychological or emotional fact as certain.
- Never diagnose, never tell the user what they "really" feel, never invent memories or events that are not in the text or the provided context.
- Only propose a "connection" to a value/goal/dream/challenge/life area/moment/chapter/past entry if it is actually supported by the provided context — leave a list empty rather than inventing a plausible-sounding link.
- Keep it concise and useful — this appears after every entry, so do not overwhelm.
- Respond with JSON only. No prose before or after, no markdown code fence.

JSON shape:
{
  "summary": "1-2 sentence 'what I noticed', in the tentative voice above",
  "insights": [
    { "category": "theme" | "emotion" | "value" | "dream" | "goal" | "challenge" | "achievement" | "relationship" | "event" | "life_area" | "question" | "pattern", "text": "short phrase, tentative language" }
  ],
  "connections": {
    "values": ["string"], "goals": ["string"], "dreams": ["string"], "challenges": ["string"],
    "life_areas": ["string"], "moments": ["string"], "chapters": ["string"], "related_entries": ["string, e.g. an entry date and why it connects"]
  },
  "reflection_question": "one thoughtful, open question",
  "suggested_next_step": "one small, practical, optional suggestion, or empty string if none fits"
}

Keep "insights" to at most 8 items total across all categories — only include what is genuinely present, not an exhaustive checklist.`;

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

    const { entryId } = await req.json();
    if (!entryId) return json({ error: "entryId is required" }, 400);

    const { data: entry, error: entryErr } = await supabase
      .from("journal_entries")
      .select("id, content, mood, entry_date, tags")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();
    if (entryErr || !entry) return json({ error: "Entry not found" }, 404);

    const [{ data: photos }, { data: values }, { data: items }, { data: chapters }, { data: recentInsights }] =
      await Promise.all([
        supabase.from("journal_photos").select("transcription").eq("entry_id", entryId).not("transcription", "is", null),
        supabase.from("user_values").select("name, rating").eq("user_id", user.id),
        supabase.from("items").select("name, type, cat, done").eq("user_id", user.id).in("type", ["goal", "dream"]).limit(30),
        supabase.from("life_chapters").select("title, range_start, range_end").eq("user_id", user.id),
        supabase
          .from("journal_ai_insights")
          .select("summary, insights, journal_entries!inner(entry_date)")
          .eq("user_id", user.id)
          .neq("entry_id", entryId)
          .order("created_at", { ascending: false })
          .limit(15)
      ]);

    const transcriptions = (photos || []).map(p => p.transcription).filter(Boolean);

    const contextDigest = {
      values: (values || []).map(v => `${v.name} (${v.rating || 0}/99)`),
      goals_and_dreams: (items || []).map(i => `${i.name} [${i.type}${i.done ? ", done" : ""}]`),
      life_chapters: (chapters || []).map(c => `${c.title} (${c.range_start} – ${c.range_end || "ongoing"})`),
      recent_entries: (recentInsights || []).map((r: { summary: string; journal_entries: { entry_date: string } }) => ({
        date: r.journal_entries?.entry_date,
        summary: r.summary
      }))
    };

    const userMessage = `JOURNAL ENTRY
Date: ${entry.entry_date}
Mood: ${entry.mood || "not recorded"}
Tags: ${(entry.tags || []).join(", ") || "none"}

Written text:
${entry.content}

${transcriptions.length ? `Transcribed handwritten pages attached to this entry:\n${transcriptions.join("\n---\n")}\n` : ""}

USER CONTEXT (only use this to find genuine connections — do not restate it as if it came from this entry)
${JSON.stringify(contextDigest, null, 2)}`;

    const raw = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    });

    const parsed = parseJsonResponse<{
      summary: string;
      insights: { category: string; text: string }[];
      connections: Record<string, string[]>;
      reflection_question: string;
      suggested_next_step: string;
    }>(raw);

    const insightsWithIds = (parsed.insights || []).map((item, i) => ({
      id: `${entryId}-${i}`,
      category: item.category,
      text: item.text,
      status: "ai" as const
    }));

    const { data: saved, error: saveErr } = await supabase
      .from("journal_ai_insights")
      .upsert(
        {
          entry_id: entryId,
          user_id: user.id,
          summary: parsed.summary || "",
          insights: insightsWithIds,
          connections: parsed.connections || {},
          reflection_question: parsed.reflection_question || "",
          suggested_next_step: parsed.suggested_next_step || "",
          model: "claude-sonnet-5",
          updated_at: new Date().toISOString()
        },
        { onConflict: "entry_id" }
      )
      .select()
      .single();

    if (saveErr) return json({ error: saveErr.message }, 500);
    return json({ insight: saved });
  } catch (e) {
    console.error("[reflect-on-journal-entry]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
