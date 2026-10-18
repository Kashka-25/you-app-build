import { useState } from "react";
import { Hammer, Send } from "lucide-react";
import { useAppData, BUILD_PROJECTS } from "../../lib/AppDataContext";
import { BackRow } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";

// The YOU ecosystem comes first; any other project added here is remembered
// on this device, and Notion adds the new name as an option.
const PROJECTS_KEY = "you.buildNotes.projects";
const DEFAULT_PROJECTS = BUILD_PROJECTS;

function readProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    return [...new Set([...DEFAULT_PROJECTS, ...saved])];
  } catch {
    return DEFAULT_PROJECTS;
  }
}

function saveProjects(list) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(list)); } catch { /* per-device nicety only */ }
}

// For Cassidy as creator: one place to jot an edit or idea for this app or
// any other project. Each note goes to the "Build Notes" database in Notion,
// where Claude picks it up. YOUrnal entries tagged #idea go there on their own; add a project tag (#YOUniversity, #CommYOUnity, #YOUrigin) to file one elsewhere.
export default function BuildNotes() {
  const { isAdmin, adminChecked, sendBuildNote, sendAllIdeaEntries, ideaEntryCount } = useAppData();
  const [text, setText] = useState("");
  const [projects, setProjects] = useState(readProjects);
  const [project, setProject] = useState(DEFAULT_PROJECTS[0]);
  const [adding, setAdding] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok, message, url? }

  async function send() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await sendBuildNote({ text: text.trim(), project, source: "Quick note" });
      setText("");
      setStatus({ ok: true, message: `Sent to Build Notes under ${project}.`, url: res?.url });
    } catch (e) {
      setStatus({ ok: false, message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function sendAll() {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const n = await sendAllIdeaEntries();
      setStatus({ ok: true, message: `${n} #idea reflection${n === 1 ? "" : "s"} in Build Notes.` });
    } catch (e) {
      setStatus({ ok: false, message: e.message });
    } finally {
      setBusy(false);
    }
  }

  function addProject() {
    const name = newProject.trim();
    if (!name) return setAdding(false);
    const next = [...new Set([...projects, name])];
    setProjects(next);
    saveProjects(next.filter(p => !DEFAULT_PROJECTS.includes(p)));
    setProject(name);
    setNewProject("");
    setAdding(false);
  }

  if (!adminChecked) {
    return <div className="pt-1 pb-24 px-5"><BackRow /><div className="text-body text-textSecondary mt-4">Loading…</div></div>;
  }
  if (!isAdmin) {
    return (
      <div className="pt-1 pb-24 px-5">
        <BackRow />
        <EmptyState icon={Hammer} title="For the creator" description="This page is only for whoever builds YOU." />
      </div>
    );
  }

  const chip = active =>
    `text-caption px-3 py-1.5 rounded-full border ${active ? "border-forestAccent bg-forestAccent text-onAccent" : "border-borderC text-textSecondary hover:border-forestAccent hover:text-textPrimary"}`;

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <h1 className="font-serif text-h2 font-medium mt-4 mb-0">Build notes</h1>
      <div className="text-bodySm text-textSecondary mt-2 mb-4">
        An edit or idea for YOU or any of your projects. It goes to Build Notes in your Notion, where Claude reads it. YOUrnal entries tagged #idea go there on their own; add a project tag (#YOUniversity, #CommYOUnity, #YOUrigin) to file one elsewhere.
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Project">
        {projects.map(p => (
          <button key={p} type="button" onClick={() => setProject(p)} className={chip(p === project)} aria-pressed={p === project}>
            {p}
          </button>
        ))}
        {adding ? (
          <input
            autoFocus
            value={newProject}
            onChange={e => setNewProject(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addProject(); if (e.key === "Escape") setAdding(false); }}
            onBlur={addProject}
            placeholder="Project name"
            aria-label="New project name"
            className="text-caption px-3 py-1.5 rounded-full border border-forestAccent bg-surface1 text-textPrimary outline-none w-36"
          />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={chip(false)}>+ Project</button>
        )}
      </div>

      <textarea
        rows={6}
        className={`${fieldClass} mb-3`}
        placeholder="What needs changing, and where?"
        value={text}
        onChange={e => setText(e.target.value)}
        aria-label="Build note"
      />

      <Button icon={Send} onClick={send} disabled={!text.trim() || busy} className="w-full">
        {busy ? "Sending…" : "Send to Build Notes"}
      </Button>

      {status && (
        <div role={status.ok ? "status" : "alert"} className={`text-bodySm mt-3 ${status.ok ? "text-forestAccent" : "text-red-500"}`}>
          {status.message}{" "}
          {status.url && <a href={status.url} target="_blank" rel="noreferrer" className="underline">Open in Notion</a>}
        </div>
      )}

      <div className="rounded-card bg-surface1 shadow-card p-4 mt-6">
        <div className="text-body text-textPrimary">Your #idea reflections</div>
        <div className="text-bodySm text-textSecondary mt-1 mb-3">
          {ideaEntryCount === 0
            ? "None yet. Tag a reflection #idea and it'll be sent when you save it."
            : `${ideaEntryCount} tagged. New saves send on their own; this sends any from before, without doubling up.`}
        </div>
        <Button variant="secondary" size="sm" onClick={sendAll} disabled={busy || ideaEntryCount === 0}>
          Send all #idea reflections
        </Button>
      </div>
    </div>
  );
}
