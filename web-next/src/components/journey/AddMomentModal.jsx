import { useState, useEffect, useRef } from "react";
import { X, ImagePlus, Star } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { localDateKey as todayKey } from "../../lib/week";
import { stopsCoveringDate } from "../../lib/wandering";
import PlacePicker from "../wandering/PlacePicker";
import { compressImage, formatBytes } from "../../lib/imageCompress";

const MAX_PHOTOS = 10;

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent shadow-field";
const labelClass = "text-label uppercase text-textMuted";

// Handles both "add a new moment" and "edit an existing one" — same form
// either way, just prefilled and pointed at editMoment when a `moment` is
// passed in. This is what makes "type it up now, attach a photo later
// from your phone" work: the moment already exists, this just updates it.
// `defaults` ({ momentDate, stopId }) seeds a new memory, e.g. "Add a
// memory here" on a Wandering stop.
export default function AddMomentModal({ open, onClose, moment, defaults }) {
  const { addMoment, editMoment, deleteMoment, wanderingStops } = useAppData();
  const isEdit = Boolean(moment);

  const [title, setTitle] = useState("");
  const [momentDate, setMomentDate] = useState(todayKey());
  const [description, setDescription] = useState("");
  // The carousel as it stands in the form: existing photos ({ path, url })
  // and newly chosen ones, already converted ({ blob, ext, url, bytes,
  // originalBytes }). The first is the cover.
  const [photos, setPhotos] = useState([]);
  const [photosChanged, setPhotosChanged] = useState(false);
  const [preparing, setPreparing] = useState(0);
  const fileInput = useRef(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [stopId, setStopId] = useState(null);

  // Re-prefill whenever a different moment is opened for editing (or the
  // modal is opened fresh to add one).
  useEffect(() => {
    if (!open) return;
    if (moment) {
      setTitle(moment.title || "");
      setMomentDate(moment.moment_date || todayKey());
      setDescription(moment.description || "");
      setStopId(moment.stop_id || null);
    } else {
      setTitle("");
      setMomentDate(defaults?.momentDate || todayKey());
      setDescription("");
      setStopId(defaults?.stopId || null);
    }
    setPhotos(moment ? (moment.photo_items || []).filter(p => p.url).map(p => ({ key: p.path, path: p.path, url: p.url })) : []);
    setPhotosChanged(false);
    setPreparing(0);
    setError("");
    // Keyed on the default values, not the object, so a parent re-render
    // can't reset the form mid-typing.
  }, [open, moment, defaults?.momentDate, defaults?.stopId]);

  // Each chosen photo is converted on the device before it's ever uploaded:
  // resized, re-encoded small (WebP), metadata and location stripped.
  async function handleFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { setError(`A memory holds up to ${MAX_PHOTOS} photos.`); return; }
    const chosen = files.slice(0, room);
    setError(files.length > room ? `Added ${room}: a memory holds up to ${MAX_PHOTOS} photos.` : "");
    setPreparing(n => n + chosen.length);
    for (const file of chosen) {
      try {
        const c = await compressImage(file);
        const url = URL.createObjectURL(c.blob);
        setPhotos(prev => [...prev, { key: url, url, blob: c.blob, ext: c.ext, bytes: c.blob.size, originalBytes: c.originalBytes }]);
        setPhotosChanged(true);
      } catch (err) {
        setError(err.friendly || "That photo couldn't be added.");
      }
      setPreparing(n => n - 1);
    }
  }

  function removePhotoAt(i) {
    setPhotos(prev => prev.filter((_, j) => j !== i));
    setPhotosChanged(true);
  }

  function makeCover(i) {
    setPhotos(prev => [prev[i], ...prev.filter((_, j) => j !== i)]);
    setPhotosChanged(true);
  }

  function close() {
    onClose();
  }

  async function submit() {
    if (!title.trim()) {
      setError("Give this moment a title.");
      return;
    }
    setSaving(true);
    setError("");
    // Send a place whenever one is chosen, or could be (so it can also be
    // cleared). Memories made away from any Wandering are saved as before.
    // (A chosen place may be an approximate one like "2019", which no exact
    // date "covers", so the choice itself must count.)
    const place = stopId || stopsCoveringDate(wanderingStops, momentDate).length > 0 || moment?.stop_id ? stopId : undefined;
    try {
      if (isEdit) {
        await editMoment(moment.id, {
          title: title.trim(), momentDate, description: description.trim(), stopId: place,
          photoOrder: photosChanged ? photos.map(p => (p.path ? { path: p.path } : { blob: p.blob, ext: p.ext })) : undefined
        });
      } else {
        await addMoment({ title: title.trim(), momentDate, description: description.trim(), photos, stopId: place });
      }
      close();
    } catch (e) {
      console.error("[AddMomentModal] save failed:", e);
      setError("Couldn't save that moment — check your connection and try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMoment(moment.id);
      close();
    } catch (e) {
      console.error("[AddMomentModal] delete failed:", e);
      setError("Couldn't delete that moment — try again.");
      setDeleting(false);
    }
  }

  const newPhotos = photos.filter(p => p.blob);
  const newBytes = newPhotos.reduce((n, p) => n + p.bytes, 0);
  const originalBytes = newPhotos.reduce((n, p) => n + p.originalBytes, 0);

  return (
    <Modal open={open} title={isEdit ? "Edit memory" : "Add a memory"} onClose={close}>
      <label className={labelClass}>Title</label>
      <input className={fieldClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Moved to London" />

      <label className={labelClass}>Date</label>
      <input
        type="date"
        className={fieldClass}
        value={momentDate}
        max={todayKey()}
        onChange={e => setMomentDate(e.target.value)}
      />

      <PlacePicker dateKey={momentDate} value={stopId} onChange={setStopId} autoSelect={!isEdit && !defaults?.stopId} />

      <label className={labelClass}>What happened (optional)</label>
      <textarea className={fieldClass} rows={3} value={description} onChange={e => setDescription(e.target.value)} />

      <label className={labelClass}>Photos (optional)</label>
      <div className="grid grid-cols-4 gap-2 mt-1 mb-2">
        {photos.map((p, i) => (
          <div key={p.key} className="relative aspect-square">
            <img src={p.url} alt="" className="w-full h-full object-cover rounded-sm" />
            {i === 0 && photos.length > 1 && (
              <span className="absolute bottom-1 left-1 px-1.5 rounded-full bg-black/55 text-cream text-label">Cover</span>
            )}
            {i > 0 && (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-black/50 text-cream flex items-center justify-center"
                aria-label={`Make photo ${i + 1} the cover`}
              >
                <Star size={12} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => removePhotoAt(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-cream flex items-center justify-center"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        ))}
        {Array.from({ length: preparing }).map((_, i) => (
          <div key={`prep-${i}`} className="aspect-square rounded-sm bg-surface3 flex items-center justify-center text-caption text-textMuted">…</div>
        ))}
        {photos.length + preparing < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="aspect-square rounded-sm border border-dashed border-borderC text-textSecondary flex flex-col items-center justify-center gap-1"
          >
            <ImagePlus size={18} strokeWidth={1.75} />
            <span className="text-label">{photos.length ? "Add" : "Add photos"}</span>
          </button>
        )}
      </div>
      <input ref={fileInput} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      <div className="text-caption text-textMuted mb-3">
        {preparing > 0
          ? "Preparing photos…"
          : newPhotos.length
            ? `Saved small to respect your storage: ${formatBytes(newBytes)} instead of ${formatBytes(originalBytes)}. Location data is removed.`
            : `Up to ${MAX_PHOTOS}. Photos are made smaller before saving, and location data is removed.`}
      </div>

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting || preparing > 0}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Save memory"}
        </Button>
      </div>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="w-full text-center text-bodySm text-red-500 mt-3"
        >
          {deleting ? "Deleting…" : "Delete this memory"}
        </button>
      )}
    </Modal>
  );
}
