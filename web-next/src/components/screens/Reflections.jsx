import { useRef, useState } from "react";
import { Plus, BookOpen, ScanText } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { BackRow, SectionTitle } from "../Primitives";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { MOODS } from "../ui/Input";
import JournalEntryModal from "../journal/JournalEntryModal";
import { PlaceTag } from "../wandering/PlacePicker";
import WeeklyReflectionView from "../journal/WeeklyReflectionView";
import ExplorationsView from "../questionnaires/ExplorationsView";
import HighlightsView from "../journal/HighlightsView";
import { Modal } from "../ui/Modal";
import { AiButton } from "../ui/Premium";

const TABS = [
  { value: "entries", label: "Entries" },
  { value: "highlights", label: "Highlights" },
  { value: "week", label: "This Week" },
  { value: "explorations", label: "Explorations" }
];

// Each page is one AI call, so a scan is kept to a sensible size.
const MAX_SCAN_PAGES = 6;

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function EntryCard({ entry, onEdit }) {
  const moodInfo = MOODS.find(m => m.key === entry.mood);
  return (
    <button onClick={() => onEdit(entry)} className="block w-full text-left rounded-card bg-surface1 shadow-card p-4 mb-3">
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <span className="text-caption text-textMuted">{niceDate(entry.entry_date)}</span>
        {moodInfo && (
          <span className="flex items-center gap-1 text-caption text-textMuted">
            <moodInfo.Icon size={14} strokeWidth={1.75} />
            {moodInfo.label}
          </span>
        )}
      </div>
      {entry.content
        ? <div className="text-bodySm text-textPrimary whitespace-pre-wrap line-clamp-4">{entry.content}</div>
        : <div className="text-bodySm text-textMuted italic">Scanned pages, not transcribed yet. Tap to open.</div>}
      <PlaceTag stopId={entry.stop_id} className="mt-1.5" />
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.tags.map(t => (
            <span key={t} className="text-caption bg-surface3 text-textSecondary px-2 py-0.5 rounded-full">#{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function Reflections() {
  const { journalEntries, loaded } = useAppData();
  const [tab, setTab] = useState("entries");
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

  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <div className="flex justify-between items-center gap-3 mt-4">
        <h1 className="font-serif text-h2 font-medium m-0">Reflections</h1>
        {tab === "entries" && (
          <div className="flex gap-2">
            <AiButton size="sm" onClick={() => scanInput.current?.click()} busy={scanning}>
              {scanning ? "Scanning…" : "Scan a page"}
            </AiButton>
            <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Write</Button>
          </div>
        )}
      </div>
      <div className="text-bodySm text-textSecondary mt-2 mb-4">Your journal — just for you.</div>

      <input ref={scanInput} type="file" accept="image/*" multiple className="hidden" onChange={handleScan} />
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
        journalEntries.map(entry => <EntryCard key={entry.id} entry={entry} onEdit={setEditingEntry} />)
      )}

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
