import { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, Check } from "lucide-react";
import { onOfflineStatus, syncQueue } from "../lib/offline";

// One quiet line under the top bar: offline, sending changes, or all sent.
// Nothing shows while everything is normal.
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const [{ pending, syncing }, setStatus] = useState({ pending: 0, syncing: false });
  const [justSynced, setJustSynced] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    const synced = () => {
      setJustSynced(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustSynced(false), 3500);
    };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    window.addEventListener("you:synced", synced);
    const stop = onOfflineStatus(setStatus);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      window.removeEventListener("you:synced", synced);
      stop();
      clearTimeout(timer.current);
    };
  }, []);

  const waiting = pending > 0 ? ` ${pending} change${pending === 1 ? "" : "s"} waiting to sync.` : "";
  let tone, Icon, text, action = null;
  if (!online) {
    tone = "bg-[color-mix(in_srgb,var(--gold)_16%,var(--surface-2))] text-textPrimary";
    Icon = CloudOff;
    text = `You're offline. What you've opened before is here, and what you write is kept on this phone.${waiting} AI and photos need a connection.`;
  } else if (pending > 0 || syncing) {
    tone = "bg-surface2 text-textSecondary";
    Icon = RefreshCw;
    text = syncing ? `Syncing${pending ? ` ${pending} change${pending === 1 ? "" : "s"}` : ""}…` : `${pending} change${pending === 1 ? "" : "s"} waiting to sync.`;
    if (!syncing) action = <button type="button" onClick={() => syncQueue()} className="underline underline-offset-2 ml-1">Sync now</button>;
  } else if (justSynced) {
    tone = "bg-surface2 text-forestAccent";
    Icon = Check;
    text = "All synced.";
  } else return null;

  return (
    <div role="status" className={`flex items-start gap-2 px-4 py-2 text-caption leading-snug border-b border-borderC ${tone}`}>
      <Icon size={14} strokeWidth={1.75} className={`flex-none mt-0.5 ${syncing ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{text}{action}</span>
    </div>
  );
}
