import { useMemo, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, MoreHorizontal, Plus, Search, Trash2, X, Archive, BookOpen } from "lucide-react";
import { ProjectsProvider, useProjects, STATUSES, COLOURS, colourCss } from "../../lib/projects";
import { usePlugin } from "../../lib/plugins";

// YOUr Projects: its own calm space inside YOU (Cassidy, Oct 25: "redirects
// the YOUser to an easy to navigate screen. Similar to how YOUrigin is
// separate in its function"). Two screens: your projects, and one project.
// No bottom tabs; one clear way back to YOU at the top.

export function ProjectsLayout() {
  const on = usePlugin("projects");
  return (
    <div className="min-h-dvh you-sky flex justify-center font-sans">
      <div
        className="w-full max-w-[640px] px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
      >
        {on ? (
          <ProjectsProvider>
            <Outlet />
          </ProjectsProvider>
        ) : (
          <SwitchedOff />
        )}
      </div>
    </div>
  );
}

function TopRow({ back, backLabel, right }) {
  return (
    <div className="flex items-center justify-between h-12 mb-2">
      <Link to={back} className="inline-flex items-center gap-1.5 min-h-[44px] pr-3 text-bodySm text-textSecondary hover:text-textPrimary">
        <ArrowLeft size={17} strokeWidth={1.75} /> {backLabel}
      </Link>
      {right}
    </div>
  );
}

function SwitchedOff() {
  return (
    <>
      <TopRow back="/" backLabel="YOU" />
      <div className="rounded-card bg-surface1 shadow-card p-5 mt-6 text-center">
        <img src="/images/icons/projects@4x.png" alt="" width="96" height="96" className="w-24 h-24 mx-auto mb-2" />
        <h1 className="font-serif text-h2 text-textPrimary mb-1">YOUr Projects is switched off</h1>
        <p className="text-bodySm text-textSecondary mb-4">Switch it on in Your Own Universe, under Make YOU yours. Anything you made before is still here.</p>
        <Link to="/settings" className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-forestAccent text-onAccent font-medium">
          Open Your Own Universe
        </Link>
      </div>
    </>
  );
}

// ── Your projects ───────────────────────────────────────────────────────
export function ProjectsHome() {
  const { projects, notes, loaded, error, addProject } = useProjects();
  const [adding, setAdding] = useState(false);

  const counts = useMemo(() => {
    const c = {};
    for (const n of notes) {
      c[n.project_id] = c[n.project_id] || { new: 0, doing: 0, done: 0 };
      c[n.project_id][n.status]++;
    }
    return c;
  }, [notes]);

  return (
    <>
      <TopRow back="/" backLabel="YOU" />
      <div className="flex items-center gap-3 mb-1">
        <img src="/images/icons/projects@4x.png" alt="" width="56" height="56" className="w-14 h-14 flex-none" />
        <h1 className="font-serif text-h1 text-textPrimary m-0">YOUr Projects</h1>
      </div>
      <p className="text-bodySm text-textSecondary mb-5">The things you're making, each with its own list of notes and to-dos.</p>

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}
      {!loaded ? (
        <div className="space-y-2.5" aria-busy="true">
          {[0, 1].map(i => <div key={i} className="h-[76px] rounded-card bg-surface1 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map(p => {
            const c = counts[p.id] || { new: 0, doing: 0, done: 0 };
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3.5 rounded-card bg-surface1 shadow-card p-4 hover:bg-surface2">
                <span className="w-3 h-12 rounded-full flex-none" style={{ background: colourCss(p.colour) }} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block font-serif text-h3 text-textPrimary truncate">{p.name}</span>
                  <span className="block text-caption text-textMuted mt-0.5">
                    {c.new} new · {c.doing} doing · {c.done} done
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={1.75} className="text-textMuted flex-none" />
              </Link>
            );
          })}

          {projects.length === 0 && !adding && (
            <div className="rounded-card border border-dashed border-borderC bg-surface1 p-5 text-center">
              <img src="/images/icons/projects@4x.png" alt="" width="88" height="88" className="w-[88px] h-[88px] mx-auto mb-2" />
              <p className="text-body text-textPrimary mb-1">Start your first project</p>
              <p className="text-bodySm text-textSecondary">A book, a garden, a business, a move. Anything with its own running list.</p>
            </div>
          )}

          {adding ? (
            <ProjectForm onCancel={() => setAdding(false)} onSave={async v => { await addProject(v); setAdding(false); }} />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full min-h-[50px] rounded-card border border-borderC bg-[color-mix(in_srgb,var(--surface-1)_60%,transparent)] text-body text-textPrimary inline-flex items-center justify-center gap-2 hover:bg-surface1"
            >
              <Plus size={18} strokeWidth={1.75} /> New project
            </button>
          )}
        </div>
      )}

      <div className="mt-6 rounded-card bg-[color-mix(in_srgb,var(--surface-1)_60%,transparent)] p-4 flex gap-3">
        <BookOpen size={18} strokeWidth={1.75} className="text-gold flex-none mt-0.5" />
        <p className="text-caption text-textSecondary m-0">
          From your YOUrnal: tag an entry with a project's name (for <b className="text-textPrimary">My Book</b>, use <b className="text-textPrimary">#MyBook</b>) and it lands here as a new note.
        </p>
      </div>
    </>
  );
}

function ProjectForm({ initial, onSave, onCancel, saveLabel = "Create project" }) {
  const [name, setName] = useState(initial?.name || "");
  const [colour, setColour] = useState(initial?.colour || "gold");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Give it a name first.");
    setBusy(true);
    setError("");
    try { await onSave({ name: name.trim(), colour }); }
    catch (err) { console.error("[projects] save failed:", err); setError("Couldn't save that just now."); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-card bg-surface1 shadow-card p-4">
      <label htmlFor="project-name" className="block text-label uppercase text-textMuted mb-1.5">Name</label>
      <input
        id="project-name"
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={60}
        placeholder="My Book"
        className="w-full bg-surface2 border border-borderC rounded-sm px-3 py-2.5 text-body text-textPrimary outline-none focus:border-forestAccent mb-3"
      />
      <div className="text-label uppercase text-textMuted mb-1.5">Colour</div>
      <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Colour">
        {COLOURS.map(c => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={colour === c.key}
            aria-label={c.label}
            onClick={() => setColour(c.key)}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${colour === c.key ? "border-textPrimary" : "border-transparent"}`}
            style={{ background: c.css }}
          >
            {colour === c.key && <Check size={15} strokeWidth={2.5} className="text-white drop-shadow" />}
          </button>
        ))}
      </div>
      {error && <div className="text-bodySm text-red-500 mb-2">{error}</div>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 min-h-[44px] rounded-full border border-borderC text-textPrimary">Cancel</button>
        <button type="submit" disabled={busy} className="flex-1 min-h-[44px] rounded-full bg-forestAccent text-onAccent font-medium disabled:opacity-50">
          {busy ? "Saving…" : saveLabel}
        </button>
      </div>
    </form>
  );
}

// ── One project ─────────────────────────────────────────────────────────
export function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, notes, loaded, addNote, editProject, archiveProject, deleteProject } = useProjects();
  const project = projects.find(p => p.id === id);
  const mine = useMemo(() => notes.filter(n => n.project_id === id), [notes, id]);
  const [status, setStatus] = useState("open"); // "open" = New + Doing
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addError, setAddError] = useState("");
  const inputRef = useRef(null);

  if (!loaded) return <TopRow back="/projects" backLabel="Projects" />;
  if (!project) {
    return (
      <>
        <TopRow back="/projects" backLabel="Projects" />
        <p className="text-body text-textSecondary mt-6">This project isn't here any more.</p>
      </>
    );
  }

  const count = k => mine.filter(n => n.status === k).length;
  const tabs = [
    { key: "open", label: "To do", n: count("new") + count("doing") },
    ...STATUSES.map(s => ({ key: s.key, label: s.label, n: count(s.key) }))
  ];
  const q = query.trim().toLowerCase();
  const shown = mine
    .filter(n => (status === "open" ? n.status !== "done" : n.status === status))
    .filter(n => !q || n.text.toLowerCase().includes(q))
    // Doing first, then new; newest first within each.
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "doing" ? -1 : b.status === "doing" ? 1 : 0));

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setAddError("");
    try {
      await addNote(project.id, text, status === "doing" || status === "done" ? status : "new");
      setText("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("[projects] add note failed:", err);
      setAddError("Couldn't add that just now.");
    }
  }

  return (
    <>
      <TopRow
        back="/projects"
        backLabel="Projects"
        right={
          <div className="relative">
            <button type="button" onClick={() => setMenu(m => !m)} aria-label="Project options" aria-expanded={menu} className="w-11 h-11 rounded-full flex items-center justify-center text-textSecondary hover:bg-surface1">
              <MoreHorizontal size={20} strokeWidth={1.75} />
            </button>
            {menu && (
              <div className="absolute right-0 top-12 z-20 w-56 rounded-card bg-surface1 shadow-card border border-borderC py-1">
                <button type="button" onClick={() => { setEditing(true); setMenu(false); }} className="w-full text-left px-4 py-2.5 text-bodySm text-textPrimary hover:bg-surface2">Rename or change colour</button>
                <button type="button" onClick={async () => { await archiveProject(project.id); navigate("/projects"); }} className="w-full text-left px-4 py-2.5 text-bodySm text-textPrimary hover:bg-surface2 inline-flex items-center gap-2">
                  <Archive size={15} strokeWidth={1.75} /> Put away (keeps its notes)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${project.name}" and all ${mine.length} of its notes? This can't be undone.`)) return;
                    await deleteProject(project.id);
                    navigate("/projects");
                  }}
                  className="w-full text-left px-4 py-2.5 text-bodySm text-red-500 hover:bg-surface2 inline-flex items-center gap-2"
                >
                  <Trash2 size={15} strokeWidth={1.75} /> Delete project
                </button>
              </div>
            )}
          </div>
        }
      />

      {editing ? (
        <div className="mb-4">
          <ProjectForm initial={project} saveLabel="Save" onCancel={() => setEditing(false)} onSave={async v => { await editProject(project.id, v); setEditing(false); }} />
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-4">
          <span className="w-3 h-10 rounded-full flex-none" style={{ background: colourCss(project.colour) }} aria-hidden="true" />
          <h1 className="font-serif text-h1 text-textPrimary m-0 leading-tight break-words min-w-0">{project.name}</h1>
        </div>
      )}

      <form onSubmit={add} className="flex gap-2 mb-1">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          enterKeyHint="done"
          placeholder="Add a note or to-do"
          aria-label="Add a note or to-do"
          className="flex-1 min-w-0 bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Add" className="w-12 flex-none rounded-sm bg-forestAccent text-onAccent flex items-center justify-center disabled:opacity-40">
          <Plus size={20} strokeWidth={2} />
        </button>
      </form>
      {addError && <div className="text-bodySm text-red-500 mb-1">{addError}</div>}

      <div className="flex items-center gap-2 mt-4 mb-3">
        <div className="flex-1 flex gap-1 overflow-x-auto" role="tablist" aria-label="Show">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={status === t.key}
              onClick={() => setStatus(t.key)}
              className={`flex-none min-h-[36px] px-3 rounded-full text-caption ${status === t.key ? "bg-forestAccent text-onAccent font-medium" : "text-textSecondary hover:bg-surface1"}`}
            >
              {t.label} <span className="opacity-70">{t.n}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setSearching(s => !s); setQuery(""); }}
          aria-label={searching ? "Close search" : "Search this project"}
          className="w-10 h-10 flex-none rounded-full flex items-center justify-center text-textSecondary hover:bg-surface1"
        >
          {searching ? <X size={17} strokeWidth={1.75} /> : <Search size={17} strokeWidth={1.75} />}
        </button>
      </div>
      {searching && (
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search this project"
          aria-label="Search this project"
          className="w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-2.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent mb-3"
        />
      )}

      <div className="space-y-2">
        {shown.map(n => <NoteCard key={n.id} note={n} />)}
        {shown.length === 0 && (
          <p className="text-bodySm text-textMuted text-center py-6">
            {q ? `Nothing matches "${query}".` : status === "done" ? "Nothing done yet. It'll gather here." : "Nothing here yet. Add the first thing above."}
          </p>
        )}
      </div>
    </>
  );
}

function niceDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function NoteCard({ note }) {
  const { editNote, deleteNote } = useProjects();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const done = note.status === "done";

  async function save() {
    setEditing(false);
    const t = text.trim();
    if (t && t !== note.text) await editNote(note.id, { text: t }).catch(() => setText(note.text));
    else setText(note.text);
  }

  return (
    <div className="rounded-card bg-surface1 shadow-card p-3.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => editNote(note.id, { status: done ? "new" : "done" })}
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "Done. Tap to move back to New" : "Mark done"}
          className={`w-6 h-6 mt-0.5 flex-none rounded-full border flex items-center justify-center ${done ? "bg-gold border-gold text-[#19193D]" : "border-borderC hover:border-gold"}`}
        >
          {done && <Check size={14} strokeWidth={2.5} />}
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={save}
              rows={Math.min(8, Math.max(2, Math.ceil(text.length / 40)))}
              className="w-full bg-surface2 border border-borderC rounded-sm px-2.5 py-2 text-body text-textPrimary outline-none focus:border-forestAccent"
            />
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={`block w-full text-left text-body whitespace-pre-wrap break-words ${done ? "text-textMuted line-through decoration-1" : "text-textPrimary"}`}>
              {note.text}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {STATUSES.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => note.status !== s.key && editNote(note.id, { status: s.key })}
                aria-pressed={note.status === s.key}
                className={`min-h-[28px] px-2.5 rounded-full text-caption border ${note.status === s.key ? "border-forestAccent bg-forestAccent text-onAccent" : "border-borderC text-textMuted hover:text-textPrimary"}`}
              >
                {s.label}
              </button>
            ))}
            <span className="ml-auto text-caption text-textMuted">
              {note.entry_id ? <Link to="/reflections" className="underline underline-offset-2">From YOUrnal</Link> : niceDate(note.created_at)}
            </span>
            <button
              type="button"
              onClick={() => { if (window.confirm("Delete this note?")) deleteNote(note.id); }}
              aria-label="Delete note"
              className="w-8 h-8 rounded-full flex items-center justify-center text-textMuted hover:text-red-500"
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
