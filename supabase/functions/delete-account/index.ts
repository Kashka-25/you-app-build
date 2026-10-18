// delete-account — a Seeker removes their account and everything in it.
//
// Signed-in callers only, and only ever their own account: the user comes
// from the caller's token, never from the request body. Photos are removed
// from storage first (storage isn't covered by database cascades), then the
// auth user is deleted, which cascades through every table that references
// auth.users with "on delete cascade". Showcase credits keep the credit text
// but lose the link to the account ("on delete set null").
//
// Body: { confirm: "DELETE" }
// Deploy: supabase functions deploy delete-account
// Needs SUPABASE_SERVICE_ROLE_KEY (set automatically for Edge Functions).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Every bucket stores a Seeker's files under a folder named by their user id.
const BUCKETS = ["journal-photos", "life-moments", "showcase"];
const KRONK_BASE = (Deno.env.get("KRONK_BASE") || "https://kronk.info").replace(/\/$/, "");
const KRONK_CLIENT_ID = Deno.env.get("KRONK_CLIENT_ID");
const KRONK_CLIENT_SECRET = Deno.env.get("KRONK_CLIENT_SECRET");

// Every file under <userId>/ in a bucket, including nested folders.
async function listAll(admin: ReturnType<typeof createClient>, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}: ${error.message}`);
    for (const item of data || []) {
      const path = `${prefix}/${item.name}`;
      // Folders come back without an id.
      if (item.id) paths.push(path);
      else paths.push(...await listAll(admin, bucket, path));
    }
    if (!data || data.length < 1000) break;
  }
  return paths;
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const { data: { user } } = await asCaller.auth.getUser();
    if (!user) return json({ error: "Please sign in again first." }, 401);

    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== "DELETE") return json({ error: "Deleting needs to be confirmed." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    for (const bucket of BUCKETS) {
      const paths = await listAll(admin, bucket, user.id);
      for (let i = 0; i < paths.length; i += 100) {
        const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + 100));
        if (error) throw new Error(`${bucket}: ${error.message}`);
      }
    }

    // A connected Kronk account: take back YOU's access there too.
    const { data: kronkLink } = await admin.from("kronk_links").select("access_token").eq("user_id", user.id).maybeSingle();
    if (kronkLink?.access_token && KRONK_CLIENT_ID && KRONK_CLIENT_SECRET) {
      await fetch(`${KRONK_BASE}/oauth/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: KRONK_CLIENT_ID, client_secret: KRONK_CLIENT_SECRET, token: kronkLink.access_token })
      }).catch(() => null);
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      // Most likely an older table that references auth.users without a
      // cascade. Logged without any of the Seeker's content.
      console.error("[delete-account] deleteUser failed:", error.message);
      return json({ error: "Your photos were removed, but the account couldn't be fully deleted. Please send us a note from the menu and we'll finish it by hand." }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("[delete-account]", e instanceof Error ? e.message : e);
    return json({ error: "Couldn't delete your account just now. Try again in a moment." }, 500);
  }
});
