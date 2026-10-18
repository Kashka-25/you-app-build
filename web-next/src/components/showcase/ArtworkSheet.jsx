import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink, Flag, Heart } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { creditLine, kronkProfileUrl, safeUrl, saveGate, supportLinks } from "../../lib/showcase";
import { reportWork, saveWork, unsaveWork } from "../../lib/showcaseApi";
import ShareToKronk from "../ShareToKronk";

// A shared piece in full: the display-sized image or the words, who made it
// and who offered it, how to support them, and Save (free, or after an
// honour-based "I've contributed").
export default function ArtworkSheet({ work, saved, onSavedChange, onClose }) {
  const [contributed, setContributed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setContributed(false);
    setError("");
    setReporting(false);
    setReason("");
    setReported(false);
  }, [work?.id]);

  if (!work) return <Modal open={false} onClose={onClose} />;

  const artist = work.artist;
  const name = artist?.display_name || "An artist";
  const links = supportLinks(artist?.links);
  const kronk = kronkProfileUrl(artist?.kronk_handle);
  const kronkPost = safeUrl(work.kronk_post_url);
  const offered = (work.credits || []).filter(c => c.role === "offered_by");
  const needsContribution = work.save_mode === "contribution";
  const gate = saveGate(work, contributed);

  async function toggleSave() {
    setBusy(true);
    setError("");
    try {
      if (saved) {
        await unsaveWork(work.id);
        onSavedChange(work.id, null);
      } else {
        if (!gate.ok) return;
        await saveWork(work.id, contributed);
        onSavedChange(work.id, { work_id: work.id, contributed, created_at: new Date().toISOString() });
      }
    } catch (e) {
      console.error("[Showcase] save failed:", e);
      setError("Couldn't save that just now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReport() {
    setBusy(true);
    try {
      await reportWork(work.id, reason.trim());
      setReported(true);
      setReporting(false);
    } catch (e) {
      console.error("[Showcase] report failed:", e);
      setError("Couldn't send the report. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={work.title || (work.kind === "image" ? "Artwork" : "Featured words")}>
      {work.kind === "image" && work.imageUrl && (
        <div className="relative -mx-1 mb-3 rounded-card overflow-hidden bg-surface3">
          <img
            src={work.imageUrl}
            alt={work.alt_text || work.title || `Artwork by ${name}`}
            width={work.image_width || undefined}
            height={work.image_height || undefined}
            className="w-full h-auto max-h-[52vh] object-contain select-none"
            draggable="false"
            onContextMenu={e => e.preventDefault()}
          />
          <span className="absolute bottom-1.5 right-2 text-[10px] text-white/80 drop-shadow">© {name}</span>
        </div>
      )}
      {work.kind === "words" && (
        <blockquote className="font-serif text-[17px] leading-relaxed text-textPrimary whitespace-pre-line m-0 mb-3 pl-3 border-l-2 border-gold">
          {work.body}
        </blockquote>
      )}
      {work.kind === "image" && work.body && <p className="text-bodySm text-textSecondary m-0 mb-3 whitespace-pre-line">{work.body}</p>}

      <div className="text-bodySm text-textPrimary font-medium">{creditLine(name, work.credits)}</div>
      {artist?.bio && <p className="text-bodySm text-textSecondary m-0 mt-1">{artist.bio}</p>}

      {(offered.length > 0 || kronk || kronkPost) && (
        <ul className="list-none p-0 m-0 mt-2 space-y-1">
          {kronk && (
            <li>
              <a href={kronk} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-caption text-forestAccent min-h-[32px]">
                {name} on Kronk <ExternalLink size={12} strokeWidth={1.75} />
              </a>
            </li>
          )}
          {kronkPost && (
            <li>
              <a href={kronkPost} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-caption text-forestAccent min-h-[32px]">
                Also shared on Kronk <ExternalLink size={12} strokeWidth={1.75} />
              </a>
            </li>
          )}
          {offered.map(c => {
            const href = safeUrl(c.url) || kronkProfileUrl(c.kronk_handle);
            return (
              <li key={c.id} className="text-caption text-textSecondary">
                Offered by{" "}
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-forestAccent">{c.name}</a>
                ) : (
                  c.name
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ShareToKronk
        text={`${work.title ? `“${work.title}” by ` : "A piece by "}${name}${artist?.kronk_handle ? ` ${artist.kronk_handle}` : ""}. Found it in the YOU Showcase. 🎨`}
        label="Share this piece on Kronk"
        className="mt-2"
      />

      <section aria-labelledby="support-artist" className="mt-4 pt-3 border-t border-borderC">
        <h3 id="support-artist" className="flex items-center gap-2 text-label uppercase text-gold m-0 mb-2">
          <Heart size={13} strokeWidth={1.75} /> Support this artist
        </h3>
        {links.length ? (
          <div className="flex flex-wrap gap-2">
            {links.map(l => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full border border-borderC bg-surface1 text-bodySm text-textPrimary hover:border-forestAccent"
              >
                {l.label} <ExternalLink size={13} strokeWidth={1.75} className="text-textMuted" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-caption text-textMuted m-0">This artist hasn't added support links yet.</p>
        )}
        <p className="text-caption text-textMuted m-0 mt-2">Links go straight to the artist. YOU never takes a share.</p>
      </section>

      <section className="mt-4 pt-3 border-t border-borderC">
        {needsContribution && !saved && (
          <>
            <p className="text-bodySm text-textSecondary m-0 mb-2">
              {name} asks for a contribution{work.suggested_amount ? ` (${work.suggested_amount})` : ""} before you keep this in your collection.
            </p>
            <label className="flex items-start gap-2.5 min-h-[44px] text-bodySm text-textPrimary cursor-pointer">
              <input
                type="checkbox"
                checked={contributed}
                onChange={e => setContributed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--forest-accent,#4F6F52)]"
              />
              I've contributed to {name}
            </label>
          </>
        )}
        <Button
          variant={saved ? "secondary" : "primary"}
          size="sm"
          icon={saved ? BookmarkCheck : Bookmark}
          disabled={busy || (!saved && !gate.ok)}
          onClick={toggleSave}
          className="w-full min-h-[44px]"
        >
          {saved ? "In your collection · remove" : "Save to your collection"}
        </Button>
        <p className="text-caption text-textMuted m-0 mt-1.5">Saved pieces stay inside YOU, credited. They aren't downloads.</p>
        {error && <div role="alert" className="text-bodySm text-red-500 mt-2">{error}</div>}
      </section>

      <div className="mt-3">
        {reported ? (
          <p className="text-caption text-textMuted m-0">Thank you. Cassidy will take a look.</p>
        ) : reporting ? (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What's wrong with it? (optional)"
              aria-label="Why are you reporting this?"
              className="w-full rounded-sm border border-borderC bg-surface1 p-2 text-bodySm text-textPrimary"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={busy} onClick={sendReport}>Send report</Button>
              <Button size="sm" variant="ghost" onClick={() => setReporting(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setReporting(true)} className="inline-flex items-center gap-1.5 text-caption text-textMuted min-h-[36px]">
            <Flag size={12} strokeWidth={1.75} /> Report this piece
          </button>
        )}
      </div>
    </Modal>
  );
}
