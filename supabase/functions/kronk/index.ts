// kronk — YOU and Kronk (kronk.info, a Mastodon server), linked.
//
// Actions (POST body { action, ... }):
//   start      { mode: "link" | "signin", origin }  → { url } to send the browser to Kronk
//   finish     { code, state }                       → link: { handle }  ·  signin: { token_hash, created }
//   disconnect {}                                     → revokes YOU's access on Kronk and forgets it
//   timeline   { feed, limit?, max_id?, since_id? }  → { posts: [...] } in a safe, plain shape
//   post       { text, visibility, in_reply_to? }    → { url }
//   like       { id, on }                            → { liked, likes }
//   thread     { id }                                → { replies: [...] }
//
// "link" connects the signed-in Seeker's Kronk account. "signin" is
// "Continue with Kronk": it signs in the YOU account linked to that Kronk
// account, or creates one for someone who only has Kronk. Either way the
// `state` round-trip is HMAC-signed and bound to the mode, the origin and
// (for link) the YOU user, so nobody can link or sign in as someone else.
//
// The Kronk access token lives only in kronk_links.access_token, which
// Seekers can't read. Post content is turned into plain text here, so the
// app never renders Kronk's HTML.
//
// Secrets: KRONK_BASE, KRONK_CLIENT_ID, KRONK_CLIENT_SECRET, KRONK_STATE_SECRET
// (app registered on kronk.info Oct 18 as "YOU - Your Own Universe").
// Deploy:  supabase functions deploy kronk
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KRONK = (Deno.env.get("KRONK_BASE") || "https://kronk.info").replace(/\/$/, "");
const KRONK_HOST = new URL(KRONK).host;
const CLIENT_ID = Deno.env.get("KRONK_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("KRONK_CLIENT_SECRET")!;
const STATE_SECRET = Deno.env.get("KRONK_STATE_SECRET")!;
// write:favourites added Oct 18 for likes; links made before then are asked
// to connect again the first time they like something.
const SCOPES = "read write:statuses write:favourites";
// Must match the redirect URIs registered on kronk.info.
const ORIGINS = ["https://you.kronk.info", "https://you-app-build.netlify.app", "http://localhost:5173"];
const STATE_TTL_MS = 15 * 60 * 1000;
// Kronk-only Seekers get a placeholder address that can never receive mail;
// they sign in with Kronk.
const KRONK_EMAIL_DOMAIN = "kronk-login.invalid";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ── signed state ────────────────────────────────────────────────────────
const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
let hmacKey: CryptoKey | null = null;
async function sign(data: string) {
  hmacKey ||= await crypto.subtle.importKey("raw", enc.encode(STATE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, enc.encode(data))));
}
type State = { m: "link" | "signin"; u: string | null; o: string; e: number; n: string };
async function makeState(s: State) {
  const body = b64url(enc.encode(JSON.stringify(s)));
  return `${body}.${await sign(body)}`;
}
async function readState(raw: string): Promise<State | null> {
  const [body, mac] = String(raw || "").split(".");
  if (!body || !mac || (await sign(body)) !== mac) return null;
  const s = JSON.parse(new TextDecoder().decode(fromB64url(body))) as State;
  return s.e > Date.now() && ORIGINS.includes(s.o) ? s : null;
}

// ── Kronk calls ─────────────────────────────────────────────────────────
async function kronk(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${KRONK}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers || {}) }
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

function handleOf(acct: string) {
  return acct.includes("@") ? `@${acct}` : `@${acct}@${KRONK_HOST}`;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
function htmlToText(html: string) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .trim();
}
const https = (u: unknown) => (typeof u === "string" && u.startsWith("https://") ? u : null);

// deno-lint-ignore no-explicit-any
function shapePost(s: any) {
  const shown = s.reblog || s;
  return {
    id: s.id,
    // Likes and replies act on the post itself, not a boost of it.
    target_id: shown.id,
    visibility: shown.visibility,
    liked: Boolean(shown.favourited),
    url: https(shown.url) || https(shown.uri),
    created_at: shown.created_at,
    boosted_by: s.reblog ? { name: s.account?.display_name || s.account?.username, handle: handleOf(s.account?.acct || "") } : null,
    account: {
      name: shown.account?.display_name || shown.account?.username || "",
      handle: handleOf(shown.account?.acct || ""),
      avatar: https(shown.account?.avatar_static) || https(shown.account?.avatar),
      url: https(shown.account?.url)
    },
    warning: shown.spoiler_text || "",
    text: htmlToText(shown.content),
    media: (shown.media_attachments || [])
      .filter((m: { type: string }) => m.type === "image" || m.type === "gifv")
      .slice(0, 4)
      .map((m: { preview_url: string; url: string; description: string | null }) => ({ preview: https(m.preview_url), full: https(m.url), alt: m.description || "" }))
      .filter((m: { preview: string | null }) => m.preview),
    replies: shown.replies_count || 0,
    boosts: shown.reblogs_count || 0,
    likes: shown.favourites_count || 0
  };
}

async function callerId(req: Request) {
  const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
  });
  const { data: { user } } = await asCaller.auth.getUser();
  return user;
}

async function tokenFor(userId: string) {
  const { data } = await admin.from("kronk_links").select("access_token").eq("user_id", userId).maybeSingle();
  return data?.access_token as string | undefined;
}

// ── actions ─────────────────────────────────────────────────────────────
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "start") {
      const mode = body.mode === "signin" ? "signin" : "link";
      const origin = String(body.origin || "");
      if (!ORIGINS.includes(origin)) return json({ error: "This address can't connect to Kronk yet." }, 400);
      let userId: string | null = null;
      if (mode === "link") {
        const user = await callerId(req);
        if (!user) return json({ error: "Please sign in to YOU first." }, 401);
        userId = user.id;
      }
      const state = await makeState({ m: mode, u: userId, o: origin, e: Date.now() + STATE_TTL_MS, n: crypto.randomUUID() });
      const url = new URL(`${KRONK}/oauth/authorize`);
      url.search = new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: `${origin}/kronk/callback`,
        scope: SCOPES,
        state
      }).toString();
      return json({ url: url.toString() });
    }

    if (action === "finish") {
      const state = await readState(body.state);
      if (!state) return json({ error: "That Kronk link has expired. Please try again." }, 400);

      const tokenRes = await fetch(`${KRONK}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: String(body.code || ""),
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: `${state.o}/kronk/callback`,
          scope: SCOPES
        })
      });
      const tok = await tokenRes.json().catch(() => null);
      if (!tokenRes.ok || !tok?.access_token) return json({ error: "Kronk didn't confirm the connection. Please try again." }, 502);

      const me = await kronk("/api/v1/accounts/verify_credentials", tok.access_token);
      if (!me.ok || !me.body?.id) return json({ error: "Couldn't read your Kronk account. Please try again." }, 502);
      const account = me.body;
      const row = {
        kronk_account_id: String(account.id),
        handle: handleOf(account.acct || account.username),
        display_name: String(account.display_name || account.username || "").slice(0, 120),
        avatar_url: https(account.avatar_static) || https(account.avatar),
        profile_url: https(account.url),
        access_token: tok.access_token as string,
        scopes: String(tok.scope || SCOPES),
        updated_at: new Date().toISOString()
      };
      const { data: existing } = await admin.from("kronk_links").select("user_id").eq("kronk_account_id", row.kronk_account_id).maybeSingle();

      if (state.m === "link") {
        const user = await callerId(req);
        if (!user || user.id !== state.u) return json({ error: "Please sign in to YOU as the same person, then connect again." }, 401);
        if (existing && existing.user_id !== user.id) {
          return json({ error: `${row.handle} is already connected to another YOU account.` }, 409);
        }
        const { error } = await admin.from("kronk_links").upsert({ user_id: user.id, ...row }, { onConflict: "user_id" });
        if (error) throw new Error(error.message);
        // Fill the Showcase artist profile's Kronk handle if it's still empty.
        await admin.from("artist_profiles").update({ kronk_handle: row.handle }).eq("user_id", user.id).is("kronk_handle", null);
        return json({ handle: row.handle });
      }

      // signin: the linked YOU account, or a new one for a Kronk-only Seeker.
      let userId = existing?.user_id as string | undefined;
      let created = false;
      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email: `kronk-${row.kronk_account_id}@${KRONK_EMAIL_DOMAIN}`,
          email_confirm: true,
          user_metadata: { name: row.display_name, signed_up_with: "kronk", kronk_handle: row.handle }
        });
        if (error || !data.user) throw new Error(error?.message || "createUser failed");
        userId = data.user.id;
        created = true;
        // The profile row comes from the signup trigger; give it their Kronk name.
        if (row.display_name) await admin.from("profiles").update({ name: row.display_name }).eq("id", userId).or("name.is.null,name.eq.");
      }
      const { error: linkErr } = await admin.from("kronk_links").upsert({ user_id: userId, ...row }, { onConflict: "user_id" });
      if (linkErr) throw new Error(linkErr.message);

      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;
      if (!email) throw new Error("linked user has no email");
      const { data: link, error: linkGenErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkGenErr || !link?.properties?.hashed_token) throw new Error(linkGenErr?.message || "generateLink failed");
      return json({ token_hash: link.properties.hashed_token, created });
    }

    // Everything below acts for a signed-in Seeker with a Kronk link.
    const user = await callerId(req);
    if (!user) return json({ error: "Please sign in again first." }, 401);

    if (action === "disconnect") {
      if (user.email?.endsWith(`@${KRONK_EMAIL_DOMAIN}`)) {
        return json({ error: "You sign in to YOU with Kronk, so it can't be disconnected yet." }, 400);
      }
      const token = await tokenFor(user.id);
      if (token) {
        await fetch(`${KRONK}/oauth/revoke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, token })
        }).catch(() => null);
      }
      await admin.from("kronk_links").delete().eq("user_id", user.id);
      return json({ ok: true });
    }

    const token = await tokenFor(user.id);
    if (!token) return json({ error: "Connect your Kronk account first.", code: "not_linked" }, 400);

    if (action === "timeline") {
      const path = body.feed === "local" ? "/api/v1/timelines/public" : "/api/v1/timelines/home";
      const limit = Math.min(20, Math.max(1, parseInt(body.limit, 10) || 20));
      const q = new URLSearchParams({ limit: String(limit) });
      if (body.feed === "local") q.set("local", "true");
      if (body.max_id && /^\d+$/.test(String(body.max_id))) q.set("max_id", String(body.max_id));
      // "Anything new since this one?" for the new-posts pill.
      if (body.since_id && /^\d+$/.test(String(body.since_id))) q.set("since_id", String(body.since_id));
      const res = await kronk(`${path}?${q}`, token);
      if (res.status === 401) return json({ error: "Kronk has signed YOU out. Please connect again.", code: "relink" }, 401);
      if (!res.ok || !Array.isArray(res.body)) return json({ error: "Kronk didn't answer just now. Try again in a moment." }, 502);
      return json({ posts: res.body.map(shapePost) });
    }

    const statusId = /^\d+$/.test(String(body.id || "")) ? String(body.id) : null;
    // A token from before a scope was added can't do the new thing.
    const scopeShort = (status: number) => status === 403
      ? json({ error: "Kronk needs a fresh yes from you for this. Please connect again.", code: "relink" }, 403)
      : null;

    if (action === "like") {
      if (!statusId) return json({ error: "Unknown post" }, 400);
      const res = await kronk(`/api/v1/statuses/${statusId}/${body.on ? "favourite" : "unfavourite"}`, token, { method: "POST" });
      if (res.status === 401) return json({ error: "Kronk has signed YOU out. Please connect again.", code: "relink" }, 401);
      const short = scopeShort(res.status);
      if (short) return short;
      if (!res.ok) return json({ error: "Kronk didn't take that just now. Try again in a moment." }, 502);
      return json({ liked: Boolean(res.body?.favourited), likes: res.body?.favourites_count || 0 });
    }

    if (action === "thread") {
      if (!statusId) return json({ error: "Unknown post" }, 400);
      const res = await kronk(`/api/v1/statuses/${statusId}/context`, token);
      if (res.status === 401) return json({ error: "Kronk has signed YOU out. Please connect again.", code: "relink" }, 401);
      if (!res.ok) return json({ error: "Couldn't open the conversation just now." }, 502);
      return json({ replies: (res.body?.descendants || []).slice(0, 60).map(shapePost) });
    }

    if (action === "post") {
      const text = String(body.text || "").trim().slice(0, 5000);
      if (!text) return json({ error: "Nothing to post yet." }, 400);
      const visibility = ["public", "unlisted", "private"].includes(body.visibility) ? body.visibility : "public";
      const replyTo = /^\d+$/.test(String(body.in_reply_to || "")) ? String(body.in_reply_to) : undefined;
      const res = await kronk("/api/v1/statuses", token, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ status: text, visibility, in_reply_to_id: replyTo })
      });
      if (res.status === 401) return json({ error: "Kronk has signed YOU out. Please connect again.", code: "relink" }, 401);
      if (!res.ok) return json({ error: res.body?.error || "Kronk didn't take that post. Try again in a moment." }, 502);
      return json({ url: https(res.body?.url) });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[kronk]", e instanceof Error ? e.message : e);
    return json({ error: "Something went wrong talking to Kronk. Try again in a moment." }, 500);
  }
});
