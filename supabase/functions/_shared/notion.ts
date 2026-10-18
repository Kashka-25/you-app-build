// Writing to the "Build Notes" database in Cassidy's Notion, shared by
// send-build-note (Cassidy's own notes) and send-feedback (testers).
// Secrets: NOTION_TOKEN, NOTION_BUILD_NOTES_DB.
export const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
export const NOTION_DB = Deno.env.get("NOTION_BUILD_NOTES_DB");
// 2025-09-03: databases hold "data sources", and pages are written to a data
// source. The older version refuses a database once it has more than one.
const NOTION_VERSION = "2025-09-03";
const TITLE_MAX = 90;
const CHUNK = 1900; // Notion caps one rich-text run at 2000 characters

export function notion(path: string, method: string, body?: unknown) {
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

// The "Build Notes" data source inside the database (found by name, so an
// extra data source added in Notion can't break sending). Cached per instance.
let dataSourceId: string | null = null;
export async function buildNotesSource(): Promise<string> {
  if (dataSourceId) return dataSourceId;
  const res = await notion(`databases/${NOTION_DB}`, "GET");
  const db = await res.json();
  if (!res.ok) throw new Error(db?.message || "Couldn't open the Build Notes database");
  const sources: { id: string; name: string }[] = db.data_sources || [];
  const pick = sources.find(d => d.name?.trim() === "Build Notes") || sources[0];
  if (!pick) throw new Error("The Build Notes database has no data source");
  dataSourceId = pick.id;
  return dataSourceId;
}

// The note's first line, without the tag, short enough to scan in a list.
export function titleOf(text: string) {
  const first = text.replace(/#idea\b/gi, "").trim().split("\n")[0].trim() || "Untitled note";
  return first.length > TITLE_MAX ? first.slice(0, TITLE_MAX - 1).trimEnd() + "…" : first;
}

export function paragraphs(text: string) {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).slice(0, 90).map(p => {
    const runs = [];
    for (let i = 0; i < p.length; i += CHUNK) runs.push({ type: "text", text: { content: p.slice(i, i + CHUNK) } });
    return { object: "block", type: "paragraph", paragraph: { rich_text: runs } };
  });
}
