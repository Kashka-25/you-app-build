// send-feedback — any signed-in tester's "Send feedback" note.
//
// Saved in public.beta_feedback as the tester (RLS: own rows), then
// forwarded to the Build Notes inbox in Notion (Project: YOU app, Source:
// "Beta feedback", Status: New). If Notion is unreachable the note is still
// kept in the table, so nothing is lost. The Notion page names the tester
// only by a short reference (the start of their user id), never their email.
//
// At most 10 notes per tester per 24 hours, a backstop against accidents.
//
// Body: { text, kind?: "idea" | "problem" | "love", screen? }
// Deploy:  supabase functions deploy send-feedback
// Secrets: the same NOTION_TOKEN / NOTION_BUILD_NOTES_DB as send-build-note.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";
import { NOTION_TOKEN, NOTION_DB, notion, buildNotesSource, titleOf, paragraphs } from "../_shared/notion.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const DAILY_LIMIT = 10;
const KIND_LABEL: Record<string, string> = { idea: "An idea", problem: "Something's not right", love: "Something I love" };

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Please sign in again first." }, 401);

    const { text, kind, screen } = await req.json().catch(() => ({}));
    const body = String(text || "").trim().slice(0, 5000);
    if (!body) return json({ error: "Nothing to send yet." }, 400);
    const k = kind in KIND_LABEL ? kind : "idea";
    const where = screen ? String(screen).slice(0, 200) : null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from("beta_feedback").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return json({ error: "That's a lot of notes today, thank you! Save the rest for tomorrow." }, 429);
    }

    const { data: row, error: insErr } = await supabase.from("beta_feedback")
      .insert({ user_id: user.id, body, kind: k, screen: where }).select("id").single();
    if (insErr) {
      console.error("[send-feedback] insert failed:", insErr.message);
      return json({ error: "Couldn't send that just now. Try again in a moment." }, 500);
    }

    // Forwarding is a bonus; the note is already safe in the table.
    if (NOTION_TOKEN && NOTION_DB) {
      try {
        const footer = `${KIND_LABEL[k]} · from tester ${user.id.slice(0, 8)}${where ? ` · on ${where}` : ""}`;
        const res = await notion("pages", "POST", {
          parent: { type: "data_source_id", data_source_id: await buildNotesSource() },
          properties: {
            Note: { title: [{ text: { content: titleOf(body) } }] },
            Project: { select: { name: "YOU app" } },
            Source: { select: { name: "Beta feedback" } },
            Status: { status: { name: "New" } },
            Written: { date: { start: new Date().toISOString().slice(0, 10) } },
            "Entry ID": { rich_text: [{ text: { content: `feedback:${row.id}` } }] }
          },
          children: paragraphs(`${body}\n\n${footer}`)
        });
        const page = await res.json();
        if (res.ok) await supabase.from("beta_feedback").update({ notion_url: page.url }).eq("id", row.id);
        else console.error("[send-feedback] Notion said:", page?.message);
      } catch (e) {
        console.error("[send-feedback] Notion forward failed:", e instanceof Error ? e.message : e);
      }
    }
    return json({ ok: true });
  } catch (e) {
    console.error("[send-feedback]", e instanceof Error ? e.message : e);
    return json({ error: "Couldn't send that just now. Try again in a moment." }, 500);
  }
});
