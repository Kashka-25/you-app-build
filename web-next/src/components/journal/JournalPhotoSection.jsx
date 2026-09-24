import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, ScanText } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Button } from "../ui/Button";

// One attached photo: thumbnail, transcription status, and (once
// transcribed) an editable text box — Claude's transcription is always a
// first draft, never treated as final until the user's happy with it.
function PhotoCard({ entryId, photo }) {
  const { transcribeJournalPhoto, editJournalPhotoTranscription, deleteJournalPhoto } = useAppData();
  const [transcribing, setTranscribing] = useState(false);
  const [text, setText] = useState(photo.transcription || "");
  const [error, setError] = useState("");

  useEffect(() => { setText(photo.transcription || ""); }, [photo.transcription]);

  async function transcribe() {
    setTranscribing(true);
    setError("");
    try {
      await transcribeJournalPhoto(entryId, photo.id);
    } catch (e) {
      console.error("[JournalPhotoSection] transcribe failed:", e);
      setError("Couldn't transcribe that page — check the Edge Function is deployed and try again.");
    }
    setTranscribing(false);
  }

  async function saveEdit() {
    if (text === photo.transcription) return;
    try {
      await editJournalPhotoTranscription(entryId, photo.id, text);
    } catch (e) {
      console.error("[JournalPhotoSection] save transcription failed:", e);
    }
  }

  return (
    <div className="rounded-sm border border-borderC bg-surface2 p-2.5 mb-2.5">
      <div className="flex gap-2.5">
        {photo.photo_url && (
          <img src={photo.photo_url} alt="Journal page" className="w-16 h-16 object-cover rounded-sm flex-none" />
        )}
        <div className="flex-1 min-w-0">
          {photo.transcription_status === "done" ? (
            <textarea
              className="w-full bg-surface1 border border-borderC rounded-sm px-2 py-1.5 text-bodySm text-textPrimary outline-none focus:border-forestAccent shadow-field"
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={saveEdit}
            />
          ) : photo.transcription_status === "failed" ? (
            <div className="text-bodySm text-red-500">Transcription failed — try again.</div>
          ) : (
            <div className="text-bodySm text-textMuted italic">Not transcribed yet.</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <button
          onClick={transcribe}
          disabled={transcribing}
          className="flex items-center gap-1 text-caption text-textSecondary hover:text-textPrimary"
        >
          <ScanText size={13} strokeWidth={1.75} />
          {transcribing ? "Transcribing…" : photo.transcription_status === "done" ? "Re-transcribe" : "Transcribe handwriting"}
        </button>
        <button
          onClick={() => deleteJournalPhoto(entryId, photo.id)}
          className="flex items-center gap-1 text-caption text-textMuted hover:text-red-500"
        >
          <Trash2 size={13} strokeWidth={1.75} />
          Remove
        </button>
      </div>
      {error && <div className="text-caption text-red-500 mt-1">{error}</div>}
    </div>
  );
}

// Photos of handwritten pages, attached to an already-saved journal entry.
// Only usable once the entry exists (photos reference entry_id) — the
// caller only renders this once isEdit is true.
export default function JournalPhotoSection({ entryId }) {
  const { journalPhotos, loadJournalPhotos, addJournalPhoto } = useAppData();
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const photos = journalPhotos[entryId] || [];

  useEffect(() => {
    if (!entryId || loaded) return;
    setLoaded(true);
    loadJournalPhotos(entryId).catch(e => console.error("[JournalPhotoSection] load failed:", e));
  }, [entryId, loaded, loadJournalPhotos]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await addJournalPhoto(entryId, file);
    } catch (err) {
      console.error("[JournalPhotoSection] upload failed:", err);
      setError("Couldn't upload that photo — try again.");
    }
    setUploading(false);
  }

  return (
    <div className="mb-3">
      <label className="block text-label uppercase text-textMuted mb-1.5">Photos of handwritten pages</label>
      {photos.map(photo => <PhotoCard key={photo.id} entryId={entryId} photo={photo} />)}

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <Button variant="secondary" size="sm" icon={Camera} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? "Uploading…" : "Add a photo"}
      </Button>
      {error && <div className="text-bodySm text-red-500 mt-1.5">{error}</div>}
    </div>
  );
}
