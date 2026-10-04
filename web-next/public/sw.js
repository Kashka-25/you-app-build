// Minimal runtime-caching service worker. No fixed precache list since
// Vite's build output is content-hashed per deploy — precaching a stale
// list would itself cause the "shows old app" problem we're avoiding here.
// v2: drops v1, which had also stored cross-origin responses (Supabase
// data, and would have stored every map tile).
const CACHE_NAME = "you-app-runtime-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try the network so new deploys show up immediately;
// fall back to cache only when offline.
// Only the app's own files are cached. Cross-origin requests (Supabase
// data, map tiles, place search) go straight to the network untouched:
// personal data shouldn't sit in a device cache, and map tiles would grow it
// without limit.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
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
