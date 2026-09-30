// Server-side half of the AI consent rule: no reflection text (journal
// entries, photographed pages, memories, questionnaire answers) reaches the
// Claude API unless the Seeker has explicitly said yes in public.ai_consent,
// and hasn't since taken it back. The app asks first; this makes sure a
// stale client or a direct call can't skip that.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Returns the signed-in user's id when they have granted consent, or a
// ready-to-return error Response (401 not signed in, 403 no consent).
export async function requireAiConsent(
  req: Request,
  headers: Record<string, string>
): Promise<{ userId: string } | { response: Response }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: reply({ error: "Unauthorized" }, 401, headers) };

  const { data } = await supabase.from("ai_consent").select("granted").eq("user_id", user.id).maybeSingle();
  if (!data?.granted) {
    return { response: reply({ error: "consent_required" }, 403, headers) };
  }
  return { userId: user.id };
}

function reply(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}
