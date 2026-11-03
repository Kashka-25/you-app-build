import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";
import { compressImage } from "./imageCompress";
import { useKronkLink } from "./kronk";

// The Seeker's profile picture (Cassidy, Nov 3): the one they choose, else
// their Kronk picture, else none (the sage orb with their initial). Later
// their Realm avatar can be a third choice here.
//
// A chosen picture lives in their own folder of the private journal-photos
// bucket (<userId>/profile/<time>.webp, which its policies already allow), and
// its path in auth prefs.avatar_path, so no new table is needed. Deleting the
// account removes the folder with everything else.
const BUCKET = "journal-photos";
const PICTURE = { maxEdge: 512, quality: 0.85 };

let signed = { path: null, url: null, at: 0 };

export function useProfilePicture() {
  const { prefs } = useAuth();
  const kronk = useKronkLink();
  const path = prefs?.avatar_path || null;
  const [ownUrl, setOwnUrl] = useState(signed.path === path ? signed.url : null);

  useEffect(() => {
    if (!path) { setOwnUrl(null); return; }
    // Signed links last an hour; reuse one for most of that.
    if (signed.path === path && Date.now() - signed.at < 50 * 60 * 1000) { setOwnUrl(signed.url); return; }
    let live = true;
    supabase.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data, error }) => {
      if (error) { console.error("[profilePicture] link failed:", error); return; }
      signed = { path, url: data.signedUrl, at: Date.now() };
      if (live) setOwnUrl(data.signedUrl);
    });
    return () => { live = false; };
  }, [path]);

  const kronkUrl = kronk?.avatar_url || null;
  return {
    url: ownUrl || (!path ? kronkUrl : null),
    source: path ? "own" : kronkUrl ? "kronk" : null,
    hasOwn: Boolean(path),
    kronkUrl
  };
}

export function useSetProfilePicture() {
  const { userId, prefs, setPrefs } = useAuth();
  const old = prefs?.avatar_path || null;

  async function choose(file) {
    const { blob, ext } = await compressImage(file, PICTURE);
    const path = `${userId}/profile/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
    if (error) throw error;
    await setPrefs({ avatar_path: path });
    if (old) supabase.storage.from(BUCKET).remove([old]).catch(() => {});
  }

  async function clear() {
    await setPrefs({ avatar_path: null });
    if (old) supabase.storage.from(BUCKET).remove([old]).catch(() => {});
  }

  return { choose, clear };
}
