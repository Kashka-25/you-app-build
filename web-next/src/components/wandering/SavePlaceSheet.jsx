import { useEffect, useRef, useState } from "react";
import { Crosshair, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import PlaceSearch from "./PlaceSearch";
import { compressImage } from "../../lib/imageCompress";
import { currentPosition, photoPlace, reversePlace } from "../../lib/wandering";
import { localDateKey } from "../../lib/week";

const MAX_PHOTOS = 6;
const field = "w-full bg-surface1 border border-borderC rounded-sm px-3.5 py-3 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field";
const label = "block text-label uppercase text-textMuted mb-1.5";

// Save a place and its memory (Cassidy, Nov 2: "I was in a beautiful
// location and couldn't figure out how to keep it"). One sheet: where it is
// (here and now, from a photo taken there, or searched), then the memory
// (photos, a few words, the day). It lands on the world map and in YOUrney,
// gathered under "Places I've been". `place` can arrive already chosen
// (a pin dropped on the map).
export default function SavePlaceSheet({ open, onClose, place: given = null, onSaved, layer }) {
  const { savePlaceMemory } = useAppData();
  const [place, setPlace] = useState(null);
  const [finding, setFinding] = useState(null); // "here" | "photo" | null
  const [findError, setFindError] = useState("");
  const [words, setWords] = useState("");
  const [date, setDate] = useState(localDateKey());
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const photoInput = useRef(null);
  const placePhotoInput = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPlace(given);
    setFinding(null);
    setFindError("");
    setWords("");
    setDate(localDateKey());
    setPhotos(prev => { prev.forEach(p => URL.revokeObjectURL(p.url)); return []; });
    setSaving(false);
    setError("");
  }, [open, given]);

  async function addPhotos(files) {
    const room = MAX_PHOTOS - photos.length;
    for (const file of [...files].slice(0, room)) {
      try {
        const c = await compressImage(file);
        setPhotos(prev => [...prev, { url: URL.createObjectURL(c.blob), blob: c.blob, ext: c.ext }]);
      } catch (e) {
        setError(e.friendly || "That photo couldn't be opened.");
      }
    }
  }

  async function useHere() {
    setFinding("here");
    setFindError("");
    try {
      const { lat, lng } = await currentPosition();
      setPlace(await reversePlace(lat, lng));
    } catch (e) {
      setFindError(e.message);
    }
    setFinding(null);
  }

  // A photo taken there: its location (and day) are read before it's shrunk,
  // then the photo joins the memory.
  async function useFromPhoto(file) {
    if (!file) return;
    setFinding("photo");
    setFindError("");
    const where = await photoPlace(file);
    if (where) {
      setPlace(await reversePlace(where.lat, where.lng));
      if (where.dateKey && where.dateKey <= localDateKey()) setDate(where.dateKey);
    } else {
      setFindError("That photo doesn't say where it was taken (some apps remove it). It's added to the memory; find the place another way.");
    }
    await addPhotos([file]);
    setFinding(null);
  }

  async function save() {
    if (!place?.name?.trim()) return;
    setSaving(true);
    setError("");
    try {
      const moment = await savePlaceMemory({
        place: { ...place, name: place.name.trim() },
        momentDate: date,
        title: place.name.trim(),
        description: words.trim(),
        photos: photos.map(p => ({ blob: p.blob, ext: p.ext }))
      });
      onSaved?.(moment);
      onClose();
    } catch (e) {
      console.error("[SavePlaceSheet] save failed:", e);
      setError("Couldn't save this place just now. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Save a place" onClose={onClose} layer={layer}>
      <span className={label}>Where</span>
      {place ? (
        <div className="rounded-card border border-gold/60 bg-[color-mix(in_srgb,var(--gold)_8%,var(--surface-1))] p-3 mb-4">
          <div className="flex items-start gap-2.5">
            <MapPin size={18} strokeWidth={1.75} className="text-gold flex-none mt-2.5" />
            <div className="flex-1 min-w-0">
              <input
                value={place.name}
                onChange={e => setPlace({ ...place, name: e.target.value })}
                aria-label="Name this place"
                className="w-full bg-transparent font-serif text-h3 text-textPrimary outline-none border-b border-transparent focus:border-gold py-1"
              />
              {place.detail && <div className="text-caption text-textSecondary">{place.detail}</div>}
              <div className="text-caption text-textMuted mt-0.5">Tap the name to call it what it is to you.</div>
            </div>
          </div>
          {!given && (
            <button type="button" onClick={() => setPlace(null)} className="mt-2 text-caption text-forestAccent font-medium min-h-[32px]">
              Choose a different place
            </button>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <button
              type="button"
              onClick={useHere}
              disabled={Boolean(finding)}
              className="flex flex-col items-center justify-center gap-1 min-h-[72px] rounded-card bg-forestAccent text-onAccent text-bodySm font-medium disabled:opacity-60"
            >
              {finding === "here" ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} strokeWidth={1.75} />}
              {finding === "here" ? "Finding you…" : "Where I am now"}
            </button>
            <button
              type="button"
              onClick={() => placePhotoInput.current?.click()}
              disabled={Boolean(finding)}
              className="flex flex-col items-center justify-center gap-1 min-h-[72px] rounded-card border border-borderC bg-surface1 text-textPrimary text-bodySm font-medium disabled:opacity-60"
            >
              {finding === "photo" ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} strokeWidth={1.75} />}
              {finding === "photo" ? "Reading the photo…" : "From a photo taken there"}
            </button>
          </div>
          <input
            ref={placePhotoInput}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; useFromPhoto(f); }}
          />
          <PlaceSearch placeholder="Or search for the place" onPick={p => setPlace(p)} />
          {findError && <div className="text-caption text-error mt-2" role="alert">{findError}</div>}
        </div>
      )}

      <span className={label}>The memory</span>
      <div className="flex flex-wrap gap-2 mb-2.5">
        {photos.map((p, i) => (
          <div key={p.url} className="relative w-20 h-20 rounded-sm overflow-hidden bg-surface3">
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos(prev => { URL.revokeObjectURL(p.url); return prev.filter((_, j) => j !== i); })}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => photoInput.current?.click()}
            className="w-20 h-20 rounded-sm border border-dashed border-borderC text-textMuted flex flex-col items-center justify-center gap-0.5 text-[11px]"
          >
            <ImagePlus size={18} strokeWidth={1.75} /> Photos
          </button>
        )}
      </div>
      <input
        ref={photoInput}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={e => { const f = [...(e.target.files || [])]; e.target.value = ""; addPhotos(f); }}
      />
      <textarea
        rows={3}
        value={words}
        onChange={e => setWords(e.target.value)}
        placeholder="What was it like here? (optional)"
        aria-label="What was it like here?"
        className={`${field} mb-3`}
      />
      <label className={label} htmlFor="place-date">When</label>
      <input id="place-date" type="date" value={date} max={localDateKey()} onChange={e => setDate(e.target.value)} className={`${field} mb-4`} />

      {error && <div className="text-bodySm text-error mb-3" role="alert">{error}</div>}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" icon={MapPin} onClick={save} disabled={!place?.name?.trim() || saving || Boolean(finding)}>
          {saving ? "Saving…" : "Save this place"}
        </Button>
      </div>
      <p className="text-caption text-textMuted text-center mt-2.5 mb-0">It goes on your world map and into YOUrney, under Places I've been.</p>
    </Modal>
  );
}
