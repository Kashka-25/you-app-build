import { useState } from "react";
import { History } from "lucide-react";
import { useAppData } from "../../lib/AppDataContext";
import { addDaysKey, localDateKey } from "../../lib/week";

const niceDate = key => new Date(key + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const daysFrom = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

// "Been doing this longer?" (Cassidy, Nov 3): a habit kept long before YOU
// can bring its history in. Pick when you started; every day up to when
// you began tracking it here is filled in (no XP), and can be taken back.
export default function HabitHistory({ item }) {
  const { habitLogs, backfillHabit, clearHabitHistory } = useAppData();
  const [open, setOpen] = useState(false);
  const [since, setSince] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const started = item.createdDate || localDateKey();
  const filled = habitLogs.filter(l => l.item_id === item.id && l.day < started).length;
  const latest = addDaysKey(started, -1);
  const count = since && since <= latest ? daysFrom(since, started) : 0;

  async function fill() {
    setBusy(true);
    setNote("");
    try {
      const n = await backfillHabit(item.id, since);
      setNote(n ? `Added ${n} ${n === 1 ? "day" : "days"} of history.` : "Those days were already there.");
      setOpen(false);
      setSince("");
    } catch (e) {
      console.error("[HabitHistory] fill failed:", e);
      setNote("Couldn't add that just now. Try again in a moment.");
    }
    setBusy(false);
  }

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
    <div className="mt-2">
      {!open ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 min-h-[32px] text-[12px] text-forestAccent">
            <History size={13} strokeWidth={1.75} aria-hidden="true" />
            {filled ? "Add more history" : "Been doing this longer? Add your history"}
          </button>
          {filled > 0 && (
            <button type="button" onClick={clear} disabled={busy} className="min-h-[32px] text-[12px] text-textMuted underline underline-offset-2">
              Take away the history ({filled} {filled === 1 ? "day" : "days"})
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-sm border border-borderC bg-surface2 p-3">
          <label htmlFor={`since-${item.id}`} className="block text-caption text-textSecondary mb-1.5">I've been doing this every day since</label>
          <input
            id={`since-${item.id}`}
            type="date"
            max={latest}
            value={since}
            onChange={e => setSince(e.target.value)}
            className="w-full bg-surface1 border border-borderC rounded-sm px-3 py-2 text-body text-textPrimary outline-none focus:border-forestAccent"
          />
          <p className="text-caption text-textMuted m-0 mt-1.5">
            {count
              ? `That fills in ${count} ${count === 1 ? "day" : "days"}, from ${niceDate(since)} up to when you started it here. They count toward your days and days in a row; no XP.`
              : "Choose the day you began. Days already logged stay as they are."}
          </p>
          <div className="flex gap-2 mt-2.5">
            <button type="button" onClick={() => { setOpen(false); setSince(""); }} className="flex-1 min-h-[38px] rounded-full border border-borderC text-bodySm text-textSecondary">Cancel</button>
            <button type="button" onClick={fill} disabled={!count || busy} className="flex-1 min-h-[38px] rounded-full bg-forestAccent text-onAccent text-bodySm font-medium disabled:opacity-50">
              {busy ? "Adding…" : "Add history"}
            </button>
          </div>
        </div>
      )}
      {note && <div role="status" className="text-[11px] text-textMuted mt-1">{note}</div>}
    </div>
  );
}
