import { useRef, useState } from "react";
import { Plus, BookOpen, ScanText, Highlighter, Lock, LockOpen } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import JournalEntryModal from "../journal/JournalEntryModal";
import { PlaceTag } from "../wandering/PlacePicker";
import WeeklyReflectionView from "../journal/WeeklyReflectionView";
import ExplorationsView from "../questionnaires/ExplorationsView";
import HighlightsView from "../journal/HighlightsView";
import TagFilter from "../journal/TagFilter";
import DreamPatternsCard from "../journal/DreamPatternsCard";
import { Modal } from "../ui/Modal";
import { AiButton } from "../ui/Premium";
import YOUnderstanding from "../journal/YOUnderstanding";
import MoodLine from "../journal/MoodLine";
import { JournalLockScreen, JournalLockSettings, useJournalLock } from "../journal/JournalLock";

const TABS = [
  { value: "entries", label: "Journal" },
  { value: "highlights", label: "Highlights" },
  { value: "week", label: "Week" },
  { value: "explorations", label: "Explore" }
];

// Each page is one AI call, so a scan is kept to a sensible size.
const MAX_SCAN_PAGES = 6;
// The latest few entries, then "See more" (Cassidy, Oct 24: to neaten the
// page). Each tap shows this many more.
const ENTRIES_SHOWN = 5;

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// One entry, as a row on the journal's single sheet (Cassidy, Nov 2: "super
// easy on the eye"): the date, a few lines, and its tags as quiet words.
function EntryCard({ entry, onEdit, onTag }) {
  const { highlights } = useAppData();
  const keptCount = highlights.filter(h => h.entry_id === entry.id).length;
  return (
    <div className="px-4 py-3.5">
      <button onClick={() => onEdit(entry)} className="block w-full text-left">
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <span className="text-caption text-textMuted">{niceDate(entry.entry_date)}</span>
          {/* Words kept from it as highlights (Cassidy, Nov 2). */}
          {keptCount > 0 && (
            <span className="flex items-center gap-1 text-caption text-[#7A6024] dark:text-gold" title={`${keptCount} kept as ${keptCount === 1 ? "a highlight" : "highlights"}`}>
              <Highlighter size={13} strokeWidth={1.75} aria-hidden="true" />
              {keptCount}
              <span className="sr-only">{keptCount === 1 ? "highlight" : "highlights"}</span>
            </span>
          )}
        </div>
        {entry.content
          ? <div className="text-bodySm leading-relaxed text-textPrimary whitespace-pre-wrap line-clamp-3">{entry.content}</div>
          : <div className="text-bodySm text-textMuted italic">Scanned pages, not transcribed yet. Tap to open.</div>}
        <PlaceTag stopId={entry.stop_id} className="mt-1.5" />
      </button>
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5">
          {entry.tags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onTag(t)}
              aria-label={`Show entries tagged ${t}`}
              className="text-caption text-textMuted hover:text-textPrimary min-h-[28px]"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const tagKey = t => String(t).replace(/^#/, "").toLowerCase();

// Every tag used, most used first, so any of them can be opened.
function tagCounts(entries) {
  const counts = new Map();
  for (const e of entries) for (const t of e.tags || []) {
    const k = tagKey(t);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export default function Reflections() {
  const { journalEntries, loaded } = useAppData();
  const [tab, setTab] = useState("entries");
  const [openTag, setOpenTag] = useState(null);
  const [limit, setLimit] = useState(ENTRIES_SHOWN);
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const { scanJournalPages } = useAppData();
  const scanInput = useRef(null);
  const [scanning, setScanning] = useState(false);
  // { step, page, pages }: set only once consent is given, so progress never
  // shows behind the consent question.
  const [scan, setScan] = useState(null);
  const [scanNote, setScanNote] = useState("");
  const [scanHidden, setScanHidden] = useState(false);
  // The optional lock (lib/journalLock.js): while it's on and closed, the
  // lock screen stands in for the whole page.
  const lock = useJournalLock();
  const [lockSettings, setLockSettings] = useState(false);

  // Photos of handwritten pages become one entry: converted small, read by
  // AI (after consent), then opened so the words can be checked.
  async function handleScan(e) {
    const files = [...(e.target.files || [])].slice(0, MAX_SCAN_PAGES);
    e.target.value = "";
    if (!files.length) return;
    setScanNote("");
    setScanHidden(false);
    setScanning(true);
    try {
      const result = await scanJournalPages(files, { onProgress: setScan });
      if (result.failure) {
        setScanNote(
          (result.failure.friendly || "Some pages couldn't be read just now.") +
          " The pages are saved on the entry; you can try reading them again from there."
        );
      } else {
        setScanNote("Here's what YOU read. It's a first draft: check the words, then save.");
      }
      setEditingEntry(result.entry);
    } catch (err) {
      // "Not now" on the consent prompt: nothing was saved, nothing to say.
      if (err?.code !== "consent_declined") {
        console.error("[Reflections] scan failed:", err);
        setScanNote(err?.friendly || "Couldn't scan those pages. Check your connection and try again.");
      }
    }
    setScan(null);
    setScanning(false);
  }

  // Saving closes the page. Photos and a reflection live on the saved entry:
  // tap it in the list to add them.
  const [savedNote, setSavedNote] = useState("");
  const savedTimer = useRef(null);
  function handleSaved(saved, { wasNew } = {}) {
    setAddOpen(false);
    setEditingEntry(null);
    setScanNote("");
    setSavedNote(wasNew ? "Saved. Tap the entry any time to add photos or get a reflection." : "Saved.");
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedNote(""), 5000);
  }

  if (lock.locked) {
    return (
      <div className="pt-1 pb-24 px-5">
        <JournalLockScreen onUnlocked={lock.refresh} />
      </div>
    );
  }

  return (
    <div className="pt-1 pb-24 px-5">
      <YOUnderstanding onWrite={() => { setTab("entries"); setAddOpen(true); }} />

      {/* A painted header (Cassidy, Nov 2): the open book from the YOU set,
          the name over it, and the two ways to begin. A main page of its own,
          so no back link. */}
      <section aria-labelledby="yournal-title" className="relative mt-3 mb-4 rounded-card overflow-hidden shadow-card">
        <img
          src="/images/home/tool-journal.webp"
          alt=""
          width="520"
          height="370"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] dark:brightness-[0.62] dark:saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F0] via-[#FBF7F0]/70 via-40% to-transparent dark:from-[#0B0B1F] dark:via-[#0B0B1F]/70" />
        <button
          type="button"
          onClick={() => setLockSettings(true)}
          aria-label={lock.isSet ? "YOUrnal lock: on. Lock now, change the PIN or turn it off" : "Lock YOUrnal with a PIN"}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-white/70 dark:bg-black/35 border border-borderC dark:border-white/15 text-caption text-textPrimary dark:text-cream backdrop-blur-sm"
        >
          {lock.isSet ? <Lock size={14} strokeWidth={1.75} /> : <LockOpen size={14} strokeWidth={1.75} />}
          {lock.isSet ? "Locked" : "Add a lock"}
        </button>
        <div className="relative flex flex-col justify-end min-h-[168px] p-4 pt-16">
          <h1 id="yournal-title" className="font-serif text-[30px] leading-tight text-textPrimary dark:text-cream m-0">YOUrnal</h1>
          <p className="text-bodySm text-textSecondary dark:text-[color-mix(in_srgb,var(--cream)_88%,transparent)] m-0">Your journal, just for you.</p>
          {tab === "entries" && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Write</Button>
              <AiButton size="sm" onClick={() => scanInput.current?.click()} busy={scanning}>
                {scanning ? "Scanning…" : "Scan a page"}
              </AiButton>
            </div>
          )}
        </div>
      </section>

      <input ref={scanInput} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={handleScan} />
      {savedNote && (
        <div role="status" className="text-bodySm text-textPrimary bg-surface1 border border-borderC rounded-sm p-3 mb-4">{savedNote}</div>
      )}
      {scanNote && !editingEntry && (
        <div className="text-bodySm text-textSecondary bg-surface1 rounded-sm p-3 mb-4">{scanNote}</div>
      )}

      <div className="mb-4">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "highlights" ? (
        <HighlightsView onOpenEntry={setEditingEntry} />
      ) : tab === "week" ? (
        <WeeklyReflectionView />
      ) : tab === "explorations" ? (
        <ExplorationsView />
      ) : !loaded ? (
        <div className="text-body text-textSecondary">Loading…</div>
      ) : journalEntries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing written yet"
          description="Whatever's on your mind — a thought, a mood, how today went. Tap Write to start."
          actionLabel="Write your first entry"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <>
          {/* Your moods and Tags as two tiles side by side; whichever is
              open takes the full width beneath. */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <MoodLine onOpenEntry={setEditingEntry} />
            <TagFilter tile tags={tagCounts(journalEntries)} value={openTag} onChange={t => { setOpenTag(t); setLimit(ENTRIES_SHOWN); }} />
          </div>
          {["dream", "dreams"].includes(openTag) && (
            <DreamPatternsCard dreamCount={journalEntries.filter(e => (e.tags || []).some(t => ["dream", "dreams"].includes(tagKey(t)))).length} />
          )}
          <EntryList
            entries={journalEntries.filter(e => !openTag || (e.tags || []).some(t => tagKey(t) === openTag))}
            limit={limit}
            onMore={() => setLimit(n => n + ENTRIES_SHOWN * 2)}
            onEdit={setEditingEntry}
            onTag={t => { setOpenTag(tagKey(t)); setLimit(ENTRIES_SHOWN); }}
          />
        </>
      )}

      <JournalLockSettings open={lockSettings} onClose={() => setLockSettings(false)} onChanged={lock.refresh} />
      <JournalEntryModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={handleSaved} />
      <JournalEntryModal
        open={Boolean(editingEntry)}
        entry={editingEntry}
        notice={scanNote}
        onClose={() => { setEditingEntry(null); setScanNote(""); }}
        onSaved={handleSaved}
      />

      {/* Progress while pages are prepared and read. Closing only hides it:
          the scan carries on, and the entry opens when it's ready. */}
      <Modal open={Boolean(scan) && !scanHidden} onClose={() => setScanHidden(true)} title="Scanning your pages">
        <div className="flex items-center gap-3 py-2">
          <ScanText size={20} strokeWidth={1.75} className="text-forestAccent flex-none" />
          <div className="text-body text-textPrimary">
            {scan?.step === "reading"
              ? scan.pages > 1 ? `Reading page ${scan.page} of ${scan.pages}…` : "Reading your page…"
              : scan?.pages > 1 ? `Preparing ${scan.pages} pages…` : "Preparing your page…"}
          </div>
        </div>
        <div className="text-caption text-textMuted mt-1">
          Pages are made smaller on your device first. Only the page photos are sent to read the handwriting.
          You can close this; the entry opens when it's ready.
        </div>
      </Modal>
    </div>
  );
}

// The newest entries first, a few at a time.
function EntryList({ entries, limit, onMore, onEdit, onTag }) {
  const left = entries.length - limit;
  return (
    <div className="rounded-card border border-borderC bg-surface1 divide-y divide-borderC overflow-hidden">
      {entries.slice(0, limit).map(entry => <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onTag={onTag} />)}
      {left > 0 && (
        <button
          type="button"
          onClick={onMore}
          className="w-full min-h-[48px] text-bodySm text-textSecondary hover:text-textPrimary"
        >
          See more · {left} older {left === 1 ? "entry" : "entries"}
        </button>
      )}
    </div>
  );
}
