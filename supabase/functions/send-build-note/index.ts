// send-build-note — Cassidy's own inbox for edits and ideas, for this app
// and any other project. A note (a reflection tagged #idea, or one typed on
// the Build notes screen) lands in the "Build Notes" database in Cassidy's
// Notion, where Claude reads it in any session.
//
// Admins only (public.admins); for anyone else it does nothing. A reflection
// is matched to its Notion page by "Entry ID", so saving the entry again
// updates the note instead of making a second one.
//
// Body: { text, project?, source?: "Reflection" | "Quick note", entryId?, date? }
//
// Deploy:  supabase functions deploy send-build-note
// Secrets: supabase secrets set NOTION_TOKEN=ntn_... NOTION_BUILD_NOTES_DB=3060b49f46b14abe920feedd9a0562c5
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
const NOTION_DB = Deno.env.get("NOTION_BUILD_NOTES_DB");
const NOTION_VERSION = "2022-06-28";
const TITLE_MAX = 90;
const CHUNK = 1900; // Notion caps one rich-text run at 2000 characters

function notion(path: string, method: string, body?: unknown) {
  return fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// The note's first line, without the tag, short enough to scan in a list.
function titleOf(text: string) {
  const first = text.replace(/#idea\b/gi, "").trim().split("\n")[0].trim() || "Untitled note";
  return first.length > TITLE_MAX ? first.slice(0, TITLE_MAX - 1).trimEnd() + "…" : first;
}

function paragraphs(text: string) {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).slice(0, 90).map(p => {
    const runs = [];
    for (let i = 0; i < p.length; i += CHUNK) runs.push({ type: "text", text: { content: p.slice(i, i + CHUNK) } });
    return { object: "block", type: "paragraph", paragraph: { rich_text: runs } };
  });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!adminRow) return json({ error: "Not available" }, 403);
    if (!NOTION_TOKEN || !NOTION_DB) return json({ error: "Notion isn't connected yet (NOTION_TOKEN / NOTION_BUILD_NOTES_DB)." }, 500);

    const { text, project, source, entryId, date } = await req.json();
    const body = String(text || "").trim();
    if (!body) return json({ error: "Nothing to send" }, 400);

    const properties: Record<string, unknown> = {
      Note: { title: [{ text: { content: titleOf(body) } }] },
      Project: { select: { name: String(project || "YOU app").slice(0, 100) } },
      Source: { select: { name: source === "Reflection" ? "Reflection" : "Quick note" } },
      Written: { date: { start: date || new Date().toISOString().slice(0, 10) } }
    };
    if (entryId) properties["Entry ID"] = { rich_text: [{ text: { content: String(entryId) } }] };

    // A reflection already sent? Update it in place (leaving its Status and
    // Claude's note alone) and replace its body with the new words.
    if (entryId) {
      const found = await notion(`databases/${NOTION_DB}/query`, "POST", {
        filter: { property: "Entry ID", rich_text: { equals: String(entryId) } },
        page_size: 1
      }).then(r => r.json());
      const existing = found?.results?.[0];
      if (existing) {
        await notion(`pages/${existing.id}`, "PATCH", { properties });
        const kids = await notion(`blocks/${existing.id}/children?page_size=100`, "GET").then(r => r.json());
        for (const b of kids?.results || []) await notion(`blocks/${b.id}`, "DELETE");
        await notion(`blocks/${existing.id}/children`, "PATCH", { children: paragraphs(body) });
        return json({ ok: true, url: existing.url, updated: true });
      }
    }

    properties.Status = { status: { name: "New" } };
    const res = await notion("pages", "POST", {
      parent: { database_id: NOTION_DB },
      properties,
      children: paragraphs(body)
    });
    const page = await res.json();
    if (!res.ok) {
      console.error("[send-build-note] Notion said:", page);
      return json({ error: page?.message || "Notion didn't take the note" }, 502);
    }
    return json({ ok: true, url: page.url });
  } catch (e) {
    console.error("[send-build-note]", e);
    return json({ error: "Something went wrong sending the note" }, 500);
  }
});
