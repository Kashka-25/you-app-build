// AI cost guard for the beta, checked before every Claude call. Three
// caps, all counted from public.ai_usage (every call is logged there with
// its model and tokens, so real cost can be worked out):
//
//   1. Whole-app monthly budget  (AI_MONTHLY_BUDGET_USD, default $20)
//      Once reached, AI pauses for everyone until the 1st (UTC). Nothing
//      else in the app is affected.
//   2. Per-Seeker monthly allowance (AI_USER_MONTHLY_USD, default $1)
//   3. Per-Seeker daily call cap   (AI_DAILY_LIMIT, default 30 calls per
//      rolling 24 hours), a backstop against runaway bugs.
//
// Change any of them with a Supabase secret; no code change needed.
// If usage can't be read, the call is allowed rather than locking people
// out. The hard backstop is the spend limit on the Anthropic API key itself.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DAILY_LIMIT = Number(Deno.env.get("AI_DAILY_LIMIT") || 30);
const USER_MONTHLY_USD = Number(Deno.env.get("AI_USER_MONTHLY_USD") || 1);
const MONTHLY_BUDGET_USD = Number(Deno.env.get("AI_MONTHLY_BUDGET_USD") || 20);

// US$ per million tokens [input, output]. Unknown models are priced
// high on purpose, so a mistake errs toward caution.
const PRICES: [RegExp, number, number][] = [
  [/^claude-opus-5-5/, 4, 20],
  [/^claude-sonnet-5/, 2, 10],
  [/^claude-haiku-4-5/, 1, 5],
  [/^claude-opus/, 5, 25]
];
export function callCostUsd(model: string | null, input: number, output: number): number {
  const p = PRICES.find(([r]) => r.test(model || "")) || [null, 10, 50];
  return (input * p[1] + output * p[2]) / 1_000_000;
}

const admin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function refuse(headers: Record<string, string>, error: string, message: string) {
  return new Response(JSON.stringify({ error, message }), {
    status: 429,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

// Returns a ready-to-send Response (401 not signed in, 429 a cap is
// reached), or null to carry on.
export async function checkDailyLimit(
  req: Request,
  headers: Record<string, string>
): Promise<Response | null> {
  try {
    if (!admin) return null;
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    // Signed-in Seekers only: a caller with just the public anon key has
    // no user, and would otherwise slip past every cap.
    const { data } = token ? await admin.auth.getUser(token) : { data: null };
    const userId = data?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Paged: a read returns at most 1000 rows, and a busy month has more.
    const rows: { user_id: string | null; model: string | null; input_tokens: number; output_tokens: number; created_at: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data: page, error } = await admin
        .from("ai_usage")
        .select("user_id, model, input_tokens, output_tokens, created_at")
        .gte("created_at", monthStart)
        .order("id")
        .range(from, from + 999);
      if (error) {
        console.error("[limit] usage read failed:", error.message);
        return null;
      }
      rows.push(...(page || []));
      if (!page || page.length < 1000) break;
    }

    const cost = (r: { model: string | null; input_tokens: number; output_tokens: number }) =>
      callCostUsd(r.model, r.input_tokens || 0, r.output_tokens || 0);
    const total = (rows || []).reduce((s, r) => s + cost(r), 0);
    const mine = (rows || []).filter(r => r.user_id === userId);
    const mineMonth = mine.reduce((s, r) => s + cost(r), 0);
    const mineToday = mine.filter(r => r.created_at >= dayAgo).length;

    if (total >= MONTHLY_BUDGET_USD) {
      return refuse(headers, "budget_paused",
        "AI reflections are resting until the start of next month while YOU is in beta. Everything else works as usual, and anything you write is saved.");
    }
    if (mineMonth >= USER_MONTHLY_USD) {
      return refuse(headers, "monthly_allowance",
        "You've used this month's AI reflections for the beta. They come back on the 1st. Everything else works as usual, and anything you write is saved.");
    }
    if (mineToday >= DAILY_LIMIT) {
      return refuse(headers, "daily_limit",
        "You've reached today's limit for AI reflections. It resets over the next day. Everything you write is still saved.");
    }
    return null;
  } catch (e) {
    console.error("[limit] check failed:", e);
    return null;
  }
}
