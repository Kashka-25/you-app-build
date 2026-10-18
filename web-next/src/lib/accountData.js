import { supabase } from "./supabaseClient";

// Everything a Seeker owns, for "Download my data". Each table is read with
// its owner column as well as RLS, so shared tables (Showcase, the Codex)
// only give back the Seeker's own rows. Add a table here when one is made.
const OWN_TABLES = [
  ["profiles", "id"],
  "journal_entries", "journal_highlights", "journal_photos", "journal_ai_insights", "reflections",
  "weekly_reflections", "mood_log", "memory", "life_moments", "life_chapters", "seasons",
  "items", "todos", "week_intentions", "week_harvests", "focus_sessions",
  "user_values", "value_challenges", "value_compass", "value_words", "identity_visions",
  "wanderings", "wandering_stops",
  "user_arcana", "arcanum_progress", "arcanum_walks", "own_tools", "tool_uses",
  "artist_profiles", "showcase_works", "showcase_saves",
  "ai_consent", "entitlements"
].map(t => (Array.isArray(t) ? t : [t, "user_id"]));

export async function exportMyData(userId) {
  const out = { exported_at: new Date().toISOString(), app: "YOU — Your Own Universe", tables: {}, skipped: [] };
  for (const [table, column] of OWN_TABLES) {
    const rows = [];
    // Pages of 1000, Supabase's default cap per request.
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select("*").eq(column, userId).range(from, from + 999);
      if (error) { out.skipped.push({ table, reason: error.message }); break; }
      rows.push(...data);
      if (data.length < 1000) break;
    }
    if (rows.length) out.tables[table] = rows;
  }
  return out;
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Removes the account and everything in it (see supabase/functions/delete-account).
export async function deleteMyAccount() {
  const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
  if (error) {
    let message = "Couldn't delete your account just now. Nothing was removed. Try again, or send us feedback.";
    try { message = (await error.context.json()).error || message; } catch { /* keep the gentle default */ }
    throw new Error(message);
  }
  return data;
}
