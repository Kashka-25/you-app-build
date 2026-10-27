// suggest-chapters — proposes the chapters (eras) of a Seeker's life story.
//
// Gathers server-side from every part of YOU the Seeker allows the AI to
// read (_shared/sources.ts; Cassidy, Oct 27: "pull from everywhere but
// offer the privacy consent"): Moments (memories, with their own writing),
// YOUrnal entries, weekly harvest notes, and pursuits. Only Moments are
// grouped into chapters by title; everything else is context for where
// eras begin and end and what they held. Returns suggestions only; the app
// saves what the Seeker accepts.
//
// Deploy: supabase functions deploy suggest-chapters
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { allowedSources, SOURCE_NAMES } from "../_shared/sources.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MAX_ENTRIES = 160;        // the most recent journal entries, as short snippets
const SNIPPET = 220;

const SYSTEM = `You help someone see their own life story reflected back to them, inside YOU, a self-love and personal-growth app. From the material below, group their life into 2–5 "chapters": meaningful, contiguous eras in order, based on real shifts you notice in what they lived and wrote, not equal slices.

Each chapter needs:
- "title": a short, grounded, evocative name (2–5 words), drawn from their own material. No clichés, therapy-speak or generic life-stage labels.
- "range_start" and "range_end": ISO dates (YYYY-MM-DD). The last chapter may run to the most recent date.
- "blurb": one honest, warm sentence (under 20 words) on what this era held for them.
- "moment_titles": the exact titles of their Moments that belong in this chapter (copied verbatim), or [] if none.

Every Moment belongs to exactly one chapter. Journal entries, harvest notes and pursuits are context only: use them to see where eras begin and end and what they held; never list them as moment titles and never invent events. You are a mirror, never an authority.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["chapters"],
  properties: {
    chapters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "range_start", "range_end", "blurb", "moment_titles"],
        properties: {
          title: { type: "string" },
          range_start: { type: "string" },
          range_end: { type: "string" },
          blurb: { type: "string" },
          moment_titles: { type: "array", items: { type: "string" } }
        }
      }
    }
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
    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const allow = await allowedSources(supabase, user.id);
    const none = Promise.resolve({ data: [] });
    const [{ data: moments }, { data: entries }, { data: harvests }, { data: items }] = await Promise.all([
      allow.has("moments")
        ? supabase.from("life_moments").select("title, description, moment_date").eq("user_id", user.id).order("moment_date")
        : none,
      allow.has("journal")
        ? supabase.from("journal_entries").select("content, entry_date").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(MAX_ENTRIES)
        : none,
      allow.has("harvests")
        ? supabase.from("week_harvests").select("week_start, note").eq("user_id", user.id).not("note", "is", null).order("week_start")
        : none,
      allow.has("pursuits")
        ? supabase.from("items").select("name, type, created_date, done").eq("user_id", user.id)
        : none
    ]);

    const used = [...allow].filter(s => ["moments", "journal", "harvests", "pursuits"].includes(s));
    const material = {
      moments: (moments || []).map(m => ({ date: m.moment_date, title: m.title, writing: m.description || undefined })),
      journal_entries: (entries || [])
        .filter(e => (e.content || "").trim())
        .reverse()
        .map(e => ({ date: e.entry_date, words: e.content.trim().slice(0, SNIPPET) })),
      harvest_notes: (harvests || []).filter(h => (h.note || "").trim()).map(h => ({ week_of: h.week_start, note: h.note.trim() })),
      pursuits: (items || []).map(i => ({ name: i.name, kind: i.type, began: i.created_date || undefined, completed: i.done || undefined }))
    };
    const total = material.moments.length + material.journal_entries.length + material.harvest_notes.length + material.pursuits.length;
    if (total === 0) {
      return json({
        chapters: [],
        sources: used,
        message: used.length
          ? "There isn't enough yet to find chapters in. Add some Moments or write in your YOUrnal, then try again."
          : "Chapters can draw on your Moments, YOUrnal, harvests and pursuits, but you've chosen to keep all of them from the AI. You can change that in Your Own Universe → AI reflections."
      });
    }

    const raw = await callClaude({
      system: SYSTEM,
      // Room for the model to think first, then the chapters (2500 ran out).
      maxTokens: 8000,
      jsonSchema: SCHEMA,
      usage: { req, fn: "suggest-chapters" },
      messages: [{
        role: "user",
        content: `Drawn only from what they allow the AI to read: ${used.map(s => SOURCE_NAMES[s as keyof typeof SOURCE_NAMES]).join(", ")}.\n\n${JSON.stringify(material, null, 1)}`
      }]
    });
    const parsed = JSON.parse(raw) as { chapters: unknown[] };
    // Output moderation; moment titles are the Seeker's own words, echoed back.
    const { value: chapters, stats } = moderate(parsed.chapters || [], ["moment_titles", "range_start", "range_end"]);
    if (stats.blocked) return json({ error: "moderated", message: BLOCKED_MESSAGE }, 422);
    return json({ chapters, sources: used });
  } catch (e) {
    console.error("[suggest-chapters]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
