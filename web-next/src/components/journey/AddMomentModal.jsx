import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const fieldClass = "w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 mb-3 text-body outline-none focus:border-forestAccent";
const labelClass = "text-label uppercase text-textMuted";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// Handles both "add a new moment" and "edit an existing one" — same form
// either way, just prefilled and pointed at editMoment when a `moment` is
// passed in. This is what makes "type it up now, attach a photo later
// from your phone" work: the moment already exists, this just updates it.
export default function AddMomentModal({ open, onClose, moment }) {
  const { addMoment, editMoment, deleteMoment } = useAppData();
  const isEdit = Boolean(moment);

  const [title, setTitle] = useState("");
  const [momentDate, setMomentDate] = useState(todayKey());
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Re-prefill whenever a different moment is opened for editing (or the
  // modal is opened fresh to add one).
  useEffect(() => {
    if (!open) return;
    if (moment) {
      setTitle(moment.title || "");
      setMomentDate(moment.moment_date || todayKey());
      setDescription(moment.description || "");
    } else {
      setTitle("");
      setMomentDate(todayKey());
      setDescription("");
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovePhoto(false);
    setError("");
  }, [open, moment]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemovePhoto(false);
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
    try {
      if (isEdit) {
        await editMoment(moment.id, { title: title.trim(), momentDate, description: description.trim(), photoFile, removePhoto });
      } else {
        await addMoment({ title: title.trim(), momentDate, description: description.trim(), photoFile });
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

  const showingExistingPhoto = isEdit && moment.photo_url && !photoPreview && !removePhoto;

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

      <label className={labelClass}>What happened (optional)</label>
      <textarea className={fieldClass} rows={3} value={description} onChange={e => setDescription(e.target.value)} />

      <label className={labelClass}>Photo (optional)</label>

      {showingExistingPhoto && (
        <div className="relative mb-3">
          <img src={moment.photo_url} alt="" className="w-full h-36 object-cover rounded-sm" />
          <button
            type="button"
            onClick={() => setRemovePhoto(true)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-cream flex items-center justify-center"
            aria-label="Remove photo"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {!showingExistingPhoto && (
        <>
          <input type="file" accept="image/*" onChange={handleFile} className="text-bodySm text-textSecondary mb-3 block" />
          {photoPreview && <img src={photoPreview} alt="" className="w-full h-36 object-cover rounded-sm mb-3" />}
        </>
      )}

      {error && <div className="text-bodySm text-red-500 mb-3">{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={close}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={submit} disabled={saving || deleting}>
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
