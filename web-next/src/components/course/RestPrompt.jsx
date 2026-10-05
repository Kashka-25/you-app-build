import { useState } from "react";
import { Moon } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useAppData } from "../../lib/AppDataContext";
import { opensLine } from "../../lib/course";

// Rest is suggested, never enforced. Before going on early, a word on why
// the pause is there; then the choice is the Seeker's.
//   next — a "resting" course state entry ({ part, opensOn, after })
export default function RestPrompt({ open, onClose, slug, next, onContinue }) {
  const { skipCourseRest } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!next || next.status !== "resting") return null;
  const deep = (next.after?.rest || 1) >= 2;

  async function goOn() {
    setBusy(true);
    setError("");
    try {
      await skipCourseRest(slug, next.after.id);
      onContinue?.();
    } catch (e) {
      console.error("[RestPrompt] skip failed:", e);
      setError("Couldn't open it just now. Check your connection and try again.");
    }
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Rest is a suggestion">
      <div className="flex justify-center mb-4">
        <span className="w-12 h-12 rounded-full bg-surface3 text-gold flex items-center justify-center">
          <Moon size={22} strokeWidth={1.75} />
        </span>
      </div>
      <div className="space-y-3 text-body text-textPrimary">
        <p className="m-0">
          Each part ends with a pause on purpose. It gives what you've just found time to settle into your days, so it becomes something you live, not only something you read.
        </p>
        {deep && (
          <p className="m-0">
            This one suggests a little longer, because {next.after.title} asks a lot of you. Deeper work often needs more time to land.
          </p>
        )}
        <p className="m-0 text-textSecondary">
          Some things only show up after a night's sleep, or the next time someone needs you.
        </p>
        <p className="m-0 font-serif italic text-[17px]">But you know yourself best. If you feel ready, you're welcome to go on.</p>
      </div>
      {error && <div role="alert" className="text-bodySm text-red-500 mt-3">{error}</div>}
      <div className="mt-5 space-y-2.5">
        <button onClick={onClose} className="w-full min-h-[50px] rounded-sm bg-forestAccent text-onAccent font-medium text-body shadow-card hover:bg-forest">
          Rest until {opensLine(next.opensOn)}
        </button>
        <button onClick={goOn} disabled={busy} className="w-full min-h-[48px] rounded-sm border border-borderC bg-surface1 text-textPrimary text-body hover:bg-surface3 disabled:opacity-50">
          {busy ? "Opening…" : "Continue now"}
        </button>
      </div>
      <div className="text-caption text-textMuted text-center mt-3">Either way is okay. Nothing is lost.</div>
    </Modal>
  );
}
