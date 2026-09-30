// Records token usage for every Claude call into public.ai_usage.
// Never throws - a logging failure must not break the Seeker's request.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const admin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

async function userIdFrom(req?: Request): Promise<string | null> {
  if (!admin || !req) return null;
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data?.user?.id ?? null;
}

export async function logUsage(
  { req, fn, data }: { req?: Request; fn: string; data: any }
) {
  try {
    if (!admin) return;
    const user_id = await userIdFrom(req);
    await admin.from("ai_usage").insert({
      user_id,
      fn,
      model: data?.model ?? null,
      input_tokens: data?.usage?.input_tokens ?? 0,
      output_tokens: data?.usage?.output_tokens ?? 0
    });
  } catch (e) {
    console.error("ai_usage log failed:", e);
  }
}