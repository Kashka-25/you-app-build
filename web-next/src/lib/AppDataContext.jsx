import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import {
  XP_VALS, PILLARS, PILLAR_COLORS, VALUE_PILLAR, VALUE_PILLAR2,
  STREAK_BONUS_INTERVAL, STREAK_BONUS_XP, getLevel, getTier
} from "../constants/app.const";
import { ALL_VALUES_LIB } from "../constants/values.const";

const AppDataContext = createContext(null);

// How long we'll wait on Supabase before giving up and rendering with
// whatever's in local state. Keeps the app usable even if the backend is
// unreachable (e.g. a paused free-tier Supabase project).
const LOAD_TIMEOUT_MS = 8000;

function todayKey() {
  return new Date().toISOString().split("T")[0];
}
function niceDate() {
  return new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function dbToItem(row) {
  return {
    id: row.id, name: row.name, type: row.type, cat: row.cat, note: row.note || "",
    tags: row.tags || [], intention: row.intention || "", milestones: row.milestones || [],
    done: row.done, streak: row.streak || 0,
    days: row.days || [false, false, false, false, false, false, false],
    lastCheckin: row.last_checkin || null, created: row.created, createdDate: row.created_date
  };
}
function itemToRow(item, userId) {
  const row = {
    user_id: userId, name: item.name, type: item.type, cat: item.cat, note: item.note || "",
    tags: item.tags || [], intention: item.intention || "", milestones: item.milestones || [],
    done: item.done, streak: item.streak || 0,
    days: item.days || [false, false, false, false, false, false, false],
    last_checkin: item.lastCheckin || null, created: item.created, created_date: item.createdDate
  };
  if (item.id && item.id.toString().indexOf("temp_") !== 0) row.id = item.id;
  return row;
}

export function AppDataProvider({ children }) {
  const { userId, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [memory, setMemory] = useState([]);
  const [moodLog, setMoodLog] = useState([]);
  const [values, setValues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [moments, setMoments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [valueChallenges, setValueChallenges] = useState([]);
  const [sync, setSync] = useState("idle");
  const [loaded, setLoaded] = useState(false);

  // life_moments photos live in a private storage bucket, so a usable
  // <img> URL has to be signed per file rather than read straight off the
  // row. Signed URLs expire, so this always regenerates rather than
  // trusting anything persisted.
  const attachSignedPhotoUrls = useCallback(async (rows) => {
    const withPhotos = rows.filter(r => r.photo_path);
    if (withPhotos.length === 0) return rows;
    const signed = await Promise.all(
      withPhotos.map(r => supabase.storage.from("life-moments").createSignedUrl(r.photo_path, 3600))
    );
    const urlByPath = {};
    withPhotos.forEach((r, i) => { urlByPath[r.photo_path] = signed[i]?.data?.signedUrl || null; });
    return rows.map(r => ({ ...r, photo_url: r.photo_path ? urlByPath[r.photo_path] : null }));
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setSync("loading");
    try {
      // Guard against Supabase being unreachable (paused project, network/
      // firewall issue, etc). Without this, a request that never settles
      // leaves `loaded` false forever and the whole app is stuck on a
      // loading screen. If the queries don't come back within LOAD_TIMEOUT_MS,
      // fall through to the catch below and let the app render with
      // whatever's already in local state (empty on first run) instead of
      // hanging indefinitely.
      const withTimeout = (promise, ms) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Supabase request timed out after ${ms}ms`)), ms))
        ]);

      const [itemsRes, memoryRes, moodRes, valuesRes, profileRes, momentsRes, chaptersRes, valueChallengesRes] = await withTimeout(
        Promise.all([
          supabase.from("items").select("*").eq("user_id", userId).order("inserted_at"),
          supabase.from("memory").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }),
          supabase.from("mood_log").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }).limit(90),
          supabase.from("user_values").select("*").eq("user_id", userId),
          supabase.from("profiles").select("*").eq("user_id", userId).single(),
          supabase.from("life_moments").select("*").eq("user_id", userId).order("moment_date", { ascending: false }),
          supabase.from("life_chapters").select("*").eq("user_id", userId).order("range_start", { ascending: false }),
          supabase.from("value_challenges").select("*").eq("user_id", userId).order("inserted_at", { ascending: false })
        ]),
        LOAD_TIMEOUT_MS
      );
      setItems((itemsRes.data || []).map(dbToItem));
      setMemory(memoryRes.data || []);
      setMoodLog(moodRes.data || []);
      setValues((valuesRes.data || []).map(r => ({ name: r.name, rating: r.rating || 0, completed: r.completed || [] })));
      setProfile(profileRes.data || null);
      setMoments(await attachSignedPhotoUrls(momentsRes.data || []));
      setChapters(chaptersRes.data || []);
      setValueChallenges(valueChallengesRes.data || []);
      setSync("synced");
    } catch (e) {
      console.error("[AppDataContext] load failed — continuing with local/empty state:", e);
      setSync("offline");
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const totalXP = useMemo(() => memory.reduce((s, m) => s + (m.xp || 0), 0), [memory]);
  const level = useMemo(() => getLevel(totalXP), [totalXP]);

  const pillars = useMemo(() => {
    const xp = Object.fromEntries(PILLARS.map(p => [p, 0]));
    const counts = Object.fromEntries(PILLARS.map(p => [p, 0]));
    const streaks = Object.fromEntries(PILLARS.map(p => [p, 0]));
    memory.forEach(m => { if (m.cat && xp[m.cat] !== undefined) xp[m.cat] += (m.xp || 0); });
    items.filter(i => !i.done).forEach(i => {
      if (i.cat && counts[i.cat] !== undefined) {
        counts[i.cat]++;
        if (i.streak > streaks[i.cat]) streaks[i.cat] = i.streak;
      }
    });
    const maxXp = Math.max(...PILLARS.map(p => xp[p]), 1);
    return PILLARS.map(p => ({
      name: p, xp: xp[p], pct: Math.round((xp[p] / maxXp) * 100),
      active: counts[p], bestStreak: streaks[p], color: PILLAR_COLORS[p]
    }));
  }, [memory, items]);

  async function saveItemRow(item) {
    const row = itemToRow(item, userId);
    const res = await supabase.from("items").upsert(row).select().single();
    if (res.data) item.id = res.data.id;
    setSync("synced");
  }

  async function addItem({ name, type, cat, note, tags, milestones, intention }) {
    const item = {
      id: "temp_" + Date.now(), name, type, cat, note: note || "",
      tags: tags || [], milestones: (milestones || []).map(m => ({ text: m.text, done: false })),
      done: false, streak: 0, days: [false, false, false, false, false, false, false],
      lastCheckin: null, intention: intention || "", created: niceDate(), createdDate: todayKey()
    };
    setItems(prev => [...prev, item]);
    await saveItemRow(item);
    return item;
  }

  async function completeItem(id, reflection) {
    const item = items.find(i => i.id === id);
    if (!item || item.done) return;
    const xp = XP_VALS[item.type] || 10;
    const updated = { ...item, done: true, note: reflection ? (item.note ? item.note + " | " + reflection : reflection) : item.note };
    const entry = {
      name: item.name, type: item.type, xp, date: niceDate(), date_key: todayKey(),
      cat: item.cat, tags: item.tags || [], itemId: item.id
    };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    setMemory(prev => [entry, ...prev]);
    await saveItemRow(updated);
    const res = await supabase.from("memory").insert({
      user_id: userId, name: entry.name, type: entry.type, xp: entry.xp,
      date: entry.date, date_key: entry.date_key, cat: entry.cat || null, tags: entry.tags || null
    }).select().single();
    if (res.data) load();
  }

  async function unachieveItem(id) {
    const item = items.find(i => i.id === id);
    if (!item || !item.done) return;
    const xpToRemove = XP_VALS[item.type] || 10;
    const memIdx = memory.findIndex(m => m.itemId === id || (m.name === item.name && m.xp === xpToRemove));
    const updated = { ...item, done: false };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    if (memIdx >= 0) {
      const memEntry = memory[memIdx];
      setMemory(prev => prev.filter((_, i) => i !== memIdx));
      if (memEntry.id) await supabase.from("memory").delete().eq("id", memEntry.id).eq("user_id", userId);
    }
    await saveItemRow(updated);
  }

  async function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("items").delete().eq("id", id).eq("user_id", userId);
  }

  async function editItem(id, updates) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, ...updates };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    await saveItemRow(updated);
  }

  // Prestige tier is derived from the memory log (how many times this item's
  // 7-day cycle has been completed and reset) rather than a new items-table
  // column, so it can't drift out of sync and needs no schema change.
  function getPrestigeTier(item) {
    const marker = `${item.name} (prestige)`;
    return memory.filter(m => m.name === marker).length;
  }

  // Check-in XP must be idempotent per day-slot within the current prestige
  // cycle: once awarded, a day can be undone (toggled off) to correct a
  // mistake, but never re-awarded by toggling back on. Streak itself is
  // derived from the days array (count of checked slots), not tracked
  // incrementally, so it can never drift from actual completions -- and
  // since there are exactly 7 slots, streak can only reach 7 when every day
  // is checked, which is exactly the prestige trigger.
  async function toggleDay(id, dayIndex) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const today = todayKey();
    const cycle = getPrestigeTier(item);
    const checkinName = `${item.name} (check-in #${dayIndex} cycle ${cycle})`;

    if (item.days[dayIndex]) {
      // Undo: reverse the checkmark and its XP contribution, but the
      // marker entry itself must survive (zeroed, not deleted) -- it's the
      // permanent "this slot was already used" lock. Deleting it here would
      // let a following re-check slip past the guard below and re-award,
      // which is the exact exploit this is meant to close.
      const days = [...item.days]; days[dayIndex] = false;
      const updated = { ...item, days, streak: days.filter(Boolean).length };
      setItems(prev => prev.map(i => (i.id === id ? updated : i)));
      const memIdx = memory.findIndex(m => m.name === checkinName);
      if (memIdx >= 0) {
        const memEntry = memory[memIdx];
        setMemory(prev => prev.map((m, i) => (i === memIdx ? { ...m, xp: 0 } : m)));
        if (memEntry.id) await supabase.from("memory").update({ xp: 0 }).eq("id", memEntry.id).eq("user_id", userId);
      }
      await saveItemRow(updated);
      return;
    }

    // Already awarded once this cycle (regardless of whether it was since
    // undone/zeroed) -- locked, no re-award.
    if (memory.some(m => m.name === checkinName)) return;

    const days = [...item.days]; days[dayIndex] = true;
    const streak = days.filter(Boolean).length;
    const bonus = streak > 0 && streak % STREAK_BONUS_INTERVAL === 0 ? STREAK_BONUS_XP : 0;
    const totalXp = 3 + bonus;
    const updated = { ...item, days, streak, lastCheckin: today };
    const entry = { name: checkinName, type: "habit", xp: totalXp, date: niceDate(), date_key: today, cat: item.cat, tags: item.tags || [] };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    setMemory(prev => [entry, ...prev]);
    await saveItemRow(updated);
    const res = await supabase.from("memory").insert({
      user_id: userId, name: entry.name, type: entry.type, xp: entry.xp,
      date: entry.date, date_key: entry.date_key, cat: entry.cat, tags: entry.tags
    }).select().single();
    if (res.data) setMemory(prev => prev.map(m => (m === entry ? { ...m, id: res.data.id } : m)));
  }

  // Offered once a habit's streak hits 7 (all days checked): resets the
  // days/streak to start a new cycle and permanently records the completed
  // cycle (drives the prestige badge via getPrestigeTier). Doesn't touch
  // XP already earned -- it's a fresh-start ritual, not a penalty.
  async function prestigeItem(id) {
    const item = items.find(i => i.id === id);
    if (!item || item.streak < 7) return;
    const days = [false, false, false, false, false, false, false];
    const updated = { ...item, days, streak: 0, lastCheckin: null };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    await saveItemRow(updated);
    const entry = { name: `${item.name} (prestige)`, type: "prestige", xp: 0, date: niceDate(), date_key: todayKey(), cat: item.cat, tags: [] };
    setMemory(prev => [entry, ...prev]);
    const res = await supabase.from("memory").insert({
      user_id: userId, name: entry.name, type: entry.type, xp: entry.xp,
      date: entry.date, date_key: entry.date_key, cat: entry.cat, tags: entry.tags
    }).select().single();
    if (res.data) setMemory(prev => prev.map(m => (m === entry ? { ...m, id: res.data.id } : m)));
  }

  async function toggleMilestone(itemId, mi) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const milestones = item.milestones.map((m, i) => (i === mi ? { ...m, done: !m.done } : m));
    const updated = { ...item, milestones };
    setItems(prev => prev.map(i => (i.id === itemId ? updated : i)));
    await saveItemRow(updated);
  }

  async function persistValues(newValues) {
    setValues(newValues);
    await supabase.from("user_values").delete().eq("user_id", userId);
    if (newValues.length === 0) return;
    const rows = newValues.map(v => ({ user_id: userId, name: v.name, rating: v.rating || 0, completed: v.completed || [] }));
    await supabase.from("user_values").insert(rows);
  }

  async function addValue(name) {
    await persistValues([...values, { name, rating: 0, completed: [] }]);
  }

  // Journey timeline: user-added life moments, distinct from the
  // auto-generated `memory` XP log. photoFile is optional; when present it
  // uploads to a private bucket under this user's own folder (matches the
  // storage RLS policy: auth.uid() must equal the first path segment) and
  // only the storage path is persisted — see attachSignedPhotoUrls for why.
  async function addMoment({ title, momentDate, description, photoFile }) {
    let photoPath = null;
    if (photoFile) {
      const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
      photoPath = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("life-moments").upload(photoPath, photoFile);
      if (upErr) throw upErr;
    }
    const row = { user_id: userId, title, description: description || "", moment_date: momentDate, photo_path: photoPath };
    const res = await supabase.from("life_moments").insert(row).select().single();
    if (res.error) throw res.error;

    let photo_url = null;
    if (photoPath) {
      const signed = await supabase.storage.from("life-moments").createSignedUrl(photoPath, 3600);
      photo_url = signed.data?.signedUrl || null;
    }
    const newMoment = { ...res.data, photo_url };
    setMoments(prev => [newMoment, ...prev].sort((a, b) => new Date(b.moment_date) - new Date(a.moment_date)));
    return newMoment;
  }

  async function deleteMoment(id) {
    const moment = moments.find(m => m.id === id);
    setMoments(prev => prev.filter(m => m.id !== id));
    await supabase.from("life_moments").delete().eq("id", id).eq("user_id", userId);
    if (moment?.photo_path) await supabase.storage.from("life-moments").remove([moment.photo_path]);
  }

  // Edits an existing moment in place — the point of this (vs. delete +
  // re-add) is exactly the workflow that prompted it: type up a moment now
  // from a laptop with no photo, come back later (from a phone, once
  // deployed) and attach one without losing the original entry, its date,
  // or its place in the timeline. photoFile replaces any existing photo
  // (old file is removed from storage); removePhoto clears it with no
  // replacement; passing neither leaves the existing photo untouched.
  async function editMoment(id, { title, momentDate, description, photoFile, removePhoto }) {
    const moment = moments.find(m => m.id === id);
    if (!moment) return;

    let photoPath = moment.photo_path;
    if (photoFile) {
      const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
      const newPath = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("life-moments").upload(newPath, photoFile);
      if (upErr) throw upErr;
      if (moment.photo_path) await supabase.storage.from("life-moments").remove([moment.photo_path]);
      photoPath = newPath;
    } else if (removePhoto && moment.photo_path) {
      await supabase.storage.from("life-moments").remove([moment.photo_path]);
      photoPath = null;
    }

    const updates = { title, description: description || "", moment_date: momentDate, photo_path: photoPath };
    const res = await supabase.from("life_moments").update(updates).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;

    let photo_url = null;
    if (photoPath) {
      const signed = await supabase.storage.from("life-moments").createSignedUrl(photoPath, 3600);
      photo_url = signed.data?.signedUrl || null;
    }
    const updatedMoment = { ...res.data, photo_url };
    setMoments(prev =>
      prev.map(m => (m.id === id ? updatedMoment : m)).sort((a, b) => new Date(b.moment_date) - new Date(a.moment_date))
    );
    return updatedMoment;
  }

  // Asks the suggest-chapters Edge Function (Claude, server-side — the
  // Anthropic key never reaches the browser) to propose named eras from
  // the current moments. Returns suggestions only; nothing is saved until
  // saveChapters is called with what the user accepts.
  async function suggestChapters() {
    const payload = moments.map(m => ({ title: m.title, moment_date: m.moment_date, description: m.description }));
    const { data, error } = await supabase.functions.invoke("suggest-chapters", { body: { moments: payload } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.chapters || [];
  }

  // Replaces the user's saved chapters wholesale with the accepted list —
  // same delete-then-insert pattern as persistValues, since chapters are
  // regenerated as a set rather than edited field-by-field.
  async function saveChapters(newChapters) {
    await supabase.from("life_chapters").delete().eq("user_id", userId);
    if (newChapters.length === 0) {
      setChapters([]);
      return;
    }
    const rows = newChapters.map(c => ({
      user_id: userId, title: c.title, range_start: c.range_start, range_end: c.range_end, blurb: c.blurb || ""
    }));
    const res = await supabase.from("life_chapters").insert(rows).select();
    if (res.error) throw res.error;
    setChapters(res.data || []);
  }

  // Shared by both the fixed challenge library (completeChallenge) and
  // AI-generated challenges (completeValueChallenge) — a value can feed a
  // second pillar at half credit (VALUE_PILLAR2), same rule either way.
  async function awardValuePillarXP(valueName, pts, label) {
    const pillar = VALUE_PILLAR[valueName] || "Spirit";
    const entry = { name: label, type: "habit", xp: pts, date: niceDate(), date_key: todayKey(), cat: pillar, tags: [] };
    setMemory(prev => [entry, ...prev]);
    await supabase.from("memory").insert({ user_id: userId, name: entry.name, type: entry.type, xp: entry.xp, date: entry.date, date_key: entry.date_key, cat: entry.cat, tags: entry.tags });

    if (VALUE_PILLAR2[valueName]) {
      const entry2 = { name: label + " (pillar 2)", type: "habit", xp: Math.floor(pts / 2), date: niceDate(), date_key: todayKey(), cat: VALUE_PILLAR2[valueName], tags: [] };
      setMemory(prev => [entry2, ...prev]);
      await supabase.from("memory").insert({ user_id: userId, name: entry2.name, type: entry2.type, xp: entry2.xp, date: entry2.date, date_key: entry2.date_key, cat: entry2.cat, tags: entry2.tags });
    }
  }

  async function completeChallenge(valueName, challengeIdx) {
    const lib = ALL_VALUES_LIB.find(v => v.name === valueName);
    if (!lib) return;
    const challenge = lib.challenges[challengeIdx];
    if (!challenge) return;
    const v = values.find(v => v.name === valueName);
    if (!v || (v.completed || []).includes(challengeIdx)) return;
    const newRating = Math.min(99, v.rating + challenge.pts);
    const newValues = values.map(x => (x.name === valueName
      ? { ...x, rating: newRating, completed: [...(x.completed || []), challengeIdx] }
      : x));
    await persistValues(newValues);
    await awardValuePillarXP(valueName, challenge.pts, valueName + " challenge: " + challenge.text.slice(0, 30));
    return { prevRating: v.rating, newRating };
  }

  // AI-generated challenges live in their own table (value_challenges) with
  // real ids, rather than the fixed library's array-index scheme — see
  // generateValueChallenges below for why that split was necessary.
  async function completeValueChallenge(id) {
    const challenge = valueChallenges.find(c => c.id === id);
    if (!challenge || challenge.completed) return;
    const v = values.find(x => x.name === challenge.value_name);
    if (!v) return;
    const newRating = Math.min(99, v.rating + challenge.pts);
    const newValues = values.map(x => (x.name === challenge.value_name ? { ...x, rating: newRating } : x));
    await persistValues(newValues);
    setValueChallenges(prev => prev.map(c => (c.id === id ? { ...c, completed: true } : c)));
    await supabase.from("value_challenges").update({ completed: true }).eq("id", id).eq("user_id", userId);
    await awardValuePillarXP(challenge.value_name, challenge.pts, challenge.value_name + " challenge: " + challenge.text.slice(0, 30));
    return { prevRating: v.rating, newRating };
  }

  // Calls the suggest-value-challenges Edge Function (Claude, server-side)
  // to write 5 new challenges for one value, scaled to its current tier and
  // avoiding repeats of both the fixed library and anything already
  // generated. Inserts them straight away (unlike Chapters, there's no
  // "review before saving" step needed — a challenge is low-stakes and
  // easy to just... not do, so extra friction here isn't worth it).
  async function generateValueChallenges(valueName) {
    const lib = ALL_VALUES_LIB.find(v => v.name === valueName);
    const v = values.find(x => x.name === valueName);
    const tier = getTier(v?.rating || 0);
    const existingTexts = [
      ...(lib?.challenges || []).map(c => c.text),
      ...valueChallenges.filter(c => c.value_name === valueName).map(c => c.text)
    ];
    const { data, error } = await supabase.functions.invoke("suggest-value-challenges", {
      body: {
        valueName,
        tagline: lib?.tagline || "",
        tierName: tier.name,
        existingTexts,
        sampleChallenges: (lib?.challenges || []).slice(0, 3)
      }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const rows = (data.challenges || []).map(c => ({
      user_id: userId, value_name: valueName, text: c.text, pts: c.pts, diff: c.diff || "bold"
    }));
    if (rows.length === 0) return [];
    const res = await supabase.from("value_challenges").insert(rows).select();
    if (res.error) throw res.error;
    setValueChallenges(prev => [...prev, ...(res.data || [])]);
    return res.data || [];
  }

  const value = {
    userId, loaded, sync, items, memory, moodLog, values, profile, moments, chapters, valueChallenges,
    totalXP, level, pillars,
    addItem, completeItem, unachieveItem, deleteItem, editItem, toggleDay, toggleMilestone,
    getPrestigeTier, prestigeItem,
    addValue, completeChallenge, addMoment, editMoment, deleteMoment, suggestChapters, saveChapters,
    completeValueChallenge, generateValueChallenges, reload: load
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
