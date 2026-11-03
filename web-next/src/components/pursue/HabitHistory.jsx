import { useState } from "react";
import { History } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { addDaysKey } from "../../lib/week";

const niceDate = key => new Date(key + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const daysFrom = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

// "Been doing this longer?" (Cassidy, Nov 3): a habit kept long before YOU
// can bring its history in. It lives in the habit form only, when creating
// or editing a habit (not on the card). Pick when you started; once the
// form is saved, every day up to when tracking began here is filled in (no
// XP). When editing, history already added can be taken away.
// `started` is the habit's start in YOU; `since`/`onSince` are the form's.
export default function HabitHistory({ item, started, since, onSince }) {
  const { habitLogs, clearHabitHistory } = useAppData();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const filled = item ? habitLogs.filter(l => l.item_id === item.id && l.day < started).length : 0;
  const latest = addDaysKey(started, -1);
  const count = since && since <= latest ? daysFrom(since, started) : 0;

  async function clear() {
    if (!window.confirm("Take away the history from before you started this habit in YOU?")) return;
    setBusy(true);
    try { await clearHabitHistory(item.id); setNote("History taken away."); } catch (e) {
      console.error("[HabitHistory] clear failed:", e);
      setNote("Couldn't take it away just now.");
    }
    setBusy(false);
  }

  return (
    <div className="mb-3">
      <label htmlFor="habit-since" className="flex items-center gap-1.5 text-label uppercase text-textMuted mb-1.5">
        <History size={13} strokeWidth={1.75} aria-hidden="true" />
        Been doing this longer? (optional)
      </label>
      <input
        id="habit-since"
        type="date"
        max={latest}
        value={since}
        onChange={e => onSince(e.target.value)}
        aria-describedby="habit-since-hint"
        className="w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 text-body text-textPrimary outline-none focus:border-forestAccent shadow-field"
      />
      <div id="habit-since-hint" className="text-caption text-textMuted mt-1">
        {count
          ? `Saving fills in ${count} ${count === 1 ? "day" : "days"}, from ${niceDate(since)} up to when you started it here. They count toward your days and days in a row; no XP.`
          : "The day you began, if it was before YOU. Every day since is filled in; days already logged stay as they are."}
      </div>
      {filled > 0 && (
        <button type="button" onClick={clear} disabled={busy} className="mt-1 min-h-[32px] text-caption text-textMuted underline underline-offset-2">
          Take away the history added ({filled} {filled === 1 ? "day" : "days"})
        </button>
      )}
      {note && <div role="status" className="text-caption text-textMuted mt-1">{note}</div>}
    </div>
  );
}
