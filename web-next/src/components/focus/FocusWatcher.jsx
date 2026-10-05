import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { readActive, writeActive, clock, notifyBloom, growthOf } from "../../lib/focus";
import { FocusFlower } from "./FocusFlower";

// While a focus session is growing, anywhere else in the app: a small pill
// to come back to it, and the "It bloomed" notification when its time is
// up (sent once, only if the Seeker isn't looking at the app).
export default function FocusWatcher() {
  const location = useLocation();
  const [active, setActive] = useState(() => readActive());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const sync = () => setActive(readActive());
    window.addEventListener("you-focus-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("you-focus-change", sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  // One timer for the notification, set from the start time, so it survives
  // reloads. Browsers may delay it slightly in a background tab.
  useEffect(() => {
    if (!active?.plannedMinutes || active.notified) return;
    const due = active.startedAt + active.plannedMinutes * 60000 - Date.now();
    const t = setTimeout(() => {
      const current = readActive();
      if (!current || current.id !== active.id || current.notified) return;
      if (document.visibilityState !== "visible") notifyBloom(current.label);
      writeActive({ ...current, notified: true });
    }, Math.max(0, due));
    return () => clearTimeout(t);
  }, [active]);

  if (!active || location.pathname === "/focus") return null;
  const elapsed = now - active.startedAt;
  const done = active.plannedMinutes && elapsed >= active.plannedMinutes * 60000;

  return (
    <Link
      to="/focus"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-30 flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full shadow-cardDark text-bodySm text-[#F7F5EF]"
      style={{ background: "#0F1A14", border: "1px solid rgba(201,162,77,0.4)" }}
      aria-label={done ? `${active.label} has bloomed. Open it.` : `Focus session on ${active.label} is growing. Open it.`}
    >
      <span className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-[#1A1F1D]">
        <FocusFlower growth={growthOf(elapsed, active.plannedMinutes)} size={40} glow={false} />
      </span>
      <span className="max-w-[160px] truncate">{active.label}</span>
      <span className="text-[#C9A24D]">{done ? "bloomed" : active.hideClock ? "growing" : clock(elapsed)}</span>
    </Link>
  );
}
