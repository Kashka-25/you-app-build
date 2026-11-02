import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, MapPin } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { compressImage } from "../../lib/imageCompress";
import { photoPlace, reversePlace } from "../../lib/wandering";
import { localDateKey } from "../../lib/week";

const MAX_PHOTOS = 40;
const PHOTOS_PER_PLACE = 6;

// Fill the map from photos already taken (Cassidy, Nov 2). Pick a batch;
// YOU reads where and when each was taken (on the device), groups them by
// place and day, names each place, and offers them to keep, rename or skip.
// Each kept one becomes a saved place with its photos, like Save a place.
// Photos without a location are counted and left out.
export default function BackfillPlaces({ open, onClose }) {
  const { savePlaceMemory } = useAppData();
  const input = useRef(null);
  const [step, setStep] = useState("pick"); // pick | reading | review | saving | done
  const [groups, setGroups] = useState([]);
  const [unplaced, setUnplaced] = useState(0);
  const [progress, setProgress] = useState({ n: 0, of: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setGroups(prev => { prev.forEach(g => g.files.forEach(f => URL.revokeObjectURL(f.url))); return []; });
    setUnplaced(0);
    setError("");
  }, [open]);

  async function read(fileList) {
    const files = [...fileList].slice(0, MAX_PHOTOS);
    if (!files.length) return;
    setStep("reading");
    setProgress({ n: 0, of: files.length });
    const byKey = new Map();
    let none = 0;
    for (const [i, file] of files.entries()) {
      const where = await photoPlace(file);
      setProgress({ n: i + 1, of: files.length });
      if (!where) { none++; continue; }
      // Same day, within about a kilometre: one place.
      const key = `${where.dateKey || "?"}|${where.lat.toFixed(2)}|${where.lng.toFixed(2)}`;
      const g = byKey.get(key) || { key, lat: where.lat, lng: where.lng, dateKey: where.dateKey || localDateKey(), files: [] };
      g.files.push({ file, url: URL.createObjectURL(file) });
      byKey.set(key, g);
    }
    // Name each place, one at a time (kind to the free place service).
    const list = [];
    for (const g of [...byKey.values()].sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1))) {
      const place = await reversePlace(g.lat, g.lng);
      list.push({ ...g, place, keep: true });
    }
    setGroups(list);
    setUnplaced(none);
    setStep("review");
  }

  const set = (i, patch) => setGroups(list => list.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const kept = groups.filter(g => g.keep && g.place.name.trim());

  async function save() {
    setStep("saving");
    setError("");
    setProgress({ n: 0, of: kept.length });
    for (const [i, g] of kept.entries()) {
      try {
        const photos = [];
        for (const f of g.files.slice(0, PHOTOS_PER_PLACE)) {
          try { const c = await compressImage(f.file); photos.push({ blob: c.blob, ext: c.ext }); } catch { /* skip a photo that won't open */ }
        }
        await savePlaceMemory({ place: { ...g.place, name: g.place.name.trim() }, momentDate: g.dateKey, title: g.place.name.trim(), description: "", photos });
      } catch (e) {
        console.error("[BackfillPlaces] save failed:", e);
        setError("Some places couldn't be saved. Check your connection and try those again.");
      }
      setProgress({ n: i + 1, of: kept.length });
    }
    setStep("done");
  }

  const nice = d => new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <Modal open={open} title="Fill your map from photos" onClose={step === "saving" ? () => {} : onClose}>
      {step === "pick" && (
        <>
          <p className="text-bodySm text-textSecondary mt-0 mb-3">
            Choose photos from places you've been (up to {MAX_PHOTOS} at a time). YOU reads where and when each was taken, right here on your phone, and suggests each place for you to keep, rename or skip.
          </p>
          <Button className="w-full" icon={ImagePlus} onClick={() => input.current?.click()}>Choose photos</Button>
          <input ref={input} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={e => { const f = e.target.files; read(f); e.target.value = ""; }} />
          <p className="text-caption text-textMuted mt-2.5 mb-0">Only the places' coordinates leave your phone, to name them. Saved photos have their location removed.</p>
        </>
      )}

      {(step === "reading" || step === "saving") && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 size={20} className="animate-spin text-forestAccent flex-none" />
          <div className="text-body text-textPrimary">
            {step === "reading" ? `Reading photo ${progress.n} of ${progress.of}…` : `Saving place ${progress.n + (progress.n < progress.of ? 1 : 0)} of ${progress.of}…`}
          </div>
        </div>
      )}

      {step === "review" && (
        groups.length === 0 ? (
          <>
            <p className="text-bodySm text-textSecondary mt-0">None of those photos say where they were taken. Some apps (and screenshots) remove it; photos straight from your camera usually keep it.</p>
            <Button variant="secondary" className="w-full" onClick={() => setStep("pick")}>Choose other photos</Button>
          </>
        ) : (
          <>
            <p className="text-bodySm text-textSecondary mt-0 mb-3">
              {groups.length} {groups.length === 1 ? "place" : "places"} found{unplaced ? `. ${unplaced} ${unplaced === 1 ? "photo had" : "photos had"} no location.` : "."} Untick any to skip; tap a name to change it.
            </p>
            <div className="space-y-2.5 mb-4">
              {groups.map((g, i) => (
                <div key={g.key} className={`flex gap-2.5 rounded-card border p-2.5 ${g.keep ? "border-gold/60 bg-surface1" : "border-borderC opacity-60"}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={g.keep}
                    aria-label={`${g.keep ? "Skip" : "Keep"} ${g.place.name}`}
                    onClick={() => set(i, { keep: !g.keep })}
                    className={`w-6 h-6 mt-1 flex-none rounded-full border flex items-center justify-center ${g.keep ? "bg-gold border-gold text-[#19193D]" : "border-borderC"}`}
                  >
                    {g.keep && <Check size={13} strokeWidth={2.5} />}
                  </button>
                  <img src={g.files[0].url} alt="" className="w-16 h-16 flex-none rounded-sm object-cover bg-surface3" />
                  <div className="flex-1 min-w-0">
                    <input
                      value={g.place.name}
                      onChange={e => set(i, { place: { ...g.place, name: e.target.value } })}
                      aria-label="Name this place"
                      className="w-full bg-transparent font-serif text-body text-textPrimary outline-none border-b border-transparent focus:border-gold"
                    />
                    {g.place.detail && <div className="text-caption text-textSecondary truncate">{g.place.detail}</div>}
                    <div className="text-caption text-textMuted flex items-center gap-1">
                      <MapPin size={11} strokeWidth={1.75} /> {nice(g.dateKey)} · {g.files.length} {g.files.length === 1 ? "photo" : "photos"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={!kept.length}>Save {kept.length} {kept.length === 1 ? "place" : "places"}</Button>
            </div>
          </>
        )
      )}

      {step === "done" && (
        <>
          <p className="text-body text-textPrimary mt-0">Your map has grown. The places are on your world map and in YOUrney, under Places I've been.</p>
          {error && <p className="text-bodySm text-error" role="alert">{error}</p>}
          <Button className="w-full" onClick={onClose}>Done</Button>
        </>
      )}
    </Modal>
  );
}
