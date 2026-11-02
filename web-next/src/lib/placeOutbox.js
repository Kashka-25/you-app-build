// Places saved with no signal (Cassidy, Nov 2: the most beautiful places
// are often where phones have none). The place and its memory are saved
// straight away through the offline queue (lib/offline.js); what needs the
// internet waits here, on this device, per account: the photos to upload,
// and the spot's real name when it could only be saved as coordinates.
// Finished by AppDataContext once the signal is back and the queue is sent.

const DB_NAME = "you-places";
const STORE = "pending";

let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "momentId" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
  });
}

// { momentId, userId, stopId, photos: [{ blob, ext }], unnamed: { lat, lng, name } | null }
export const holdPlace = rec => run("readwrite", s => s.put(rec));
export const releasePlace = momentId => run("readwrite", s => s.delete(momentId));
export async function heldPlaces(userId) {
  const all = (await run("readonly", s => s.getAll())) || [];
  return all.filter(r => r.userId === userId);
}

// No signal right now (or the browser can't tell).
export const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;
