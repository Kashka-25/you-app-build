import { useState } from "react";
import { Plus, Map, Wheat, ChevronDown, ChevronRight } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";
import { GlowBubble } from "../ui/GlowBubble";
import { AiCard, AiLabel } from "../ui/Premium";
import AddMomentModal from "./AddMomentModal";
import { PhotoCarousel } from "../ui/PhotoCarousel";
import { PlaceTag } from "../wandering/PlacePicker";
import SeasonCard from "./SeasonCard";
import SeasonReading from "./SeasonReading";
import YearAgoCard from "./YearAgoCard";
import { Link } from "react-router-dom";
import { localDateKey } from "../../lib/week";

function niceDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const dayOf = iso => (iso ? localDateKey(new Date(iso)) : localDateKey());

// The photos swipe on their own; the rest of the card opens the editor.
function MemoryCard({ moment, onEdit }) {
  const hasPhotos = (moment.photo_urls || []).length > 0;
  return (
    <div className="rounded-card bg-surface1 shadow-card p-4 mb-3">
      {hasPhotos && <PhotoCarousel urls={moment.photo_urls} thumbs={moment.photo_thumbs} className="h-44 mb-3" />}
      <button onClick={() => onEdit(moment)} className="block w-full text-left">
        <div className="flex items-center justify-between mb-1.5 gap-3">
          <div className="font-serif text-h3 text-textPrimary">{moment.title}</div>
          <span className="text-caption text-textMuted flex-none">{niceDate(moment.moment_date)}</span>
        </div>
        {moment.description && <div className="text-bodySm text-textSecondary">{moment.description}</div>}
        <PlaceTag stopId={moment.stop_id} className="mt-1.5" />
        {!hasPhotos && <div className="text-caption text-textMuted mt-1.5">Tap to edit or add photos</div>}
      </button>
    </div>
  );
}

// What each kind of reading is called on the timeline.
function readingLabel(reading) {
  const kind = reading.based_on?.kind;
  if (kind === "equinox" || kind === "season") return reading.based_on?.title || "Season review";
  if (kind === "lookback") return "Look back";
  return "Your season";
}

// A season reading, Look back or Season review, kept in the timeline at
// the end of the stretch it read (Cassidy, Nov 2), in its premium gold.
// Tap to open it full screen, where it can also be deleted.
function ReadingCard({ reading }) {
  const [open, setOpen] = useState(false);
  const based = reading.based_on || {};
  return (
    <AiCard className="mb-3">
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <div className="flex items-center justify-between gap-3 mb-1">
          <AiLabel>{readingLabel(reading)}</AiLabel>
          {based.from && (
            <span className="text-caption text-[var(--ai-text-2)] flex-none">
              {niceDate(based.from)} – {niceDate(based.to || based.from)}
            </span>
          )}
        </div>
        <div className="font-serif text-h3 ai-gold-text">{reading.name}</div>
        {reading.blurb && <div className="text-bodySm text-[var(--ai-text-2)] mt-1 line-clamp-2">{reading.blurb}</div>}
        <span className="inline-flex items-center gap-1 text-caption text-[var(--ai-text-2)] mt-2">
          Open the reading <ChevronRight size={14} strokeWidth={1.75} />
        </span>
      </button>
      <SeasonReading reading={open ? reading : null} onClose={() => setOpen(false)} />
    </AiCard>
  );
}

// Where a life chapter begins in the timeline: its name, dates and what it
// was about, with the notes kept at Harvest during it folded inside.
function ChapterMarker({ chapter, harvests, count }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 mb-3">
      <div className="flex items-start gap-3">
        <GlowBubble icon={Map} size={36} className="mt-0.5" animate={false} />
        <div className="flex-1 min-w-0">
          <div className="text-label uppercase text-gold">Chapter</div>
          <div className="font-serif text-h2 text-textPrimary leading-tight">{chapter.title}</div>
          <div className="text-caption text-textMuted mt-0.5">
            {niceDate(chapter.range_start)} – {chapter.range_end ? niceDate(chapter.range_end) : "now"}
            {" · "}{count} {count === 1 ? "memory" : "memories"}
          </div>
          {chapter.blurb && <div className="text-bodySm text-textSecondary mt-1">{chapter.blurb}</div>}
          {harvests.length > 0 && (
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 min-h-[32px] text-caption text-textSecondary mt-1">
              <Wheat size={12} strokeWidth={1.75} /> From your harvests · {harvests.length}
              <ChevronDown size={13} strokeWidth={1.75} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
          {open && harvests.map(h => (
            <div key={h.week_start} className="border-l-2 border-gold pl-2.5 mb-2">
              <div className="text-caption text-textMuted">Week of {niceDate(h.week_start)}</div>
              <div className="text-bodySm text-textPrimary italic">{h.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-px mt-3 bg-gradient-to-r from-gold/50 via-gold/20 to-transparent" aria-hidden="true" />
    </div>
  );
}

// Harvest notes kept during a chapter: what each week held, in your words.
function chapterHarvests(harvests, chapter) {
  return harvests
    .filter(h => (h.note || "").trim() && h.week_start >= chapter.range_start && (!chapter.range_end || h.week_start <= chapter.range_end))
    .sort((a, b) => (a.week_start > b.week_start ? 1 : -1));
}

const inChapter = (date, c) => date >= c.range_start && (!c.range_end || date <= c.range_end);

// Chapters (Cassidy, Nov 2): the season to read at the top, then one
// Memories timeline, newest first. Memories, season readings, Look backs
// and Season reviews sit in it by date, and each life chapter is marked
// just above its newest entry.
export default function ChaptersView() {
  const { moments, chapters, weekHarvests, seasons } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);

  const entries = [
    ...moments.map(m => ({ kind: "memory", date: m.moment_date, key: `m-${m.id}`, moment: m })),
    ...seasons.map(s => ({ kind: "reading", date: s.based_on?.to || dayOf(s.created_at), key: `s-${s.id}`, reading: s }))
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // A chapter's marker goes just before the first entry inside it, or the
  // first entry older than it; a chapter with nothing after it goes last.
  const sortedChapters = [...chapters].sort((a, b) => (a.range_start < b.range_start ? 1 : -1));
  const counts = Object.fromEntries(chapters.map(c => [c.id, moments.filter(m => inChapter(m.moment_date, c)).length]));
  const markerFor = c => ({ kind: "chapter", key: `c-${c.id}`, chapter: c });
  const timeline = [];
  const marked = new Set();
  for (const e of entries) {
    for (const c of sortedChapters) {
      if (!marked.has(c.id) && e.date <= (c.range_end || "9999-12-31")) {
        marked.add(c.id);
        timeline.push(markerFor(c));
      }
    }
    timeline.push(e);
  }
  sortedChapters.filter(c => !marked.has(c.id)).forEach(c => timeline.push(markerFor(c)));

  return (
    <>
      <SeasonCard />

      {/* A quiet gold divide between the AI readings above and your own
          memories below (Cassidy, Nov 4). */}
      <div className="flex items-center gap-3 my-7" aria-hidden="true">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[color-mix(in_srgb,var(--gold)_55%,transparent)]" />
        <svg width="14" height="14" viewBox="0 0 24 24" className="flex-none text-gold">
          <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
        </svg>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[color-mix(in_srgb,var(--gold)_55%,transparent)]" />
      </div>

      <div className="flex justify-between items-center gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-serif text-h2 text-textPrimary m-0">Memories</h2>
          {/* Legacy, folded in as Your years (Cassidy, Nov 5). */}
          <Link to="/legacy" className="inline-flex items-center gap-1 min-h-[32px] text-caption font-medium text-forestAccent">
            Your years, and your story as a book <ChevronRight size={13} strokeWidth={1.75} />
          </Link>
        </div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAddOpen(true)}>Add memory</Button>
      </div>

      <YearAgoCard />

      {timeline.length === 0 ? (
        <div className="rounded-card border border-dashed border-borderC bg-surface1 p-4 text-bodySm text-textMuted">
          No memories yet. Tap Add memory to start your timeline: the moments you want to keep, with photos and a few words.
          Backfill the past or add new ones as they happen.
        </div>
      ) : (
        timeline.map(t =>
          t.kind === "chapter" ? <ChapterMarker key={t.key} chapter={t.chapter} harvests={chapterHarvests(weekHarvests, t.chapter)} count={counts[t.chapter.id] || 0} />
          : t.kind === "reading" ? <ReadingCard key={t.key} reading={t.reading} />
          : <MemoryCard key={t.key} moment={t.moment} onEdit={setEditingMoment} />
        )
      )}

      <AddMomentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddMomentModal open={Boolean(editingMoment)} moment={editingMoment} onClose={() => setEditingMoment(null)} />
    </>
  );
}
