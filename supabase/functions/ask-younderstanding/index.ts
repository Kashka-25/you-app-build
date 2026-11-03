// ask-younderstanding — a Seeker asks YOU their own question about
// themselves and gets one deep reading back (Cassidy, Nov 2: "a place
// someone can go to ask about a reflection on themself and everything they
// have been posting ... It also pulls from any and all of the already used
// ai reviews and takes those into consideration").
//
// body: { question }
//
// Reads only what this Seeker lets the AI read (_shared/sources.ts):
//   · YOUrnal entries that speak to the question: tags first (#dream,
//     #wetdream…), then words, with their mood; and, when the question is
//     broad, their most recent entries too;
//   · the readings YOU has already made from the YOUrnal: each entry's
//     reflection and dream reading, the patterns across their dreams, and
//     weekly reflections;
//   · their Seasons (drawn from YOUrnal, harvests and Moments);
//   · Moments that speak to the question, their compass and pursuits, and
//     mood check-ins around the chosen entries, each only where allowed.
// Returns the reading with what it drew from; nothing is saved here. The
// Seeker keeps a reading by choice (public.younderstandings, from the app).
//
// Only runs on an explicit ask, and only with AI consent.
//
// Deploy: supabase functions deploy ask-younderstanding
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { requireAiConsent } from "../_shared/consent.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { checkDailyLimit } from "../_shared/limit.ts";
import { moderate, BLOCKED_MESSAGE } from "../_shared/moderate.ts";
import { loadCompass, COMPASS_GUIDANCE } from "../_shared/compass.ts";
import { allowedSources, SOURCE_NAMES } from "../_shared/sources.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const MAX_QUESTION = 600;
const MAX_ENTRIES = 40;     // entries sent in full(ish)
const FILL_RECENT = 15;     // recent entries added when few match
const SNIPPET = 900;

const SYSTEM = `You are YOU, the voice of a self-love and personal-growth app. The person has asked you a question about themselves. Answer it from everything they've let you read: their own journal entries (with tags, dates and moods), the readings you have already made for them (entry reflections, dream readings, patterns across their dreams, weekly reflections, the seasons you named), and, where given, their moments, values, pursuits and mood.

How to answer:
- Answer the question they actually asked, specifically, from their own material. Name what you see across entries: what repeats, what changed over time, what the moods around it were, what earlier readings already noticed and whether that still holds. Refer to entries by date in words ("your 8 October dream"), never as numbers like 10/08.
- Go deep. If they ask from a particular lens (spiritual, Jungian, energetic, astrological, emotional), meet them fully in that lens, drawing on its real traditions, while staying grounded in what they wrote.
- Speak warmly and directly, as "I" (YOU) to "you". Honest, never moralising, never shaming, never clinical. Sexuality, desire, the body, spirituality, darkness and light are all welcome and are met as meaningful parts of a life, with the same openness as anything else; never add warnings or caveats about them.
- You are a mirror, never an authority. Hold meanings lightly ("It may be…", "One way to see it…"). Never diagnose, never claim to heal or fix, never treat dreams as prophecy. If they wrote their own interpretations, honour them.
- Only claim a pattern their material really shows. If there's little to go on, say so plainly and offer what you can, rather than inventing.
- Never invent events, people or feelings.

Fields:
- "title": a short, evocative title for this reading (under 8 words).
- "opening": two or three sentences that answer the heart of the question directly.
- "sections": two to five parts, each with a short "heading" and a "text" of one to three paragraphs (paragraphs separated by a blank line). Together they go deep: what you see, what it may mean through the lens they asked for, how it has moved over time.
- "echoes": up to five short phrases quoted exactly from their own entries (under 20 words each) that carry the thread, each with its entry "date" (YYYY-MM-DD).
- "question": one question for them to sit with.
- "step": one small, gentle thing they could do or notice next (under 30 words).`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "opening", "sections", "echoes", "question", "step"],
  properties: {
    title: { type: "string" },
    opening: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "text"],
        properties: { heading: { type: "string" }, text: { type: "string" } }
      }
    },
    echoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "words"],
        properties: { date: { type: "string" }, words: { type: "string" } }
      }
    },
    question: { type: "string" },
    step: { type: "string" }
  }
};

// Words that say nothing about what the question is after.
const STOP = new Set(("a about after again all also am an and any are as at be been being but by can could did do does doing " +
  "for from had has have having how i i'm if in into is it its just keep keeps keeping kind like lot make me more most my " +
  "myself no not now of on one or other our out over own perspective point really same so some something tell than that the " +
  "their them then there these they thing things this those through to too up us very view was way we what when where which " +
  "while who why will with would you your yours lens side common mine all").split(" "));

const tagKey = (t: string) => String(t).replace(/^#/, "").toLowerCase();

// "dreams" → "dream", "growing" → "grow": a light stem, enough to match.
function stem(w: string) {
  return w.replace(/(ings|ing|ies|es|s|ed|ly)$/, m => (m === "ies" ? "y" : "")).replace(/(.)\1$/, "$1");
}

// The question's words, stemmed, plus each pair run together, so
// "wet dreams" also finds the tag #wetdream.
function termsOf(question: string) {
  const words = question.toLowerCase().replace(/[^a-z0-9#'\s-]/g, " ").split(/[\s-]+/).map(w => w.replace(/^#|'s$|'/g, "")).filter(Boolean);
  const keep = words.filter(w => w.length > 2 && !STOP.has(w));
  const stems = new Set(keep.map(stem).filter(s => s.length > 2));
  const pairs = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) pairs.add(stem(words[i] + words[i + 1]));
  return { stems, pairs };
}

type Entry = { id: string; content: string; mood: string | null; mood_score: number | null; entry_date: string; tags: string[] | null };

function scoreEntry(e: Entry, t: ReturnType<typeof termsOf>) {
  let score = 0;
  for (const tag of (e.tags || []).map(tagKey).map(stem)) {
    if (t.stems.has(tag) || t.pairs.has(tag)) score += 6;
    else if ([...t.stems].some(s => s.length > 3 && tag.includes(s))) score += 3;
  }
  const text = String(e.content || "").toLowerCase();
  for (const s of t.stems) {
    const hits = text.match(new RegExp(`\\b${s.replace(/[^a-z0-9]/g, "")}`, "g"))?.length || 0;
    score += Math.min(hits, 3);
  }
  return score;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || "").trim().slice(0, MAX_QUESTION);
    if (question.length < 3) return json({ error: "no_question", message: "Ask YOU a question first." }, 400);

    const consent = await requireAiConsent(req, corsHeaders);
    if ("response" in consent) return consent.response;

    const allow = await allowedSources(supabase, user.id);
    const readable = ["journal", "moments", "harvests"].some(s => allow.has(s as never));
    if (!readable) {
      return json({
        error: "source_off",
        message: "YOUnderstanding reads your YOUrnal, Moments and harvests, and you've chosen to keep them from the AI. You can change that under Settings → What AI can read."
      }, 403);
    }

    const limited = await checkDailyLimit(req, corsHeaders);
    if (limited) return limited;

    const terms = termsOf(question);
    const none = Promise.resolve({ data: [] });

    // Reads go through the Seeker's own session, so RLS keeps it to their rows.
    const [{ data: entryRows }, { data: dreamPatterns }, { data: weeklies }, { data: seasons }, { data: momentRows }, { data: items }, compass] = await Promise.all([
      allow.has("journal")
        ? supabase.from("journal_entries").select("id, content, mood, mood_score, entry_date, tags").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(1500)
        : none,
      allow.has("journal")
        ? supabase.from("dream_patterns").select("reading, dream_count, updated_at").eq("user_id", user.id).maybeSingle().then((r: { data: unknown }) => ({ data: r.data ? [r.data] : [] }))
        : none,
      // Weekly reflections are drawn from the YOUrnal.
      allow.has("journal")
        ? supabase.from("weekly_reflections").select("week_start, sections").eq("user_id", user.id).order("week_start", { ascending: false }).limit(12)
        : none,
      supabase.from("seasons").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      allow.has("moments")
        ? supabase.from("life_moments").select("title, description, moment_date").eq("user_id", user.id).order("moment_date", { ascending: false }).limit(400)
        : none,
      allow.has("pursuits")
        ? supabase.from("items").select("name, type, done").eq("user_id", user.id).in("type", ["goal", "dream"]).limit(30)
        : none,
      allow.has("values") ? loadCompass(supabase, user.id) : Promise.resolve(null)
    ]);

    // The entries that speak to the question, most relevant first.
    const entries = ((entryRows || []) as Entry[]).filter(e => String(e.content || "").trim());
    const scored = entries.map(e => ({ e, s: scoreEntry(e, terms) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    const matched = scored.slice(0, MAX_ENTRIES).map(x => x.e);
    // A broad question ("What am I growing toward?") matches little by
    // word, so their latest writing comes along too.
    const picked = new Map(matched.map(e => [e.id, e]));
    if (matched.length < 12) {
      for (const e of entries.slice(0, FILL_RECENT)) if (!picked.has(e.id)) picked.set(e.id, e);
    }
    const chosen = [...picked.values()].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

    const moments = ((momentRows || []) as { title: string; description: string | null; moment_date: string }[])
      .map(m => ({ m, s: scoreEntry({ id: "", content: `${m.title} ${m.description || ""}`, mood: null, mood_score: null, entry_date: m.moment_date, tags: [] }, terms) }))
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 15).map(x => x.m);

    if (!chosen.length && !moments.length && !(seasons || []).length && !(weeklies || []).length) {
      return json({
        empty: true,
        message: "There isn't enough here yet for YOU to read. Write a few YOUrnal entries (tags like #dream help), and ask again."
      });
    }

    // The readings YOU already made for those entries, and mood around them.
    const ids = chosen.map(e => e.id);
    const dates = [...new Set(chosen.map(e => e.entry_date))];
    const [{ data: insights }, { data: moodRows }, { data: earlier }] = await Promise.all([
      ids.length
        ? supabase.from("journal_ai_insights").select("entry_id, summary, insights, reflection_question, dream").eq("user_id", user.id).in("entry_id", ids)
        : none,
      allow.has("mood") && dates.length
        ? supabase.from("mood_log").select("score, mood, date_key").eq("user_id", user.id).in("date_key", dates)
        : none,
      // What they asked before and kept, so YOU can build on it.
      supabase.from("younderstandings").select("question, answer, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3)
    ]);
    // deno-lint-ignore no-explicit-any
    const insightOf = new Map((insights || []).map((i: any) => [i.entry_id, i]));
    // deno-lint-ignore no-explicit-any
    const moodOn = new Map((moodRows || []).map((m: any) => [m.date_key, m.score ?? m.mood]));

    const isDream = (e: Entry) => (e.tags || []).some(t => ["dream", "dreams"].includes(tagKey(t)) || tagKey(t).endsWith("dream"));
    const journal = chosen.map(e => {
      // deno-lint-ignore no-explicit-any
      const r = insightOf.get(e.id) as any;
      return {
        date: e.entry_date,
        ...((e.tags || []).length && { tags: (e.tags || []).map(t => `#${tagKey(t)}`) }),
        ...(e.mood && { mood: e.mood }),
        ...(e.mood_score != null && { mood_out_of_100: e.mood_score }),
        ...(moodOn.has(e.entry_date) && { mood_check_in_that_day: moodOn.get(e.entry_date) }),
        words: String(e.content).trim().slice(0, SNIPPET),
        ...(r && {
          earlier_reflection: {
            ...(r.summary && { summary: r.summary }),
            ...(Array.isArray(r.insights) && r.insights.length && { noticed: r.insights.slice(0, 4) }),
            ...(r.dream && { dream_reading: r.dream })
          }
        })
      };
    });

    const context = {
      ...(journal.length && { journal_entries_oldest_first: journal }),
      ...((dreamPatterns || []).length && { patterns_across_all_their_dreams: (dreamPatterns as { reading: unknown }[])[0].reading }),
      ...((weeklies || []).length && {
        // deno-lint-ignore no-explicit-any
        weekly_reflections: (weeklies || []).map((w: any) => ({ week_of: w.week_start, reflection: w.sections }))
      }),
      ...((seasons || []).length && {
        // deno-lint-ignore no-explicit-any
        seasons_named: (seasons || []).map((s: any) => ({
          named_on: String(s.created_at).slice(0, 10), name: s.name, blurb: s.blurb,
          ...(s.grew && { grew: s.grew }), ...(s.light && { light: s.light }), ...(s.shadow && { shadow: s.shadow })
        }))
      }),
      ...(moments.length && { moments: moments.map(m => ({ date: m.moment_date, moment: m.description ? `${m.title}: ${m.description}` : m.title })) }),
      // deno-lint-ignore no-explicit-any
      ...((items || []).length && { goals_and_dreams: (items || []).map((i: any) => `${i.name} [${i.type}${i.done ? ", done" : ""}]`) }),
      ...(compass && { compass }),
      ...((earlier || []).length && {
        // deno-lint-ignore no-explicit-any
        earlier_questions_they_kept: (earlier || []).map((k: any) => ({ asked_on: String(k.created_at).slice(0, 10), question: k.question, your_opening: k.answer?.opening }))
      })
    };

    const raw = await callClaude({
      system: [SYSTEM, compass ? COMPASS_GUIDANCE : ""].filter(Boolean).join("\n\n"),
      maxTokens: 8000,
      fallbacks: true,
      usage: { req, fn: "ask-younderstanding" },
      jsonSchema: SCHEMA,
      messages: [{
        role: "user",
        content: `THEIR QUESTION\n${question}\n\nDrawn only from what they allow the AI to read: ${[...allow].map(s => SOURCE_NAMES[s]).join(", ")}.\n\n${JSON.stringify(context, null, 2)}`
      }]
    });

    // Echoes are their own words, quoted back; left as written.
    const { value: answer, stats } = moderate(JSON.parse(raw), ["echoes"]);
    if (stats.blocked) return json({ error: "moderated", message: BLOCKED_MESSAGE }, 422);

    const drew_from = {
      entries: chosen.length,
      matched: matched.length,
      dreams: chosen.filter(isDream).length,
      readings: (insights || []).length + (dreamPatterns || []).length + (weeklies || []).length + (seasons || []).length,
      moments: moments.length,
      first: chosen[0]?.entry_date || null,
      last: chosen[chosen.length - 1]?.entry_date || null,
      sources: [...allow]
    };
    return json({ empty: false, question, answer, drew_from });
  } catch (e) {
    console.error("[ask-younderstanding]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
