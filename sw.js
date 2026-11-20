const CACHE = 'hesi-exit-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './data/antidotes.js', './data/bank.js', './data/cards.js', './data/compare.js',
  './data/games.js', './data/lessons.js', './data/lessons2.js', './data/lessons3.js',
  './data/lessons3b.js', './data/lessons4.js', './data/lessons5.js', './data/meds.js',
  './data/medsurg75.js', './data/qs2.js', './data/qs3.js', './data/qs4.js',
  './data/qs5.js', './data/qs6.js', './data/refs.js', './data/renal.js',
  './data/renal_qs.js', './data/sims.js', './js/core.js', './js/engine.js',
  './js/games.js', './js/medsurg75.js', './js/views.js', './js/views2.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request)));
});
