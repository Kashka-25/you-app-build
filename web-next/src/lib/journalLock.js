// YOUrnal's lock (Cassidy, Nov 2): an optional PIN on this device, a privacy
// curtain for when someone else picks up the phone. It isn't encryption: the
// entries are still in the account and in the device's offline copy. Only a
// salted hash of the PIN is kept, in this browser. Signing out removes it,
// which is also the way back in after a forgotten PIN.

const KEY = "you.yournal.lock";
const OPEN = "you.yournal.unlocked";
// Unlocked stays unlocked while YOU is in use; away this long, it locks again.
export const RELOCK_AFTER_MS = 2 * 60 * 1000;

const read = (store, key) => { try { return JSON.parse(store.getItem(key) || "null"); } catch { return null; } };
const write = (store, key, v) => { try { v == null ? store.removeItem(key) : store.setItem(key, JSON.stringify(v)); } catch { /* private window */ } };

async function digest(salt, pin) {
  const bytes = new TextEncoder().encode(`${salt}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function lockIsSet(userId) {
  return Boolean(userId && read(localStorage, `${KEY}.${userId}`)?.hash);
}

export async function setLock(userId, pin) {
  const salt = crypto.getRandomValues(new Uint32Array(4)).join("-");
  write(localStorage, `${KEY}.${userId}`, { salt, hash: await digest(salt, pin) });
  markOpen(userId);
}

export function removeLock(userId) {
  write(localStorage, `${KEY}.${userId}`, null);
  write(sessionStorage, `${OPEN}.${userId}`, null);
}

export async function pinMatches(userId, pin) {
  const lock = read(localStorage, `${KEY}.${userId}`);
  return Boolean(lock && (await digest(lock.salt, pin)) === lock.hash);
}

// Open for this visit, and when it was last seen so leaving for a while locks it.
export function markOpen(userId) {
  write(sessionStorage, `${OPEN}.${userId}`, { at: Date.now() });
}

export function isOpen(userId) {
  const open = read(sessionStorage, `${OPEN}.${userId}`);
  return Boolean(open && Date.now() - open.at < RELOCK_AFTER_MS);
}

export function closeNow(userId) {
  write(sessionStorage, `${OPEN}.${userId}`, null);
}

// Signing out: every lock on this device goes with the account.
export function clearAllLocks() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(KEY)) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (k.startsWith(OPEN)) sessionStorage.removeItem(k);
  } catch { /* private window */ }
}
