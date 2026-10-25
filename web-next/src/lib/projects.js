import { createContext, createElement, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// YOUr Projects (Oct 25): an optional package, switched on in Your Own
// Universe (lib/plugins.js "projects"). Its own space at /projects, with
// its own data: the projects and project_notes tables
// (supabase/migrations/20261025120000_your_projects.sql). Offline works
// through the same client as the rest of YOU (lib/offline.js).

export const STATUSES = [
  { key: "new", label: "New" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" }
];

// A project's colour: one of the Elements, or gold.
export const COLOURS = [
  { key: "gold", label: "Gold", css: "var(--gold)" },
  { key: "earth", label: "Earth", css: "var(--el-earth)" },
  { key: "water", label: "Water", css: "var(--el-water)" },
  { key: "fire", label: "Fire", css: "var(--el-fire)" },
  { key: "air", label: "Air", css: "var(--el-air)" },
  { key: "ether", label: "Ether", css: "var(--el-ether)" }
];
export const colourCss = key => (COLOURS.find(c => c.key === key) || COLOURS[0]).css;

// "My Book" → "mybook": how a project is named in a YOUrnal tag (#MyBook).
export const tagName = s => String(s).replace(/^#/, "").replace(/[\s_-]+/g, "").toLowerCase();

const Ctx = createContext(null);

export function ProjectsProvider({ children }) {
  const { userId } = useAuth();
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    const [p, n] = await Promise.all([
      supabase.from("projects").select("*").eq("user_id", userId).is("archived_at", null).order("position").order("created_at"),
      supabase.from("project_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ]);
    if (p.error || n.error) {
      console.error("[projects] load failed:", p.error || n.error);
      setError("Couldn't open your projects just now.");
    } else {
      setProjects(p.data || []);
      setNotes(n.data || []);
      setError("");
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  // Offline changes have synced: reload so everything matches the server.
  useEffect(() => {
    window.addEventListener("you:synced", load);
    return () => window.removeEventListener("you:synced", load);
  }, [load]);

  const now = () => new Date().toISOString();

  async function addProject({ name, colour }) {
    const row = { user_id: userId, name: name.trim(), colour, position: projects.length };
    const res = await supabase.from("projects").insert(row).select().single();
    if (res.error) throw res.error;
    setProjects(prev => [...prev, res.data]);
    return res.data;
  }

  async function editProject(id, patch) {
    const res = await supabase.from("projects").update({ ...patch, updated_at: now() }).eq("id", id).eq("user_id", userId).select().single();
    if (res.error) throw res.error;
    setProjects(prev => prev.map(p => (p.id === id ? res.data : p)));
  }

  // Put away: hidden from the list, notes kept.
  async function archiveProject(id) {
    const res = await supabase.from("projects").update({ archived_at: now() }).eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  async function deleteProject(id) {
    const res = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
    if (res.error) throw res.error;
    setProjects(prev => prev.filter(p => p.id !== id));
    setNotes(prev => prev.filter(n => n.project_id !== id));
  }

  async function addNote(projectId, text, status = "new") {
    const row = { user_id: userId, project_id: projectId, text: text.trim(), status, done_at: status === "done" ? now() : null };
    const res = await supabase.from("project_notes").insert(row).select().single();
    if (res.error) throw res.error;
    setNotes(prev => [res.data, ...prev]);
    return res.data;
  }

  async function editNote(id, patch) {
    const full = { ...patch, updated_at: now() };
    if (patch.status) full.done_at = patch.status === "done" ? now() : null;
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...full } : n)));
    const res = await supabase.from("project_notes").update(full).eq("id", id).eq("user_id", userId);
    if (res.error) { load(); throw res.error; }
  }

  async function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
    const res = await supabase.from("project_notes").delete().eq("id", id).eq("user_id", userId);
    if (res.error) { load(); throw res.error; }
  }

  const value = { projects, notes, loaded, error, reload: load, addProject, editProject, archiveProject, deleteProject, addNote, editNote, deleteNote };
  return createElement(Ctx.Provider, { value }, children);
}

export function useProjects() {
  return useContext(Ctx);
}

// A YOUrnal entry tagged with a project's name (#MyBook) is filed into
// that project as a New note; saving the entry again updates the note's
// words and leaves its status alone. Quiet on failure: the entry is saved
// either way. Called from AppDataContext when the package is on.
export async function fileEntryToProjects(entry, userId) {
  const tags = (entry?.tags || []).map(tagName).filter(Boolean);
  if (!tags.length || !entry?.content?.trim() || !userId) return;
  const { data: projects, error } = await supabase.from("projects").select("id,name").eq("user_id", userId).is("archived_at", null);
  if (error || !projects?.length) return;
  const targets = projects.filter(p => tags.includes(tagName(p.name)));
  for (const p of targets) {
    const { data: existing } = await supabase.from("project_notes").select("id").eq("project_id", p.id).eq("entry_id", entry.id).maybeSingle();
    const text = entry.content.trim().slice(0, 4000);
    if (existing) await supabase.from("project_notes").update({ text, updated_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", userId);
    else await supabase.from("project_notes").insert({ user_id: userId, project_id: p.id, entry_id: entry.id, text, status: "new" });
  }
}
