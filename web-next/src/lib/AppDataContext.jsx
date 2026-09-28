import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import {
  XP_VALS, PILLARS, PILLAR_COLORS, VALUE_PILLAR, VALUE_PILLAR2, normalizePillar,
  TIERS, cycleTierIndex, getValueSlots,
  STREAK_BONUS_INTERVAL, STREAK_BONUS_XP, getLevel, getTier, applyPrestigeGain
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
// Same display format as niceDate(), but for an arbitrary date-key rather
// than always "today" — lets backdated items/completions (building a
// backlog of things already done, priming YOU with real history) show a
// real date instead of the day they happened to be entered.
function niceDateFrom(dateKey) {
  return new Date(dateKey + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function dbToItem(row) {
  return {
    id: row.id, name: row.name, type: row.type, cat: normalizePillar(row.cat), subcat: row.subcat || "", note: row.note || "",
    tags: row.tags || [], intention: row.intention || "", milestones: row.milestones || [],
    done: row.done, streak: row.streak || 0,
    days: row.days || [false, false, false, false, false, false, false],
    lastCheckin: row.last_checkin || null, created: row.created, createdDate: row.created_date
  };
}
// user_values columns added by the values_system migration (status,
// definition, definition_history, highest_tier_reached) default sensibly
// here, so the app keeps working against a database that hasn't run it yet.
function dbToValue(row) {
  return {
    id: row.id, name: row.name, rating: row.rating || 0, completed: row.completed || [], prestige: row.prestige || 0,
    status: row.status || "active", definition: row.definition || "", definitionHistory: row.definition_history || [],
    highestTier: row.highest_tier_reached || 0
  };
}
function valueToRow(v) {
  return {
    rating: v.rating || 0, completed: v.completed || [], prestige: v.prestige || 0,
    status: v.status || "active", definition: v.definition || null, definition_history: v.definitionHistory || [],
    highest_tier_reached: v.highestTier || 0, updated_at: new Date().toISOString()
  };
}
function itemToRow(item, userId) {
  const row = {
    user_id: userId, name: item.name, type: item.type, cat: item.cat, subcat: item.subcat || "", note: item.note || "",
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
  const [journalEntries, setJournalEntries] = useState([]);
  const [identityVisions, setIdentityVisions] = useState([]);
  const [todos, setTodos] = useState([]);
  // AI consent: null = not loaded yet. Reflections = questionnaire answers
  // (the most intimate data in the app — owner-only, never analytics).
  const [aiConsent, setAiConsent] = useState(null);
  const [consentPrompt, setConsentPrompt] = useState(null); // { resolve } while asking
  const [reflections, setReflections] = useState([]);
  // Journal AI state is intentionally NOT part of the initial `load()`
  // batch — insights/photos/weekly reflections are fetched lazily, on
  // demand, so opening the app doesn't pull in every entry's AI output and
  // every photo signed-URL up front. Keyed by entry_id (journalInsights,
  // journalPhotos) or week_start date string (weeklyReflections).
  const [journalInsights, setJournalInsights] = useState({});
  const [journalPhotos, setJournalPhotos] = useState({});
  const [weeklyReflections, setWeeklyReflections] = useState({});
  const [recentInsights, setRecentInsights] = useState([]);
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

      const [itemsRes, memoryRes, moodRes, valuesRes, profileRes, momentsRes, chaptersRes, valueChallengesRes, journalRes, identityVisionsRes] = await withTimeout(
        Promise.all([
          supabase.from("items").select("*").eq("user_id", userId).order("inserted_at"),
          supabase.from("memory").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }),
          supabase.from("mood_log").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }).limit(90),
          supabase.from("user_values").select("*").eq("user_id", userId),
          supabase.from("profiles").select("*").eq("user_id", userId).single(),
          supabase.from("life_moments").select("*").eq("user_id", userId).order("moment_date", { ascending: false }),
          supabase.from("life_chapters").select("*").eq("user_id", userId).order("range_start", { ascending: false }),
          supabase.from("value_challenges").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }),
          supabase.from("journal_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: false }),
          supabase.from("identity_visions").select("*").eq("user_id", userId).order("inserted_at", { ascending: false })
        ]),
        LOAD_TIMEOUT_MS
      );
      setItems((itemsRes.data || []).map(dbToItem));
      setMemory((memoryRes.data || []).map(m => ({ ...m, cat: normalizePillar(m.cat) })));
      setMoodLog(moodRes.data || []);
      setValues((valuesRes.data || []).map(dbToValue));
      setProfile(profileRes.data || null);
      setMoments(await attachSignedPhotoUrls(momentsRes.data || []));
      setChapters(chaptersRes.data || []);
      setValueChallenges(valueChallengesRes.data || []);
      setJournalEntries(journalRes.data || []);
      setIdentityVisions((identityVisionsRes.data || []).map(v => ({ ...v, category: normalizePillar(v.category) })));
      setSync("synced");
      loadTodos();
      loadAiConsent();
      loadReflections();
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

  async function addItem({ name, type, cat, subcat, note, tags, milestones, intention, createdDate }) {
    const dateKey = createdDate || todayKey();
    const item = {
      id: "temp_" + Date.now(), name, type, cat, subcat: subcat || "", note: note || "",
      tags: tags || [], milestones: (milestones || []).map(m => ({ text: m.text, done: false })),
      done: false, streak: 0, days: [false, false, false, false, false, false, false],
      lastCheckin: null, intention: intention || "", created: niceDateFrom(dateKey), createdDate: dateKey
    };
    setItems(prev => [...prev, item]);
    await saveItemRow(item);
    return item;
  }

  // completedDate lets a pursuit be marked done as of a real past date
  // instead of always "today" — the point being able to go back through
  // things already achieved (a diploma, a trip already taken) and have the
  // XP register against that history rather than backdating being a lie.
  async function completeItem(id, reflection, completedDate) {
    const item = items.find(i => i.id === id);
    if (!item || item.done) return;
    const xp = XP_VALS[item.type] || 10;
    const dateKey = completedDate || todayKey();
    const updated = { ...item, done: true, note: reflection ? (item.note ? item.note + " | " + reflection : reflection) : item.note };
    const entry = {
      name: item.name, type: item.type, xp, date: niceDateFrom(dateKey), date_key: dateKey,
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

  // Updates only the rows that actually changed (callers build newValues
  // with .map, so an untouched value keeps its object identity). Replaces
  // the old delete-all-then-reinsert, which dropped row ids and would have
  // wiped the definition/status columns on every challenge completed.
  async function persistValues(newValues) {
    const prev = values;
    setValues(newValues);
    const changed = newValues.filter(v => !prev.includes(v));
    await Promise.all(changed.map(async v => {
      const res = await supabase.from("user_values").update(valueToRow(v)).eq("id", v.id).eq("user_id", userId);
      if (res.error) {
        // Migration not run yet → retry with only the original columns.
        console.error("[AppData] value save failed, retrying legacy columns:", res.error);
        await supabase.from("user_values")
          .update({ rating: v.rating || 0, completed: v.completed || [], prestige: v.prestige || 0 })
          .eq("id", v.id).eq("user_id", userId);
      }
    }));
  }

  const activeValues = useMemo(() => values.filter(v => v.status !== "rested"), [values]);
  const valueSlots = useMemo(() => getValueSlots(values), [values]);

  async function addValue(name) {
    if (activeValues.length >= valueSlots) throw new Error("No free value slot");
    const res = await supabase.from("user_values")
      .insert({ user_id: userId, name, rating: 0, completed: [], prestige: 0 }).select().single();
    if (res.error) throw res.error;
    setValues(prev => [...prev, dbToValue(res.data)]);
  }

  // Resting keeps XP, tier and definition — nothing is lost, the value just
  // steps out of focus. Returning needs a free slot.
  async function setValueStatus(name, status) {
    if (status === "active" && activeValues.length >= valueSlots) throw new Error("No free value slot");
    await persistValues(values.map(v => (v.name === name ? { ...v, status } : v)));
  }

  // The Seeker's own words come first; an earlier definition moves into
  // history (with the tier it was written at) rather than being overwritten.
  async function saveValueDefinition(name, text) {
    const trimmed = (text || "").trim();
    await persistValues(values.map(v => {
      if (v.name !== name) return v;
      const history = v.definition && v.definition !== trimmed
        ? [...(v.definitionHistory || []), { text: v.definition, at: new Date().toISOString(), tier: TIERS[cycleTierIndex(v.rating, v.prestige)].name }]
        : v.definitionHistory || [];
      return { ...v, definition: trimmed, definitionHistory: history };
    }));
  }

  // Shared by both challenge paths. Returns the tier name crossed into for
  // the first time (for the one-line tier moment), or null.
  function gainValue(v, pts) {
    const { rating, prestige } = applyPrestigeGain(v.rating, v.prestige || 0, pts);
    const prestiged = prestige > (v.prestige || 0);
    const reached = prestiged ? 3 : cycleTierIndex(rating, prestige);
    const highestTier = Math.max(v.highestTier || 0, reached);
    const crossedInto = highestTier > (v.highestTier || 0) ? TIERS[highestTier].name : null;
    return { updated: { ...v, rating, prestige, highestTier }, prestiged, crossedInto };
  }

  // Partial update only — this only ever sets the columns "My YOU" actually
  // edits (name/bio/location), never the astrology fields the vanilla app's
  // onboarding wrote (birthday, birth_time, birthplace, sun/moon/rising
  // sign), so a save here can't accidentally wipe those out.
  async function saveProfile(updates) {
    const res = await supabase.from("profiles").update(updates).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setProfile(res.data);
    return res.data;
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

  // Identity/vision statements — "who I'm becoming", not a task list, so
  // unlike items there's no done flag, no XP, nothing this feeds into.
  // `category` is whatever free text the user types (UI offers suggestions,
  // doesn't enforce them); `visionDate` follows the same backdating pattern
  // as everything else in this file rather than always defaulting to today.
  async function addIdentityVision({ category, title, statement, reflection, visionDate }) {
    const row = {
      user_id: userId, category: (category || "").trim(), title: title.trim(), statement: statement.trim(),
      reflection: (reflection || "").trim() || null, vision_date: visionDate || todayKey()
    };
    const res = await supabase.from("identity_visions").insert(row).select().single();
    if (res.error) throw res.error;
    setIdentityVisions(prev => [res.data, ...prev]);
    return res.data;
  }

  async function editIdentityVision(id, { category, title, statement, reflection, visionDate }) {
    const updates = {
      category: (category || "").trim(), title: title.trim(), statement: statement.trim(),
      reflection: (reflection || "").trim() || null, vision_date: visionDate,
      updated_at: new Date().toISOString()
    };
    const res = await supabase.from("identity_visions").update(updates).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setIdentityVisions(prev => prev.map(v => (v.id === id ? res.data : v)));
    return res.data;
  }

  async function deleteIdentityVision(id) {
    setIdentityVisions(prev => prev.filter(v => v.id !== id));
    await supabase.from("identity_visions").delete().eq("id", id).eq("user_id", userId);
  }

  // Journal entries. Kept distinct from `memory` (the auto-generated XP
  // log) and `moments` (user-curated timeline highlights) — this is
  // free-form reflection, not tied to completing anything.
  // Today's list — loaded outside the main batch so a missing `todos`
  // table (migration not yet run) can't block the rest of the app from
  // loading. Only today's rows: yesterday's unfinished ones fall away.
  async function loadTodos() {
    const res = await supabase.from("todos").select("*").eq("user_id", userId).eq("todo_date", todayKey()).order("inserted_at");
    if (res.error) { console.error("[AppData] loadTodos failed:", res.error); return; }
    setTodos(res.data || []);
  }

  // ── AI consent ──
  // Explicit and revocable. Nothing personal is sent to Claude until the
  // Seeker says yes; the Edge Functions check the same row server-side.
  async function loadAiConsent() {
    const res = await supabase.from("ai_consent").select("*").eq("user_id", userId).maybeSingle();
    if (res.error) { console.error("[AppData] loadAiConsent failed:", res.error); return; }
    setAiConsent(res.data || { granted: false });
  }

  async function setAiConsentGranted(granted) {
    const now = new Date().toISOString();
    const row = granted
      ? { user_id: userId, granted: true, granted_at: now, revoked_at: null, updated_at: now }
      : { user_id: userId, granted: false, revoked_at: now, updated_at: now };
    const res = await supabase.from("ai_consent").upsert(row).select().single();
    if (res.error) throw res.error;
    setAiConsent(res.data);
  }

  // Resolves true once consent exists — asking first (via AiConsentModal in
  // AppShell) if it doesn't. Resolves false if the Seeker says not now.
  function ensureAiConsent() {
    if (aiConsent?.granted) return Promise.resolve(true);
    return new Promise(resolve => setConsentPrompt({ resolve }));
  }

  async function answerConsentPrompt(yes) {
    const prompt = consentPrompt;
    setConsentPrompt(null);
    if (yes) {
      try {
        await setAiConsentGranted(true);
      } catch (e) {
        console.error("[AppData] granting consent failed:", e);
        prompt?.resolve(false);
        return;
      }
    }
    prompt?.resolve(yes);
  }

  async function withAiConsent() {
    if (await ensureAiConsent()) return;
    const err = new Error("AI consent not given");
    err.code = "consent_declined";
    throw err;
  }

  // ── Reflections (questionnaires) ──
  async function loadReflections() {
    const res = await supabase.from("reflections").select("*").eq("user_id", userId).order("inserted_at");
    if (res.error) { console.error("[AppData] loadReflections failed:", res.error); return; }
    setReflections(res.data || []);
  }

  // Saved step by step, so a Seeker can stop anywhere and come back. One
  // row per (session, kind): saving the same step again updates it.
  async function saveReflectionAnswer({ sessionId, questionnaire, kind, body, prompt, valueName, pillar }) {
    const existing = reflections.find(r => r.session_id === sessionId && r.kind === kind);
    const now = new Date().toISOString();
    const res = existing
      ? await supabase.from("reflections").update({ body, prompt, updated_at: now }).eq("id", existing.id).eq("user_id", userId).select().single()
      : await supabase.from("reflections").insert({
          user_id: userId, session_id: sessionId, questionnaire, kind, body, prompt,
          value_name: valueName || null, pillar: pillar || null
        }).select().single();
    if (res.error) throw res.error;
    setReflections(prev => existing ? prev.map(r => (r.id === existing.id ? res.data : r)) : [...prev, res.data]);
    return res.data;
  }

  async function deleteReflectionSession(sessionId) {
    setReflections(prev => prev.filter(r => r.session_id !== sessionId));
    await supabase.from("reflections").delete().eq("session_id", sessionId).eq("user_id", userId);
  }

  async function addTodo(text) {
    const res = await supabase.from("todos").insert({ user_id: userId, text, todo_date: todayKey() }).select().single();
    if (res.error) throw res.error;
    setTodos(prev => [...prev, res.data]);
    return res.data;
  }

  async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
    await supabase.from("todos").update({ done: !todo.done }).eq("id", id).eq("user_id", userId);
  }

  async function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from("todos").delete().eq("id", id).eq("user_id", userId);
  }

  async function addJournalEntry({ content, mood, entryDate, tags }) {
    const row = { user_id: userId, content, mood: mood || null, entry_date: entryDate || todayKey(), tags: tags || [] };
    const res = await supabase.from("journal_entries").insert(row).select().single();
    if (res.error) throw res.error;
    setJournalEntries(prev =>
      [res.data, ...prev].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
    );
    return res.data;
  }

  async function editJournalEntry(id, { content, mood, entryDate, tags }) {
    const updates = { content, mood: mood || null, entry_date: entryDate, tags: tags || [], updated_at: new Date().toISOString() };
    const res = await supabase.from("journal_entries").update(updates).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setJournalEntries(prev =>
      prev.map(e => (e.id === id ? res.data : e)).sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
    );
    return res.data;
  }

  async function deleteJournalEntry(id) {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    setJournalInsights(prev => { const next = { ...prev }; delete next[id]; return next; });
    setJournalPhotos(prev => { const next = { ...prev }; delete next[id]; return next; });
    await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", userId);
  }

  // Journal photos (handwritten pages). Storage path is
  // "{user_id}/{entry_id}/{timestamp}.{ext}" in the private journal-photos
  // bucket — same signed-URL-on-read pattern as life-moments, since a
  // usable <img src> can't point straight at a private bucket.
  async function loadJournalPhotos(entryId) {
    const res = await supabase.from("journal_photos").select("*").eq("entry_id", entryId).eq("user_id", userId).order("created_at");
    if (res.error) throw res.error;
    const rows = res.data || [];
    const signed = await Promise.all(rows.map(r => supabase.storage.from("journal-photos").createSignedUrl(r.storage_path, 3600)));
    const withUrls = rows.map((r, i) => ({ ...r, photo_url: signed[i]?.data?.signedUrl || null }));
    setJournalPhotos(prev => ({ ...prev, [entryId]: withUrls }));
    return withUrls;
  }

  async function addJournalPhoto(entryId, photoFile) {
    const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
    const storagePath = `${userId}/${entryId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("journal-photos").upload(storagePath, photoFile);
    if (upErr) throw upErr;
    const res = await supabase
      .from("journal_photos")
      .insert({ entry_id: entryId, user_id: userId, storage_path: storagePath })
      .select()
      .single();
    if (res.error) throw res.error;
    const signed = await supabase.storage.from("journal-photos").createSignedUrl(storagePath, 3600);
    const withUrl = { ...res.data, photo_url: signed.data?.signedUrl || null };
    setJournalPhotos(prev => ({ ...prev, [entryId]: [...(prev[entryId] || []), withUrl] }));
    return withUrl;
  }

  async function deleteJournalPhoto(entryId, photoId) {
    const photo = (journalPhotos[entryId] || []).find(p => p.id === photoId);
    setJournalPhotos(prev => ({ ...prev, [entryId]: (prev[entryId] || []).filter(p => p.id !== photoId) }));
    await supabase.from("journal_photos").delete().eq("id", photoId).eq("user_id", userId);
    if (photo?.storage_path) await supabase.storage.from("journal-photos").remove([photo.storage_path]);
  }

  // Sends a photo to the transcribe-journal-photo Edge Function (Claude
  // vision, server-side). Saves a first-draft transcription the user can
  // then edit in place via editJournalPhotoTranscription.
  async function transcribeJournalPhoto(entryId, photoId) {
    await withAiConsent();
    const { data, error } = await supabase.functions.invoke("transcribe-journal-photo", { body: { photoId } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    setJournalPhotos(prev => ({
      ...prev,
      [entryId]: (prev[entryId] || []).map(p => (p.id === photoId ? { ...p, ...data.photo } : p))
    }));
    return data.photo;
  }

  async function editJournalPhotoTranscription(entryId, photoId, transcription) {
    const res = await supabase
      .from("journal_photos")
      .update({ transcription, transcription_status: "done" })
      .eq("id", photoId)
      .eq("user_id", userId)
      .select()
      .single();
    if (res.error) throw res.error;
    setJournalPhotos(prev => ({
      ...prev,
      [entryId]: (prev[entryId] || []).map(p => (p.id === photoId ? res.data : p))
    }));
    return res.data;
  }

  // AI reflection on a single entry. loadJournalInsight reads whatever's
  // already saved (a past visit's reflection); generateJournalReflection
  // calls the Edge Function and overwrites it — regenerating is a deliberate
  // user action, not automatic, so a saved reflection never silently
  // changes underneath them.
  async function loadJournalInsight(entryId) {
    const res = await supabase.from("journal_ai_insights").select("*").eq("entry_id", entryId).eq("user_id", userId).maybeSingle();
    if (res.error) throw res.error;
    setJournalInsights(prev => ({ ...prev, [entryId]: res.data || null }));
    return res.data || null;
  }

  async function generateJournalReflection(entryId) {
    await withAiConsent();
    const { data, error } = await supabase.functions.invoke("reflect-on-journal-entry", { body: { entryId } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    setJournalInsights(prev => ({ ...prev, [entryId]: data.insight }));
    return data.insight;
  }

  // Lets the user edit or reject one AI-suggested insight item in place —
  // the item is never deleted outright (status becomes 'rejected' instead
  // of vanishing) so what the AI proposed and what the user did with it
  // stays visible, not silently erased.
  async function updateInsightItem(entryId, itemId, updates) {
    const current = journalInsights[entryId];
    if (!current) return;
    const nextInsights = (current.insights || []).map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const res = await supabase
      .from("journal_ai_insights")
      .update({ insights: nextInsights, updated_at: new Date().toISOString() })
      .eq("id", current.id)
      .eq("user_id", userId)
      .select()
      .single();
    if (res.error) throw res.error;
    setJournalInsights(prev => ({ ...prev, [entryId]: res.data }));
    return res.data;
  }

  // Recent AI insights across ALL entries (not one) — powers "Bring Me Back
  // To Myself" and the new Home, which both need a cross-entry view: recent
  // patterns, which values keep coming up, a snippet of what's been on your
  // mind lately. Lazy-loaded (not part of the initial load() batch) since
  // it's only needed on those two screens.
  async function loadRecentInsights(limit = 10) {
    const res = await supabase
      .from("journal_ai_insights")
      .select("*, journal_entries!inner(entry_date, content)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (res.error) throw res.error;
    setRecentInsights(res.data || []);
    return res.data || [];
  }

  // Weekly reflection. weekStart must be an ISO date string (Monday) — see
  // WeeklyReflectionView for how it's computed from "today".
  async function loadWeeklyReflection(weekStart) {
    const res = await supabase.from("weekly_reflections").select("*").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();
    if (res.error) throw res.error;
    setWeeklyReflections(prev => ({ ...prev, [weekStart]: res.data || null }));
    return res.data || null;
  }

  async function generateWeeklyReflection(weekStart) {
    await withAiConsent();
    const { data, error } = await supabase.functions.invoke("weekly-reflection", { body: { weekStart } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data.empty) {
      setWeeklyReflections(prev => ({ ...prev, [weekStart]: null }));
      return { empty: true, message: data.message };
    }
    setWeeklyReflections(prev => ({ ...prev, [weekStart]: data.reflection }));
    return { empty: false, reflection: data.reflection };
  }

  // Everything YOUnderstanding has noticed whose journal entry falls inside
  // one era (a life_chapter's date range) — for the Story of You cosmos
  // door, which shows an era's insights rather than just "recent" ones.
  // Fetched on demand per door-open, not part of any bulk load.
  async function loadEraInsights(start, end) {
    const res = await supabase
      .from("journal_ai_insights")
      .select("*, journal_entries!inner(entry_date, content)")
      .eq("user_id", userId)
      .gte("journal_entries.entry_date", start)
      .lte("journal_entries.entry_date", end || todayKey())
      .order("created_at", { ascending: false })
      .limit(5);
    if (res.error) throw res.error;
    return res.data || [];
  }

  // Same idea for weekly reflections whose week_start falls inside an era.
  async function loadEraWeeklyReflections(start, end) {
    const res = await supabase
      .from("weekly_reflections")
      .select("*")
      .eq("user_id", userId)
      .gte("week_start", start)
      .lte("week_start", end || todayKey())
      .order("week_start", { ascending: false })
      .limit(3);
    if (res.error) throw res.error;
    return res.data || [];
  }

  // Asks the suggest-chapters Edge Function (Claude, server-side — the
  // Anthropic key never reaches the browser) to propose named eras from
  // the current moments. Returns suggestions only; nothing is saved until
  // saveChapters is called with what the user accepts.
  async function suggestChapters() {
    await withAiConsent();
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
    const { updated, prestiged, crossedInto } = gainValue(v, challenge.pts);
    const newValues = values.map(x => (x.name === valueName
      ? { ...updated, completed: [...(x.completed || []), challengeIdx] }
      : x));
    await persistValues(newValues);
    await awardValuePillarXP(valueName, challenge.pts, valueName + " challenge: " + challenge.text.slice(0, 30));
    return { prevRating: v.rating, newRating: updated.rating, prestiged, crossedInto };
  }

  // AI-generated challenges live in their own table (value_challenges) with
  // real ids, rather than the fixed library's array-index scheme — see
  // generateValueChallenges below for why that split was necessary.
  async function completeValueChallenge(id) {
    const challenge = valueChallenges.find(c => c.id === id);
    if (!challenge || challenge.completed) return;
    const v = values.find(x => x.name === challenge.value_name);
    if (!v) return;
    const { updated, prestiged, crossedInto } = gainValue(v, challenge.pts);
    const newValues = values.map(x => (x.name === challenge.value_name ? updated : x));
    await persistValues(newValues);
    setValueChallenges(prev => prev.map(c => (c.id === id ? { ...c, completed: true } : c)));
    await supabase.from("value_challenges").update({ completed: true }).eq("id", id).eq("user_id", userId);
    await awardValuePillarXP(challenge.value_name, challenge.pts, challenge.value_name + " challenge: " + challenge.text.slice(0, 30));
    return { prevRating: v.rating, newRating: updated.rating, prestiged, crossedInto };
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
    userId, loaded, sync, items, memory, moodLog, values, profile, moments, chapters, valueChallenges, journalEntries,
    identityVisions, todos,
    journalInsights, journalPhotos, weeklyReflections, recentInsights,
    totalXP, level, pillars,
    addItem, completeItem, unachieveItem, deleteItem, editItem, toggleDay, toggleMilestone,
    getPrestigeTier, prestigeItem,
    activeValues, valueSlots, setValueStatus, saveValueDefinition,
    addValue, saveProfile, completeChallenge, addMoment, editMoment, deleteMoment, suggestChapters, saveChapters,
    addIdentityVision, editIdentityVision, deleteIdentityVision,
    addTodo, toggleTodo, deleteTodo,
    aiConsent, consentPrompt, answerConsentPrompt, setAiConsentGranted,
    reflections, saveReflectionAnswer, deleteReflectionSession,
    completeValueChallenge, generateValueChallenges, addJournalEntry, editJournalEntry, deleteJournalEntry,
    loadJournalPhotos, addJournalPhoto, deleteJournalPhoto, transcribeJournalPhoto, editJournalPhotoTranscription,
    loadJournalInsight, generateJournalReflection, updateInsightItem,
    loadWeeklyReflection, generateWeeklyReflection, loadRecentInsights,
    loadEraInsights, loadEraWeeklyReflections,
    reload: load
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
