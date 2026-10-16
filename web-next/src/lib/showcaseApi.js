import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Showcase reads and writes. Pieces arrive from YOUrigin already display-
// sized; the full original never leaves the artist's device. Images sit in
// a private bucket and are shown through short-lived signed links.

const WORK_FIELDS =
  "id,user_id,kind,title,body,image_path,image_width,image_height,alt_text,placements,save_mode,suggested_amount,status,review_note,reviewed_at,live_at,featured_at,submitted_at,kronk_post_url,created_at,credits:showcase_credits(id,role,name,url,kronk_handle,artist_user_id,position)";

async function withArtistsAndImages(works) {
  const userIds = [...new Set(works.map(w => w.user_id))];
  const paths = works.map(w => w.image_path).filter(Boolean);
  const [profilesRes, urlsRes] = await Promise.all([
    userIds.length
      ? supabase.from("artist_profiles").select("user_id,display_name,bio,links,kronk_handle").in("user_id", userIds)
      : { data: [] },
    paths.length ? supabase.storage.from("showcase").createSignedUrls(paths, 3600) : { data: [] }
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (urlsRes.error) throw urlsRes.error;
  const artists = Object.fromEntries((profilesRes.data || []).map(p => [p.user_id, p]));
  const urls = Object.fromEntries((urlsRes.data || []).filter(u => u.signedUrl).map(u => [u.path, u.signedUrl]));
  return works.map(w => ({
    ...w,
    credits: [...(w.credits || [])].sort((a, b) => a.position - b.position),
    artist: artists[w.user_id] || null,
    imageUrl: w.image_path ? urls[w.image_path] || null : null
  }));
}

/** Live pieces, newest feature first. */
export async function loadLiveWorks(limit = 60) {
  const { data, error } = await supabase
    .from("showcase_works")
    .select(WORK_FIELDS)
    .eq("status", "live")
    .order("featured_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withArtistsAndImages(data || []);
}

/** The viewer's own collection: { [workId]: { contributed, created_at } }. */
export async function loadMySaves() {
  const { data, error } = await supabase.from("showcase_saves").select("work_id,contributed,created_at");
  if (error) throw error;
  return Object.fromEntries((data || []).map(s => [s.work_id, s]));
}

export async function saveWork(workId, contributed) {
  const { error } = await supabase.from("showcase_saves").insert({ work_id: workId, contributed: Boolean(contributed) });
  if (error && error.code !== "23505") throw error; // already saved is fine
}

export async function unsaveWork(workId) {
  const { error } = await supabase.from("showcase_saves").delete().eq("work_id", workId);
  if (error) throw error;
}

export async function reportWork(workId, reason) {
  const { error } = await supabase.from("showcase_reports").insert({ work_id: workId, reason: (reason || "").slice(0, 500) });
  if (error && error.code !== "23505") throw error; // reported once already
}

// ── Admin ─────────────────────────────────────────────────────────────────
/** Every piece (admins see all of them under RLS) with its reports. */
export async function loadReviewQueue() {
  const [worksRes, reportsRes] = await Promise.all([
    supabase.from("showcase_works").select(WORK_FIELDS).order("submitted_at", { ascending: false }).limit(200),
    supabase.from("showcase_reports").select("id,work_id,reason,created_at").order("created_at", { ascending: false })
  ]);
  if (worksRes.error) throw worksRes.error;
  if (reportsRes.error) throw reportsRes.error;
  const works = await withArtistsAndImages(worksRes.data || []);
  const reports = {};
  for (const r of reportsRes.data || []) (reports[r.work_id] ||= []).push(r);
  return works.map(w => ({ ...w, reports: reports[w.id] || [] }));
}

/** decision: approve | decline | remove | feature */
export async function reviewWork(id, decision, note) {
  const { error } = await supabase.rpc("review_showcase_work", { p_id: id, p_decision: decision, p_note: note || null });
  if (error) throw error;
}

export async function clearReports(workId) {
  const { error } = await supabase.from("showcase_reports").delete().eq("work_id", workId);
  if (error) throw error;
}

// ── Hook ──────────────────────────────────────────────────────────────────
// One load per visit, shared by Home and the gallery (per signed-in user).
let cache = null;
let cacheUser = null;

export function useShowcase(userId) {
  const [state, setState] = useState(() => (cache && cacheUser === userId ? cache : { works: null, saves: {}, error: "" }));

  const refresh = useCallback(async () => {
    try {
      const [works, saves] = await Promise.all([loadLiveWorks(), loadMySaves()]);
      cache = { works, saves, error: "" };
      cacheUser = userId;
    } catch (e) {
      console.error("[Showcase] load failed:", e);
      cache = { works: cache?.works || [], saves: cache?.saves || {}, error: "Couldn't load the Showcase just now." };
    }
    setState(cache);
  }, [userId]);

  useEffect(() => {
    if (userId && (!cache || cacheUser !== userId)) refresh();
  }, [userId, refresh]);

  const setSaved = useCallback((workId, save) => {
    const saves = { ...(cache?.saves || {}) };
    if (save) saves[workId] = save;
    else delete saves[workId];
    cache = { ...(cache || { works: [], error: "" }), saves };
    setState(cache);
  }, []);

  return { ...state, refresh, setSaved };
}
