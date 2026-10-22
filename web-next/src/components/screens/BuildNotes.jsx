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
  const { isAdmin, adminChecked, sendBuildNote } = useAppData();
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

      {/* The one-off "send all" catch-up is done (Oct 22): every #idea
          reflection is in Build Notes, and each new save sends itself. */}
      <p className="text-caption text-textMuted mt-6">
        YOUrnal entries tagged #idea or #buildnotes arrive in Build Notes on their own when you save them.
      </p>
    </div>
  );
}
