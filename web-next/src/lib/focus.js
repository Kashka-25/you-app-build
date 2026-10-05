// Focus sessions — the "Tend" timer. A flower grows while you work; stop
// early and it becomes a resting seed, never a dead plant. Time is read
// from when the session started, so leaving the app never hurts it.

export const DURATIONS = [15, 30, 45, 60]; // plus "open" (null)

// XP: 1 for every 10 minutes, plus a bonus for staying with it in one
// sitting (30 minutes straight, and an hour straight). Everything reached
// is yours to keep, even if you rest early: encouragement, never a loss.
export const XP_PER_TEN = 1;
export const MARKERS = [
  { minutes: 30, xp: 2, line: "Half an hour, straight" },
  { minutes: 60, xp: 3, line: "A full hour, straight" }
];
// Focus XP per day stops here, so it can't turn into a grind.
export const DAILY_FOCUS_XP_CAP = 20;

export function markersReached(minutes) {
  return MARKERS.filter(m => minutes >= m.minutes);
}

export function markerXp(minutes) {
  return Math.floor(minutes / 10) * XP_PER_TEN + markersReached(minutes).reduce((s, m) => s + m.xp, 0);
}

// Growth 0..1. A timed session grows to full bloom at its planned time; an
// open one grows toward the hour, then stays in bloom.
export function growthOf(elapsedMs, plannedMinutes) {
  const target = (plannedMinutes || 60) * 60000;
  return Math.max(0, Math.min(1, elapsedMs / target));
}

export function stageLine(growth) {
  if (growth < 0.15) return "A seed, settling in";
  if (growth < 0.45) return "A sprout is reaching up";
  if (growth < 0.8) return "A bud is forming";
  if (growth < 1) return "Almost in bloom";
  return "In bloom";
}

// A rested session still blooms if it reached its time, or (open sessions)
// passed the first marker; otherwise it's a resting seed.
export function outcomeOf(minutes, plannedMinutes) {
  if (plannedMinutes) return minutes >= plannedMinutes ? "bloom" : "seed";
  return minutes >= 10 ? "bloom" : "seed";
}

export function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0"), ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function minutesLabel(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// ── The session in progress ──
// Kept on this device so it survives reloads, closing the tab, or the
// phone sleeping. Only finished sessions are saved to the account.
const KEY = "you.focus.active";

export function readActive() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeActive(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable: the session just won't survive a reload */ }
  window.dispatchEvent(new Event("you-focus-change"));
}

// ── "It bloomed" notification ──
// A local notification from this device when the time is up. Asked for only
// when the Seeker plants a timed session. It reaches them while the browser
// is still running (another tab or app, or the screen dimmed); a phone that
// fully suspends the browser shows the bloom when they come back instead.
export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function askToNotify() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function notifyBloom(label) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const title = "It bloomed";
  const options = { body: `Your time with ${label} is complete.`, icon: "/icon-192x192.png", tag: "you-focus", data: { url: "/focus" } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) return reg.showNotification(title, options);
    new Notification(title, options);
  } catch (e) {
    console.warn("[focus] notification failed:", e);
  }
}
