var CACHE_NAME = "you-v5-modular";
var ASSETS = [
  "/","/index.html","/manifest.json",
  "/styles/tokens.css","/styles/auth.css","/styles/layout.css","/styles/cards.css",
  "/styles/calendar.css","/styles/values.css","/styles/modals.css",
  "/js/config.js","/js/constants/values.const.js","/js/constants/levels.const.js",
  "/js/services/auth.service.js","/js/services/db.service.js",
  "/js/utils/astrology.util.js","/js/utils/streak.util.js",
  "/js/features/state.js","/js/features/onboarding.js","/js/features/avatar.js",
  "/js/features/pursue.js","/js/features/memory.js","/js/features/tags.js",
  "/js/features/pillars.js","/js/features/values.js","/js/features/calendar.js",
  "/js/app.js"
];
self.addEventListener("install",function(e){self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(function(c){return c.addAll(ASSETS);}));});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));}));});
self.addEventListener("fetch",function(e){e.respondWith(caches.match(e.request).then(function(cached){return cached||fetch(e.request);}));});
