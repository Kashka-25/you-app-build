import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";
import {
  XP_VALS, PILLARS, PILLAR_COLORS, VALUE_PILLAR, VALUE_PILLAR2,
  STREAK_BONUS_INTERVAL, getLevel
} from "../constants/app.const";
import { ALL_VALUES_LIB } from "../constants/values.const";

const AppDataContext = createContext(null);

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
  const [sync, setSync] = useState("idle");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setSync("loading");
    try {
      const [itemsRes, memoryRes, moodRes, valuesRes, profileRes] = await Promise.all([
        supabase.from("items").select("*").eq("user_id", userId).order("inserted_at"),
        supabase.from("memory").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }),
        supabase.from("mood_log").select("*").eq("user_id", userId).order("inserted_at", { ascending: false }).limit(90),
        supabase.from("user_values").select("*").eq("user_id", userId),
        supabase.from("profiles").select("*").eq("user_id", userId).single()
      ]);
      setItems((itemsRes.data || []).map(dbToItem));
      setMemory(memoryRes.data || []);
      setMoodLog(moodRes.data || []);
      setValues((valuesRes.data || []).map(r => ({ name: r.name, rating: r.rating || 0, completed: r.completed || [] })));
      setProfile(profileRes.data || null);
      setSync("synced");
    } catch (e) {
      console.error(e);
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

  async function toggleDay(id, dayIndex) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const today = todayKey();
    if (item.days[dayIndex]) {
      const days = [...item.days]; days[dayIndex] = false;
      const updated = { ...item, days, streak: Math.max(0, item.streak - 1) };
      setItems(prev => prev.map(i => (i.id === id ? updated : i)));
      await saveItemRow(updated);
      return;
    }
    const days = [...item.days]; days[dayIndex] = true;
    let streak = item.lastCheckin !== today ? (item.streak || 0) + 1 : item.streak;
    const bonus = streak > 0 && streak % STREAK_BONUS_INTERVAL === 0 ? 15 : 0;
    const totalXp = 3 + bonus;
    const updated = { ...item, days, streak, lastCheckin: today };
    const entry = { name: item.name + " (check-in)", type: "habit", xp: totalXp, date: niceDate(), date_key: today, cat: item.cat, tags: item.tags || [] };
    setItems(prev => prev.map(i => (i.id === id ? updated : i)));
    setMemory(prev => [entry, ...prev]);
    await saveItemRow(updated);
    await supabase.from("memory").insert({
      user_id: userId, name: entry.name, type: entry.type, xp: entry.xp,
      date: entry.date, date_key: entry.date_key, cat: entry.cat, tags: entry.tags
    });
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

    const pillar = VALUE_PILLAR[valueName] || "Spirit";
    const entry = { name: valueName + " challenge: " + challenge.text.slice(0, 30), type: "habit", xp: challenge.pts, date: niceDate(), date_key: todayKey(), cat: pillar, tags: [] };
    setMemory(prev => [entry, ...prev]);
    await supabase.from("memory").insert({ user_id: userId, name: entry.name, type: entry.type, xp: entry.xp, date: entry.date, date_key: entry.date_key, cat: entry.cat, tags: entry.tags });

    if (VALUE_PILLAR2[valueName]) {
      const entry2 = { name: valueName + " challenge (pillar 2)", type: "habit", xp: Math.floor(challenge.pts / 2), date: niceDate(), date_key: todayKey(), cat: VALUE_PILLAR2[valueName], tags: [] };
      setMemory(prev => [entry2, ...prev]);
      await supabase.from("memory").insert({ user_id: userId, name: entry2.name, type: entry2.type, xp: entry2.xp, date: entry2.date, date_key: entry2.date_key, cat: entry2.cat, tags: entry2.tags });
    }
    return { prevRating: v.rating, newRating };
  }

  const value = {
    userId, loaded, sync, items, memory, moodLog, values, profile,
    totalXP, level, pillars,
    addItem, completeItem, unachieveItem, deleteItem, editItem, toggleDay, toggleMilestone,
    addValue, completeChallenge, reload: load
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
