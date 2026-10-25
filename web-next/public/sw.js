// YOU's service worker: keeps the app itself on the phone so it opens with
// no signal (Oct 25). Your data is kept separately, by the app, in
// IndexedDB (src/lib/offline.js); nothing from Supabase is cached here.
//
// · The build writes precache.json (vite.config.js). When the page asks,
//   every file on it is kept, and files from older builds are let go.
// · Pages: network first, so a new deploy shows straight away; with no
//   signal, the kept app opens on any address.
// · /assets/ files never change once built, so they come from the cache.
// · Google Fonts are kept too, so the type looks right offline.
// · Everything else from elsewhere (Supabase, map tiles, place search)
//   goes straight to the network, untouched.
const CACHE_NAME = "you-app-v3";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

async function precache() {
  const res = await fetch("/precache.json", { cache: "no-store" });
  if (!res.ok) return;
  const files = await res.json();
  const cache = await caches.open(CACHE_NAME);
  const have = new Set((await cache.keys()).map(r => new URL(r.url).pathname));
  // One at a time-ish, and a failure only skips that file.
  for (let i = 0; i < files.length; i += 6) {
    await Promise.allSettled(
      files.slice(i, i + 6)
        .filter(f => f === "/" || !have.has(f))
        .map(f => fetch(f, { cache: "no-cache" }).then(r => (r.ok ? cache.put(f, r) : null)))
    );
  }
  // Old builds' files.
  const keep = new Set(files);
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/assets/") && !keep.has(path)) await cache.delete(req);
  }
}

self.addEventListener("message", event => {
  if (event.data === "precache") event.waitUntil(precache().catch(() => {}));
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/precache.json") return;

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
        return res;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          // Every address is the same app page, kept once under "/".
          caches.open(CACHE_NAME).then(c => c.put(req.mode === "navigate" ? "/" : req, copy));
        }
        return res;
      })
      .catch(async () => (await caches.match(req)) || (req.mode === "navigate" ? caches.match("/") : undefined))
  );
});

// "It bloomed" (a finished focus session): tapping it brings the app
// forward on the Focus screen, reusing an open window when there is one.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const open = list.find(c => new URL(c.url).origin === self.location.origin);
      if (open) return open.focus().then(c => c.navigate(url));
      return self.clients.openWindow(url);
    })
  );
});
