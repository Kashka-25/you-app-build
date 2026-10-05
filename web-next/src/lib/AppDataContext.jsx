import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import {
  XP_VALS, PILLARS, PILLAR_COLORS, VALUE_PILLAR, VALUE_PILLAR2, normalizePillar,
  TIERS, cycleTierIndex, getValueSlots,
  STREAK_BONUS_INTERVAL, STREAK_BONUS_XP, getLevel, getTier, applyPrestigeGain
} from "../constants/app.const";
import { getValueEntry } from "../constants/valueLibrary";
import { callCostUsd } from "./aiCost";
import { compressImage, JOURNAL_PAGE } from "./imageCompress";
import { localDateKey, weekStartKey, sowWeekStartKey, harvestWeekStartKey, addDaysKey, markWeekRested } from "./week";
import { markerXp, DAILY_FOCUS_XP_CAP } from "./focus";
import { mementoForHour } from "../constants/mementos";
import { arcanumForQuestionnaire } from "../constants/arcana";
import { normalizeWord, displayWord, isCodexValue } from "./valueWords";

// "Today" is always the Seeker's local date, never UTC.
const todayKey = localDateKey;

// Every photo of a memory, in carousel order (older rows only have the
// single photo_path).
export function momentPhotoPaths(m) {
  if (m.photo_paths?.length) return m.photo_paths;
  return m.photo_path ? [m.photo_path] : [];
}

const AppDataContext = createContext(null);

// How long we'll wait on Supabase before giving up and rendering with
// whatever's in local state. Keeps the app usable even if the backend is
// unreachable (e.g. a paused free-tier Supabase project).
const LOAD_TIMEOUT_MS = 8000;

// XP for tending a sown intention — same as a habit check-in.
const TEND_XP = 3;

// Travel is scored by what the trip gave you, not how many places you
// ticked off: each memory or journal entry pinned to a Wandering's place
// earns this, to the trip's Pillar. Unpinning or deleting takes it back.
export const TRAVEL_MEMORY_XP = 10;
const travelKey = (kind, id) => `travel:${kind}:${id}`;

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
    lastCheckin: row.last_checkin || null, created: row.created, createdDate: row.created_date,
    // Deliberately not written back by itemToRow: release/restore set it with
    // their own update, so ordinary saves never touch (or depend on) it.
    releasedAt: row.released_at || null
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
  const [weekIntentions, setWeekIntentions] = useState([]);
  const [weekHarvests, setWeekHarvests] = useState([]);
  const [wanderings, setWanderings] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [compassHistory, setCompassHistory] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [wanderingStops, setWanderingStops] = useState([]);
  // AI consent: null = not loaded yet. Reflections = questionnaire answers
  // (the most intimate data in the app — owner-only, never analytics).
  const [aiConsent, setAiConsent] = useState(null);
  const [consentPrompt, setConsentPrompt] = useState(null); // { resolve } while asking
  const [reflections, setReflections] = useState([]);
  const [heldArcana, setHeldArcana] = useState([]);
  const [arcanaLoaded, setArcanaLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [codexNew, setCodexNew] = useState(0); // admin: words waiting for a look
  const [ownTools, setOwnTools] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const [toolUses, setToolUses] = useState([]);
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
  // trusting anything persisted. Every row gets photo_items ({ path, url }
  // for the edit form), photo_urls (the carousel, in order) and photo_url
  // (the cover, i.e. the first).
  const attachSignedPhotoUrls = useCallback(async (rows) => {
    const paths = [...new Set(rows.flatMap(momentPhotoPaths))];
    const urlByPath = {};
    if (paths.length) {
      const { data } = await supabase.storage.from("life-moments").createSignedUrls(paths, 3600);
      (data || []).forEach(d => { if (d.path) urlByPath[d.path] = d.signedUrl || null; });
    }
    return rows.map(r => {
      const photo_items = momentPhotoPaths(r).map(path => ({ path, url: urlByPath[path] || null }));
      const photo_urls = photo_items.map(p => p.url).filter(Boolean);
      return { ...r, photo_items, photo_urls, photo_url: photo_urls[0] || null };
    });
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
      loadWeekIntentions();
      loadWeekHarvests();
      loadWanderings();
      loadSeasons();
      loadCompass();
      loadFocusSessions();
      loadHighlights();
      loadAiConsent();
      loadReflections();
      loadArcana();
      loadAdmin();
    } catch (e) {
      console.error("[AppDataContext] load failed — continuing with local/empty state:", e);
      setSync("offline");
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  // ── Travel XP ledger ──
  // Keeps memory-XP rows (tagged travel:<kind>:<id>) matched to what's
  // actually pinned, however a memory got pinned or unpinned (forms, a
  // stop's "Pin here", deleting a memory or a stop). One reconcile instead
  // of XP logic scattered through every save path.
  const reconciling = useRef(false);
  useEffect(() => {
    if (!loaded || !userId || reconciling.current) return;
    const stopById = Object.fromEntries(wanderingStops.map(st => [st.id, st]));
    const pinned = [
      ...moments.filter(m => m.stop_id && stopById[m.stop_id]).map(m => ({ key: travelKey("moment", m.id), stop: stopById[m.stop_id], date: m.moment_date })),
      ...journalEntries.filter(e => e.stop_id && stopById[e.stop_id]).map(e => ({ key: travelKey("entry", e.id), stop: stopById[e.stop_id], date: e.entry_date }))
    ];
    const ledger = memory.filter(r => (r.tags || []).some(t => t.startsWith("travel:")));
    const missing = pinned.filter(p => !ledger.some(r => r.tags.includes(p.key)));
    const stale = ledger.filter(r => !pinned.some(p => r.tags.includes(p.key)));
    if (!missing.length && !stale.length) return;

    reconciling.current = true;
    (async () => {
      try {
        if (stale.length) {
          const ids = stale.map(r => r.id).filter(Boolean);
          if (ids.length) await supabase.from("memory").delete().in("id", ids).eq("user_id", userId);
        }
        let added = [];
        if (missing.length) {
          const rows = missing.map(p => {
            const w = wanderings.find(x => x.id === p.stop.wandering_id);
            const dream = w && items.find(i => i.id === w.item_id);
            return {
              user_id: userId, name: `Remembered in ${p.stop.place_name}`, type: "travel", xp: TRAVEL_MEMORY_XP,
              date: niceDateFrom(p.date), date_key: p.date, cat: dream?.cat || "Spirit", tags: [p.key]
            };
          });
          const res = await supabase.from("memory").insert(rows).select();
          if (res.error) throw res.error;
          added = res.data || [];
        }
        setMemory(prev => [...added.map(r => ({ ...r, cat: normalizePillar(r.cat) })), ...prev.filter(r => !stale.includes(r))]);
      } catch (e) {
        console.error("[AppData] travel XP reconcile failed:", e);
      } finally {
        reconciling.current = false;
      }
    })();
  }, [loaded, userId, moments, journalEntries, wanderingStops, wanderings, memory, items]);

  // Released pursuits are archived: everything outside this provider sees
  // only active ones as `items`, and the archive as `releasedItems`.
  const activeItems = useMemo(() => items.filter(i => !i.releasedAt), [items]);
  const releasedItems = useMemo(() => items.filter(i => i.releasedAt), [items]);

  const totalXP = useMemo(() => memory.reduce((s, m) => s + (m.xp || 0), 0), [memory]);
  const level = useMemo(() => getLevel(totalXP), [totalXP]);

  const pillars = useMemo(() => {
    const xp = Object.fromEntries(PILLARS.map(p => [p, 0]));
    const counts = Object.fromEntries(PILLARS.map(p => [p, 0]));
    const streaks = Object.fromEntries(PILLARS.map(p => [p, 0]));
    memory.forEach(m => { if (m.cat && xp[m.cat] !== undefined) xp[m.cat] += (m.xp || 0); });
    activeItems.filter(i => !i.done).forEach(i => {
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
  }, [memory, activeItems]);

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

  // Steps (stored as `milestones`) can be added and removed straight from a
  // pursuit's card, not only from the edit form.
  async function addMilestone(itemId, text) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const updated = { ...item, milestones: [...(item.milestones || []), { text, done: false }] };
    setItems(prev => prev.map(i => (i.id === itemId ? updated : i)));
    await saveItemRow(updated);
  }

  async function removeMilestone(itemId, mi) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const updated = { ...item, milestones: (item.milestones || []).filter((_, i) => i !== mi) };
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
  // auto-generated `memory` XP log. Photos are optional and there can be
  // several (a carousel). Each is converted on the device first (see
  // lib/imageCompress.js) and uploaded to a private bucket under this
  // user's own folder (matches the storage RLS policy: auth.uid() must
  // equal the first path segment); only storage paths are persisted, see
  // attachSignedPhotoUrls for why. photo_path mirrors the first photo, so
  // single-photo views keep working.
  // stopId (optional): pin the memory to a Wandering stop. Only sent when
  // given, so nothing changes for memories made where there's no stop.
  async function uploadMomentPhotos(photos) {
    const paths = [];
    try {
      for (const [i, ph] of photos.entries()) {
        const path = `${userId}/${Date.now()}-${i}.${ph.ext}`;
        const { error } = await supabase.storage.from("life-moments").upload(path, ph.blob, { contentType: ph.blob.type });
        if (error) throw error;
        paths.push(path);
      }
    } catch (e) {
      // Don't leave half a carousel behind in storage.
      if (paths.length) await supabase.storage.from("life-moments").remove(paths);
      throw e;
    }
    return paths;
  }

  async function addMoment({ title, momentDate, description, photos = [], stopId }) {
    const paths = await uploadMomentPhotos(photos);
    const row = { user_id: userId, title, description: description || "", moment_date: momentDate, photo_paths: paths, photo_path: paths[0] || null };
    if (stopId !== undefined) row.stop_id = stopId;
    const res = await supabase.from("life_moments").insert(row).select().single();
    if (res.error) {
      if (paths.length) await supabase.storage.from("life-moments").remove(paths);
      throw res.error;
    }
    const [newMoment] = await attachSignedPhotoUrls([res.data]);
    setMoments(prev => [newMoment, ...prev].sort((a, b) => new Date(b.moment_date) - new Date(a.moment_date)));
    return newMoment;
  }

  async function deleteMoment(id) {
    const moment = moments.find(m => m.id === id);
    setMoments(prev => prev.filter(m => m.id !== id));
    await supabase.from("life_moments").delete().eq("id", id).eq("user_id", userId);
    const paths = moment ? momentPhotoPaths(moment) : [];
    if (paths.length) await supabase.storage.from("life-moments").remove(paths);
  }

  // Edits an existing moment in place, so a memory typed up now can get
  // its photos later without losing its date or place in the timeline.
  // `photoOrder` is the carousel as the form left it: existing photos as
  // { path } and new ones as { blob, ext }. Existing photos missing from
  // it are removed from storage. Leaving photoOrder out keeps the photos.
  async function editMoment(id, { title, momentDate, description, photoOrder, stopId }) {
    const moment = moments.find(m => m.id === id);
    if (!moment) return;

    const before = momentPhotoPaths(moment);
    let paths = before;
    let added = [];
    if (photoOrder) {
      added = await uploadMomentPhotos(photoOrder.filter(p => !p.path));
      let n = 0;
      paths = photoOrder.map(p => p.path || added[n++]);
    }

    const updates = { title, description: description || "", moment_date: momentDate, photo_paths: paths, photo_path: paths[0] || null };
    if (stopId !== undefined) updates.stop_id = stopId;
    const res = await supabase.from("life_moments").update(updates).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) {
      if (added.length) await supabase.storage.from("life-moments").remove(added);
      throw res.error;
    }
    const removed = before.filter(p => !paths.includes(p));
    if (removed.length) await supabase.storage.from("life-moments").remove(removed);

    const [updatedMoment] = await attachSignedPhotoUrls([res.data]);
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

  // ── Sow · Tend · Harvest ──
  // Loaded outside the main batch for the same reason as todos: a database
  // that hasn't run the week_intentions migration yet shouldn't stop the
  // rest of the app loading. Only the current week and the week Sow is
  // planning for (they differ on Sundays).
  async function loadWeekIntentions() {
    const weeks = [...new Set([harvestWeekStartKey(), weekStartKey(), sowWeekStartKey()])];
    const res = await supabase.from("week_intentions").select("*").eq("user_id", userId).in("week_start", weeks).order("inserted_at");
    if (res.error) { console.error("[AppData] loadWeekIntentions failed:", res.error); return; }
    setWeekIntentions(res.data || []);
  }

  // Replaces a week's sowing with `picks` ([{ itemId, days, valueName }]).
  // Kept rows keep their tended/rested history; dropped rows are removed
  // (any XP they already earned stays in memory — it really happened).
  async function sowWeek(weekStart, picks) {
    const existing = weekIntentions.filter(w => w.week_start === weekStart);
    const keepIds = new Set(picks.map(p => p.itemId));
    const dropped = existing.filter(w => !keepIds.has(w.item_id));
    if (dropped.length) {
      const del = await supabase.from("week_intentions").delete().in("id", dropped.map(w => w.id)).eq("user_id", userId);
      if (del.error) throw del.error;
    }
    const rows = picks.map(p => ({
      user_id: userId, item_id: p.itemId, week_start: weekStart,
      days: [...p.days].sort(), value_name: p.valueName || null
    }));
    let saved = [];
    if (rows.length) {
      const res = await supabase.from("week_intentions").upsert(rows, { onConflict: "user_id,week_start,item_id" }).select();
      if (res.error) throw res.error;
      saved = res.data || [];
    }
    setWeekIntentions(prev => [...prev.filter(w => w.week_start !== weekStart), ...saved]);
  }

  async function loadWeekHarvests() {
    const res = await supabase.from("week_harvests").select("*").eq("user_id", userId).order("week_start", { ascending: false }).limit(600);
    if (res.error) { console.error("[AppData] loadWeekHarvests failed:", res.error); return; }
    setWeekHarvests(res.data || []);
  }

  // Release = archive, never delete: the pursuit leaves Pursue, Sow and
  // Home but keeps its history, steps and XP, and can be restored.
  async function setReleased(itemId, releasedAt) {
    const res = await supabase.from("items").update({ released_at: releasedAt }).eq("id", itemId).eq("user_id", userId);
    if (res.error) throw res.error;
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, releasedAt } : i)));
  }
  const releaseItem = itemId => setReleased(itemId, new Date().toISOString());
  const restoreItem = itemId => setReleased(itemId, null);

  // Closes a sown week. decisions: { [intentionId]: "carried" | "rested" |
  // "released" } (anything unchosen rests). Carried ones are sown into the
  // following week with the same days and value, up to Sow's limit of 3.
  async function harvestWeek(weekStart, decisions, note) {
    const sown = weekIntentions.filter(w => w.week_start === weekStart);
    const nextWeek = addDaysKey(weekStart, 7);
    const nextExisting = weekIntentions.filter(w => w.week_start === nextWeek);
    const room = Math.max(0, 3 - nextExisting.length);
    const outcomes = Object.fromEntries(sown.map(w => [w.id, decisions[w.id] || "rested"]));
    const carried = sown
      .filter(w => outcomes[w.id] === "carried" && !nextExisting.some(n => n.item_id === w.item_id))
      .slice(0, room);

    for (const w of sown) {
      const res = await supabase.from("week_intentions").update({ outcome: outcomes[w.id] }).eq("id", w.id).eq("user_id", userId);
      if (res.error) throw res.error;
    }

    let carriedRows = [];
    if (carried.length) {
      const res = await supabase.from("week_intentions").upsert(
        carried.map(w => ({ user_id: userId, item_id: w.item_id, week_start: nextWeek, days: w.days || [], value_name: w.value_name })),
        { onConflict: "user_id,week_start,item_id" }
      ).select();
      if (res.error) throw res.error;
      carriedRows = res.data || [];
      markWeekRested(nextWeek, false);
    }

    for (const w of sown.filter(x => outcomes[x.id] === "released")) await releaseItem(w.item_id);

    const res = await supabase.from("week_harvests").upsert(
      { user_id: userId, week_start: weekStart, note: (note || "").trim() || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id,week_start" }
    ).select().single();
    if (res.error) throw res.error;

    setWeekIntentions(prev => [
      ...prev.map(w => (outcomes[w.id] ? { ...w, outcome: outcomes[w.id] } : w)).filter(w => !carriedRows.some(c => c.id === w.id)),
      ...carriedRows
    ]);
    setWeekHarvests(prev => [res.data, ...prev.filter(h => h.week_start !== weekStart)]);
    return { carried: carriedRows.length, skippedForRoom: sown.filter(w => outcomes[w.id] === "carried").length - carried.length };
  }

  async function updateWeekIntention(id, updates) {
    setWeekIntentions(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)));
    const res = await supabase.from("week_intentions").update(updates).eq("id", id).eq("user_id", userId);
    if (res.error) console.error("[AppData] updateWeekIntention failed:", res.error);
  }

  // Tending logs a small memory entry against the item's Pillar, which is
  // what grows that root on the Tree. Untending removes it again, so
  // toggling can never farm XP.
  async function toggleTended(id) {
    const w = weekIntentions.find(x => x.id === id);
    const item = w && items.find(i => i.id === w.item_id);
    if (!w || !item) return;
    const today = localDateKey();
    const name = `Tended: ${item.name}`;
    const tended = w.tended_dates || [];

    if (tended.includes(today)) {
      await updateWeekIntention(id, { tended_dates: tended.filter(d => d !== today) });
      const mem = memory.find(m => m.name === name && m.date_key === today);
      setMemory(prev => prev.filter(m => m !== mem));
      if (mem?.id) await supabase.from("memory").delete().eq("id", mem.id).eq("user_id", userId);
      return;
    }

    await updateWeekIntention(id, { tended_dates: [...tended, today] });
    const entry = { name, type: item.type, xp: TEND_XP, date: niceDate(), date_key: today, cat: item.cat, tags: item.tags || [] };
    setMemory(prev => [entry, ...prev]);
    const res = await supabase.from("memory").insert({
      user_id: userId, name: entry.name, type: entry.type, xp: entry.xp,
      date: entry.date, date_key: entry.date_key, cat: entry.cat || null, tags: entry.tags
    }).select().single();
    if (res.data) setMemory(prev => prev.map(m => (m === entry ? { ...m, id: res.data.id } : m)));
  }

  async function restIntentionToday(id) {
    const w = weekIntentions.find(x => x.id === id);
    if (!w) return;
    const today = localDateKey();
    const rested = w.rested_dates || [];
    await updateWeekIntention(id, {
      rested_dates: rested.includes(today) ? rested.filter(d => d !== today) : [...rested, today]
    });
  }

  // ── Wanderings ──
  // Travel plans that live as part of a Dream (one per dream). Loaded
  // outside the main batch so a database without the wanderings migration
  // still loads everything else.
  async function loadWanderings() {
    const [y, st] = await Promise.all([
      supabase.from("wanderings").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("wandering_stops").select("*").eq("user_id", userId).order("position")
    ]);
    if (y.error || st.error) { console.error("[AppData] loadWanderings failed:", y.error || st.error); return; }
    setWanderings(y.data || []);
    setWanderingStops(st.data || []);
  }

  async function createWandering(item) {
    const existing = wanderings.find(y => y.item_id === item.id);
    if (existing) return existing;
    const res = await supabase.from("wanderings").insert({ user_id: userId, item_id: item.id, title: item.name }).select().single();
    if (res.error) throw res.error;
    setWanderings(prev => [...prev, res.data]);
    return res.data;
  }

  async function renameWandering(id, title) {
    const res = await supabase.from("wanderings").update({ title, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setWanderings(prev => prev.map(y => (y.id === id ? { ...y, title } : y)));
  }

  async function addWanderingStop(wanderingId, place) {
    const siblings = wanderingStops.filter(s => s.wandering_id === wanderingId);
    const last = [...siblings].sort((a, b) => a.position - b.position).pop();
    const res = await supabase.from("wandering_stops").insert({
      user_id: userId, wandering_id: wanderingId, position: (last?.position ?? -1) + 1,
      place_name: place.name, place_detail: place.detail || null, country_code: place.countryCode || null,
      lat: place.lat, lng: place.lng,
      // A new stop starts where the last one leaves, so dates flow on.
      arrive: last?.depart || null
    }).select().single();
    if (res.error) throw res.error;
    setWanderingStops(prev => [...prev, res.data]);
    return res.data;
  }

  async function updateWanderingStop(id, updates) {
    const before = wanderingStops;
    setWanderingStops(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    const res = await supabase.from("wandering_stops").update(updates).eq("id", id).eq("user_id", userId);
    if (res.error) { setWanderingStops(before); throw res.error; }
  }

  async function removeWanderingStop(id) {
    const before = wanderingStops;
    setWanderingStops(prev => prev.filter(s => s.id !== id));
    const res = await supabase.from("wandering_stops").delete().eq("id", id).eq("user_id", userId);
    if (res.error) { setWanderingStops(before); throw res.error; }
    // The database unpins its memories (on delete set null); mirror that here.
    setMoments(prev => prev.map(m => (m.stop_id === id ? { ...m, stop_id: null } : m)));
    setJournalEntries(prev => prev.map(e => (e.stop_id === id ? { ...e, stop_id: null } : e)));
  }

  // A journey that isn't part of a Dream yet becomes one, already done: the
  // dream is created (Spirit · Travel), the Wandering joins it, and the
  // usual dream XP is logged on the journey's own date.
  async function makeWanderingDream(wanderingId) {
    const w = wanderings.find(x => x.id === wanderingId);
    if (!w || w.item_id) return;
    const starts = wanderingStops.filter(s => s.wandering_id === wanderingId).map(s => s.arrive).filter(Boolean).sort();
    const dateKey = starts[0] || todayKey();
    const itemRes = await supabase.from("items").insert({
      user_id: userId, name: w.title, type: "dream", cat: "Spirit", subcat: "Travel", note: "", tags: [], intention: "",
      milestones: [], done: true, streak: 0, days: [false, false, false, false, false, false, false],
      created: niceDateFrom(dateKey), created_date: dateKey
    }).select().single();
    if (itemRes.error) throw itemRes.error;
    const linkRes = await supabase.from("wanderings").update({ item_id: itemRes.data.id, updated_at: new Date().toISOString() }).eq("id", wanderingId).eq("user_id", userId);
    if (linkRes.error) throw linkRes.error;
    const memRes = await supabase.from("memory").insert({
      user_id: userId, name: w.title, type: "dream", xp: XP_VALS.dream, date: niceDateFrom(dateKey), date_key: dateKey, cat: "Spirit", tags: []
    });
    if (memRes.error) throw memRes.error;
    await load();
  }

  // Swap a stop with its neighbour (dir -1 = earlier, +1 = later).
  async function moveWanderingStop(id, dir) {
    const stop = wanderingStops.find(s => s.id === id);
    if (!stop) return;
    const ordered = wanderingStops.filter(s => s.wandering_id === stop.wandering_id).sort((a, b) => a.position - b.position);
    const idx = ordered.findIndex(s => s.id === id);
    const other = ordered[idx + dir];
    if (!other) return;
    await updateWanderingStop(stop.id, { position: other.position });
    await updateWanderingStop(other.id, { position: stop.position });
  }

  // Pin (or unpin, with null) an existing memory from a stop's page.
  // kind: "moment" (life_moments) or "entry" (journal_entries).
  async function pinMemory(kind, id, stopId) {
    const table = kind === "moment" ? "life_moments" : "journal_entries";
    const res = await supabase.from(table).update({ stop_id: stopId }).eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    if (kind === "moment") setMoments(prev => prev.map(m => (m.id === id ? { ...m, stop_id: stopId } : m)));
    else setJournalEntries(prev => prev.map(e => (e.id === id ? { ...e, stop_id: stopId } : e)));
  }

  async function setStopDayPlan(stopId, dateKey, steps) {
    const stop = wanderingStops.find(s => s.id === stopId);
    if (!stop) return;
    await updateWanderingStop(stopId, { day_plans: { ...(stop.day_plans || {}), [dateKey]: steps } });
  }

  // This calendar month's AI spend for the signed-in Seeker (their own
  // ai_usage rows; RLS allows reading only those), for the allowance shown
  // in Settings. UTC month, to match the server's count.
  async function aiUsageThisMonth() {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const res = await supabase.from("ai_usage").select("model, input_tokens, output_tokens").eq("user_id", userId).gte("created_at", monthStart);
    if (res.error) throw res.error;
    return { calls: res.data.length, usd: res.data.reduce((s, r) => s + callCostUsd(r.model, r.input_tokens, r.output_tokens), 0) };
  }

  // Every AI call goes through here, so the server's own explanation (a
  // beta allowance reached, a reply withheld by moderation) reaches the
  // Seeker as `e.friendly` instead of a generic failure.
  async function invokeAi(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) {
      let detail = null;
      try { detail = await error.context?.json?.(); } catch { /* not JSON */ }
      const e = new Error(detail?.message || detail?.error || error.message);
      e.code = detail?.error || "ai_failed";
      if (detail?.message) e.friendly = detail.message;
      throw e;
    }
    if (data?.error) {
      const e = new Error(data.message || data.error);
      e.code = data.error;
      if (data.message) e.friendly = data.message;
      throw e;
    }
    return data;
  }

  // ── Seasons ──
  // Read by the infer-season Edge Function from recent Harvests, only when
  // asked. Newest row = the current season; earlier readings are kept.
  async function loadSeasons() {
    const res = await supabase.from("seasons").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (res.error) { console.error("[AppData] loadSeasons failed:", res.error); return; }
    setSeasons(res.data || []);
  }

  async function readSeason() {
    await withAiConsent();
    const data = await invokeAi("infer-season", {});
    if (data?.empty) return { empty: true, message: data.message };
    setSeasons(prev => [data.season, ...prev]);
    return { empty: false, season: data.season };
  }

  // ── The Compass ──
  // One row per walk of the Crossroads; the newest is the current compass,
  // earlier ones are kept so the Mirror can show how it has shifted.
  async function loadCompass() {
    const res = await supabase.from("value_compass").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (res.error) { console.error("[AppData] loadCompass failed:", res.error); return; }
    setCompassHistory(res.data || []);
  }

  async function saveCompass({ ordering, hardest, crossings, compassLine }) {
    const res = await supabase.from("value_compass").insert({
      user_id: userId, ordering, hardest: hardest || null, crossings: crossings || 0,
      compass_line: (compassLine || "").trim() || null
    }).select().single();
    if (res.error) throw res.error;
    setCompassHistory(prev => [res.data, ...prev]);
    return res.data;
  }

  // The line can be written (or rewritten) after the order is set; it
  // belongs to the current compass rather than starting a new one.
  async function saveCompassLine(text) {
    const current = compassHistory[0];
    if (!current) throw new Error("No compass yet");
    const res = await supabase.from("value_compass")
      .update({ compass_line: (text || "").trim() || null, updated_at: new Date().toISOString() })
      .eq("id", current.id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setCompassHistory(prev => [res.data, ...prev.slice(1)]);
    return res.data;
  }

  // ── Focus sessions ──
  // Finished and rested sessions: the garden around the Tree and in Harvest.
  async function loadFocusSessions() {
    const res = await supabase.from("focus_sessions").select("*").eq("user_id", userId).order("ended_at", { ascending: false }).limit(500);
    if (res.error) { console.error("[AppData] loadFocusSessions failed:", res.error); return; }
    setFocusSessions(res.data || []);
  }

  // Saves a finished or rested session. Focus XP comes from the markers
  // reached (capped per day) and goes to the Pillar's roots through memory,
  // like every other XP. A session on a sown intention also counts as
  // tending it today, once (same 3 XP as ticking it).
  async function saveFocusSession({ active, minutes, outcome, note }) {
    const today = localDateKey();
    const earnedToday = memory
      .filter(m => m.date_key === today && (m.tags || []).some(t => t.startsWith("focus:")))
      .reduce((sum, m) => sum + (m.xp || 0), 0);
    const xp = active.pillar ? Math.max(0, Math.min(markerXp(minutes), DAILY_FOCUS_XP_CAP - earnedToday)) : 0;
    // Every completed hour of focus, across all sessions, grows a memento on
    // the flower that crossed it.
    const before = focusSessions.reduce((sum, f) => sum + (f.minutes || 0), 0);
    // Every third hour, a highlight from the Seeker's own journal comes
    // back instead (when they've kept any as mementos).
    const personal = highlights.filter(h => h.as_memento).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const mementos = [];
    for (let hour = Math.floor(before / 60) + 1; hour <= Math.floor((before + minutes) / 60); hour++) {
      if (personal.length && hour % 3 === 0) {
        mementos.push({ highlightId: personal[(hour / 3 - 1) % personal.length].id, hour });
      } else {
        mementos.push({ id: mementoForHour(hour, userId), hour });
      }
    }

    const res = await supabase.from("focus_sessions").insert({
      user_id: userId, item_id: active.itemId || null, intention_id: active.intentionId || null,
      label: active.label, pillar: active.pillar || null, value_name: active.valueName || null,
      planned_minutes: active.plannedMinutes || null, minutes, outcome, note: (note || "").trim() || null, xp, mementos,
      started_at: new Date(active.startedAt).toISOString(), ended_at: new Date().toISOString(), date_key: today
    }).select().single();
    if (res.error) throw res.error;
    setFocusSessions(prev => [res.data, ...prev]);

    if (xp > 0) {
      const entry = {
        name: `Focus: ${active.label}`, type: "focus", xp, date: niceDate(), date_key: today,
        cat: active.pillar, tags: [`focus:${res.data.id}`]
      };
      setMemory(prev => [entry, ...prev]);
      const mem = await supabase.from("memory").insert({ user_id: userId, ...entry }).select().single();
      if (mem.data) setMemory(prev => prev.map(m => (m === entry ? { ...m, id: mem.data.id } : m)));
    }

    const w = active.intentionId && weekIntentions.find(x => x.id === active.intentionId);
    const tendedNow = !!w && !(w.tended_dates || []).includes(today);
    if (tendedNow) await toggleTended(w.id);
    return { session: res.data, xp, tendedNow };
  }

  async function saveFocusNote(id, note) {
    const res = await supabase.from("focus_sessions").update({ note: (note || "").trim() || null })
      .eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setFocusSessions(prev => prev.map(f => (f.id === id ? res.data : f)));
  }

  // ── Journal highlights ──
  // The Seeker's own words worth keeping: tagged, linked to a dream, and
  // (if they like) returning as personal mementos.
  async function loadHighlights() {
    const res = await supabase.from("journal_highlights").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (res.error) { console.error("[AppData] loadHighlights failed:", res.error); return; }
    setHighlights(res.data || []);
  }

  async function addHighlight({ entryId, entryDate, text, tags = [], itemId = null, asMemento = true }) {
    const res = await supabase.from("journal_highlights").insert({
      user_id: userId, entry_id: entryId || null, entry_date: entryDate || null, text: text.trim(),
      tags, item_id: itemId || null, as_memento: asMemento
    }).select().single();
    if (res.error) throw res.error;
    setHighlights(prev => [res.data, ...prev]);
    return res.data;
  }

  async function updateHighlight(id, patch) {
    const res = await supabase.from("journal_highlights").update(patch).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setHighlights(prev => prev.map(h => (h.id === id ? res.data : h)));
  }

  async function deleteHighlight(id) {
    const res = await supabase.from("journal_highlights").delete().eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setHighlights(prev => prev.filter(h => h.id !== id));
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
    // A sitting started from a value or a Pillar puts its Arcanum in the
    // Library too, so everything used lives in one place.
    const arcanum = arcanumForQuestionnaire(questionnaire);
    if (arcanum?.free && !heldArcana.some(h => h.slug === arcanum.slug)) {
      addArcanum(arcanum.slug).catch(e => console.error("[AppData] auto-add Arcanum failed:", e));
    }
    return res.data;
  }

  async function deleteReflectionSession(sessionId) {
    setReflections(prev => prev.filter(r => r.session_id !== sessionId));
    await supabase.from("reflections").delete().eq("session_id", sessionId).eq("user_id", userId);
  }

  // ── YOUniversity: Arcana + own tools ──
  // What the Seeker holds. Free Arcana they add themselves; anything bought
  // is granted server-side only (see the arcana migration).
  async function loadArcana() {
    const [held, tools, progress, uses] = await Promise.all([
      supabase.from("user_arcana").select("*").eq("user_id", userId).order("acquired_at"),
      supabase.from("own_tools").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("arcanum_progress").select("*").eq("user_id", userId).order("completed_at"),
      supabase.from("tool_uses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1000)
    ]);
    if (held.error) console.error("[AppData] load user_arcana failed:", held.error);
    else setHeldArcana(held.data || []);
    if (tools.error) console.error("[AppData] load own_tools failed:", tools.error);
    else setOwnTools(tools.data || []);
    if (progress.error) console.error("[AppData] load arcanum_progress failed:", progress.error);
    else setCourseProgress(progress.data || []);
    if (uses.error) console.error("[AppData] load tool_uses failed:", uses.error);
    else setToolUses(uses.data || []);
    setArcanaLoaded(true);
  }

  // A finished part of a course Arcanum, with its answers. A practice is
  // also the first use of the tool it gives. A challenge lived for some of
  // the Seeker's values grows them: its points are shared between the values
  // chosen, so naming more doesn't count for more. A value they don't hold
  // is kept with the challenge, but nothing is added to their values.
  async function completeCoursePart({ slug, part, data }) {
    const chosen = Array.isArray(data?.values) ? data.values : data?.value ? [data.value] : [];
    const res = await supabase.from("arcanum_progress").upsert({
      user_id: userId, slug, part_id: part.id, data: data || {}, value_name: chosen[0] || null,
      completed_on: todayKey(), completed_at: new Date().toISOString()
    }, { onConflict: "user_id,slug,part_id" }).select().single();
    if (res.error) throw res.error;
    setCourseProgress(prev => [...prev.filter(r => !(r.slug === slug && r.part_id === part.id)), res.data]);
    if (part.kind === "practice") await saveToolUse({ slug, toolId: part.toolId, data });
    if (chosen.length) recordValueWords(chosen, "course");
    let grown = null;
    if (part.kind === "challenge" && chosen.length && part.pts) {
      const heldNames = chosen.filter(n => values.some(v => v.name === n));
      const notHeld = chosen.filter(n => !heldNames.includes(n));
      const share = heldNames.length ? Math.max(1, Math.round(part.pts / heldNames.length)) : 0;
      let current = values;
      const results = [];
      for (const name of heldNames) {
        const r = await honourValue(name, share, `${part.title} (${name})`, current);
        if (r) { results.push(r); current = r.values; }
      }
      grown = { values: results.map(({ values: _v, ...rest }) => rest), notHeld };
    }
    return { row: res.data, grown };
  }

  // ── Values in the Seeker's own words ──
  // Any value word that isn't in the Codex is noted (privately, one row per
  // word) so Cassidy can see which values people reach for. Never blocks.
  async function recordValueWords(words, source) {
    const own = [...new Set(words.map(displayWord).filter(w => w && !isCodexValue(w)))];
    if (!own.length) return;
    const now = new Date().toISOString();
    const rows = own.map(w => ({ user_id: userId, word: w, normalized: normalizeWord(w), source, last_used_at: now }));
    const res = await supabase.from("value_words").upsert(rows, { onConflict: "user_id,normalized" });
    if (res.error) console.error("[AppData] recordValueWords failed:", res.error);
  }

  // A value named in the Seeker's own words, added to their focus.
  async function addOwnValue(text) {
    const name = displayWord(text);
    if (values.some(v => v.name.toLowerCase() === name.toLowerCase())) throw new Error("You already hold this value");
    await addValue(name);
    await recordValueWords([name], "values");
    return name;
  }

  async function loadAdmin() {
    const res = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    const admin = !res.error && Boolean(res.data);
    setIsAdmin(admin);
    setAdminChecked(true);
    if (admin) loadCodexRequests().catch(e => console.error("[AppData] codex requests failed:", e));
  }

  // Admin only: each word people used that isn't in the Codex, with how many
  // people used it (never who). Also refreshes the menu's "new" count.
  async function loadCodexRequests() {
    const res = await supabase.rpc("codex_word_requests");
    if (res.error) throw res.error;
    const rows = res.data || [];
    setCodexNew(rows.filter(r => r.status === "new").length);
    return rows;
  }

  async function setCodexWordStatus(normalized, status) {
    const res = await supabase.rpc("set_codex_word_status", { p_normalized: normalized, p_status: status });
    if (res.error) throw res.error;
  }

  // Rest is suggested, not enforced: the Seeker chose to go on now. Marked
  // on the part just finished, so the next opens on every device.
  async function skipCourseRest(slug, afterPartId) {
    const res = await supabase.from("arcanum_progress").update({ rest_skipped_at: new Date().toISOString() })
      .eq("user_id", userId).eq("slug", slug).eq("part_id", afterPartId).select().single();
    if (res.error) throw res.error;
    setCourseProgress(prev => prev.map(r => (r.slug === slug && r.part_id === afterPartId ? res.data : r)));
  }

  async function saveToolUse({ slug, toolId, data }) {
    const res = await supabase.from("tool_uses").insert({
      user_id: userId, slug, tool_id: toolId, data: data || {}, used_on: todayKey()
    }).select().single();
    if (res.error) throw res.error;
    setToolUses(prev => [res.data, ...prev]);
    return res.data;
  }

  async function deleteToolUse(id) {
    const res = await supabase.from("tool_uses").delete().eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setToolUses(prev => prev.filter(u => u.id !== id));
  }

  // Grows one of the Seeker's values by pts, like a value challenge does.
  // `base` lets several be grown in a row without losing the earlier ones.
  async function honourValue(valueName, pts, label, base = values) {
    const v = base.find(x => x.name === valueName);
    if (!v) return null;
    const { updated, prestiged, crossedInto } = gainValue(v, pts);
    const next = base.map(x => (x.name === valueName ? updated : x));
    await persistValues(next);
    await awardValuePillarXP(valueName, pts, label);
    return { valueName, pts, prestiged, crossedInto, values: next };
  }

  async function addArcanum(slug) {
    const res = await supabase.from("user_arcana")
      .upsert({ user_id: userId, slug, source: "free" }, { onConflict: "user_id,slug", ignoreDuplicates: true })
      .select();
    if (res.error) throw res.error;
    const row = (res.data || [])[0] || { user_id: userId, slug, source: "free", acquired_at: new Date().toISOString() };
    setHeldArcana(prev => (prev.some(h => h.slug === slug) ? prev : [...prev, row]));
  }

  async function removeArcanum(slug) {
    const res = await supabase.from("user_arcana").delete().eq("user_id", userId).eq("slug", slug);
    if (res.error) throw res.error;
    setHeldArcana(prev => prev.filter(h => h.slug !== slug));
  }

  function cleanTool(t) {
    const trim = v => (v || "").trim() || null;
    return { name: (t.name || "").trim(), learned_from: trim(t.learned_from), purpose: trim(t.purpose), how: trim(t.how) };
  }

  async function addOwnTool(tool) {
    const res = await supabase.from("own_tools").insert({ user_id: userId, ...cleanTool(tool) }).select().single();
    if (res.error) throw res.error;
    setOwnTools(prev => [res.data, ...prev]);
    return res.data;
  }

  async function editOwnTool(id, tool) {
    const res = await supabase.from("own_tools").update({ ...cleanTool(tool), updated_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setOwnTools(prev => prev.map(t => (t.id === id ? res.data : t)));
  }

  async function deleteOwnTool(id) {
    const res = await supabase.from("own_tools").delete().eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setOwnTools(prev => prev.filter(t => t.id !== id));
  }

  // Once a day, on the device's own date: used today, or not.
  async function toggleToolUsedToday(id) {
    const tool = ownTools.find(t => t.id === id);
    if (!tool) return;
    const today = todayKey();
    const dates = tool.used_dates || [];
    const used_dates = dates.includes(today) ? dates.filter(d => d !== today) : [...dates, today];
    setOwnTools(prev => prev.map(t => (t.id === id ? { ...t, used_dates } : t)));
    const res = await supabase.from("own_tools").update({ used_dates }).eq("id", id).eq("user_id", userId);
    if (res.error) {
      setOwnTools(prev => prev.map(t => (t.id === id ? tool : t)));
      throw res.error;
    }
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

  // A to-do's own smaller steps (todos.steps). Like the to-do itself: no
  // Pillar, no XP — just a way to make a big-feeling thing doable.
  async function setTodoSteps(id, steps) {
    const prevTodos = todos;
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, steps } : t)));
    const res = await supabase.from("todos").update({ steps }).eq("id", id).eq("user_id", userId);
    if (res.error) {
      setTodos(prevTodos);
      throw res.error;
    }
  }
  async function addTodoStep(id, text) {
    const todo = todos.find(t => t.id === id);
    if (todo) await setTodoSteps(id, [...(todo.steps || []), { text, done: false }]);
  }
  async function toggleTodoStep(id, si) {
    const todo = todos.find(t => t.id === id);
    if (todo) await setTodoSteps(id, (todo.steps || []).map((s, i) => (i === si ? { ...s, done: !s.done } : s)));
  }
  async function removeTodoStep(id, si) {
    const todo = todos.find(t => t.id === id);
    if (todo) await setTodoSteps(id, (todo.steps || []).filter((_, i) => i !== si));
  }

  async function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from("todos").delete().eq("id", id).eq("user_id", userId);
  }

  async function addJournalEntry({ content, mood, entryDate, tags, stopId }) {
    const row = { user_id: userId, content, mood: mood || null, entry_date: entryDate || todayKey(), tags: tags || [] };
    if (stopId !== undefined) row.stop_id = stopId;
    const res = await supabase.from("journal_entries").insert(row).select().single();
    if (res.error) throw res.error;
    setJournalEntries(prev =>
      [res.data, ...prev].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date))
    );
    return res.data;
  }

  async function editJournalEntry(id, { content, mood, entryDate, tags, stopId }) {
    const updates = { content, mood: mood || null, entry_date: entryDate, tags: tags || [], updated_at: new Date().toISOString() };
    if (stopId !== undefined) updates.stop_id = stopId;
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
    // The photo rows go with the entry, but their files must be removed
    // from storage too, or they're left behind using space.
    const { data: pagePhotos } = await supabase.from("journal_photos").select("storage_path").eq("entry_id", id).eq("user_id", userId);
    await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", userId);
    const paths = (pagePhotos || []).map(p => p.storage_path).filter(Boolean);
    if (paths.length) await supabase.storage.from("journal-photos").remove(paths);
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

  // A page photo is converted on the device first (resized to the size
  // Claude reads at, WebP, metadata stripped), then uploaded. Takes a File,
  // or an already-converted { blob, ext } from compressImage.
  async function addJournalPhoto(entryId, photo) {
    const page = photo instanceof Blob ? await compressImage(photo, JOURNAL_PAGE) : photo;
    const storagePath = `${userId}/${entryId}/${Date.now()}.${page.ext}`;
    const { error: upErr } = await supabase.storage.from("journal-photos").upload(storagePath, page.blob, { contentType: page.blob.type });
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

  // "Scan a journal page": photos of handwritten pages become one entry.
  // Consent is asked before anything is saved; then the pages are
  // converted, a new entry is made for them, each page is attached and
  // transcribed in order, and the transcriptions become the entry's text
  // for the Seeker to read and correct. If a transcription can't be done
  // (no allowance left, offline), the entry keeps its pages so it can be
  // tried again from the entry. onProgress({ step, page, pages }).
  async function scanJournalPages(files, { onProgress } = {}) {
    await withAiConsent();
    const pages = files.length;
    onProgress?.({ step: "preparing", page: 0, pages });
    const converted = [];
    for (const f of files) converted.push(await compressImage(f, JOURNAL_PAGE));

    let entry = await addJournalEntry({ content: "", entryDate: todayKey() });
    const texts = [];
    let failure = null;
    for (const [i, page] of converted.entries()) {
      onProgress?.({ step: "reading", page: i + 1, pages });
      const photo = await addJournalPhoto(entry.id, page);
      if (failure) continue;
      try {
        const done = await transcribeJournalPhoto(entry.id, photo.id);
        if (done?.transcription) texts.push(done.transcription.trim());
      } catch (e) {
        failure = e;
      }
    }
    if (texts.length) {
      entry = await editJournalEntry(entry.id, {
        content: texts.join("\n\n"), mood: null, entryDate: entry.entry_date, tags: []
      });
    }
    return { entry, transcribed: texts.length, pages, failure };
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
    const data = await invokeAi("transcribe-journal-photo", { photoId });
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
    const data = await invokeAi("reflect-on-journal-entry", { entryId });
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
    const data = await invokeAi("weekly-reflection", { weekStart });
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
    // Harvest notes go along as context, so chapters reflect what each era
    // held, not only its milestones. (All of them, not just recent weeks.)
    const harvestRes = await supabase.from("week_harvests").select("week_start, note").eq("user_id", userId).not("note", "is", null);
    const harvests = (harvestRes.data || []).filter(h => (h.note || "").trim());
    const data = await invokeAi("suggest-chapters", { moments: payload, harvests });
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
    const lib = getValueEntry(valueName);
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
    const lib = getValueEntry(valueName);
    const v = values.find(x => x.name === valueName);
    const tier = getTier(v?.rating || 0);
    const existingTexts = [
      ...(lib?.challenges || []).map(c => c.text),
      ...valueChallenges.filter(c => c.value_name === valueName).map(c => c.text)
    ];
    const data = await invokeAi("suggest-value-challenges", {
        valueName,
        tagline: lib?.tagline || "",
        tierName: tier.name,
        existingTexts,
        sampleChallenges: (lib?.challenges || []).slice(0, 3)
      });

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
    userId, loaded, sync, items: activeItems, releasedItems, memory, moodLog, values, profile, moments, chapters, valueChallenges, journalEntries,
    identityVisions, todos,
    journalInsights, journalPhotos, weeklyReflections, recentInsights,
    totalXP, level, pillars,
    addItem, completeItem, unachieveItem, deleteItem, editItem, toggleDay, toggleMilestone, addMilestone, removeMilestone,
    getPrestigeTier, prestigeItem,
    activeValues, valueSlots, setValueStatus, saveValueDefinition,
    addValue, saveProfile, completeChallenge, addMoment, editMoment, deleteMoment, suggestChapters, saveChapters,
    addIdentityVision, editIdentityVision, deleteIdentityVision,
    addTodo, toggleTodo, deleteTodo, addTodoStep, toggleTodoStep, removeTodoStep,
    weekIntentions, sowWeek, toggleTended, restIntentionToday,
    weekHarvests, harvestWeek, releaseItem, restoreItem,
    seasons, currentSeason: seasons[0] || null, readSeason, aiUsageThisMonth,
    compassHistory, compass: compassHistory[0] || null, saveCompass, saveCompassLine,
    focusSessions, saveFocusSession, saveFocusNote,
    highlights, addHighlight, updateHighlight, deleteHighlight,
    wanderings, wanderingStops, createWandering, renameWandering, addWanderingStop, updateWanderingStop, removeWanderingStop,
    moveWanderingStop, setStopDayPlan, pinMemory, makeWanderingDream,
    aiConsent, consentPrompt, answerConsentPrompt, setAiConsentGranted,
    reflections, saveReflectionAnswer, deleteReflectionSession,
    isAdmin, adminChecked, codexNew, recordValueWords, addOwnValue, loadCodexRequests, setCodexWordStatus,
    heldArcana, arcanaLoaded, addArcanum, removeArcanum, courseProgress, toolUses, completeCoursePart, skipCourseRest, saveToolUse, deleteToolUse,
    ownTools, addOwnTool, editOwnTool, deleteOwnTool, toggleToolUsedToday,
    completeValueChallenge, generateValueChallenges, addJournalEntry, editJournalEntry, deleteJournalEntry,
    loadJournalPhotos, addJournalPhoto, scanJournalPages, deleteJournalPhoto, transcribeJournalPhoto, editJournalPhotoTranscription,
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
