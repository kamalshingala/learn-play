// Offline support. Network-first: when online you always get the newest files; offline it falls back to the saved copy.
const CACHE = 'learn-play-v4';
const ASSETS = ['./', 'index.html', 'style.css?v=4', 'manifest.json', 'icon-180.png', 'icon-512.png',
  'js/core.js?v=4', 'js/fx.js?v=4', 'js/data.js?v=4', 'js/ui.js?v=4', 'js/q.js?v=4',
  'js/gen-sounds.js?v=4', 'js/gen-math.js?v=4', 'js/gen-words.js?v=4', 'js/app.js?v=4'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin || r.headers.has('range')) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(hit => hit || caches.match('index.html')))
  );
});
