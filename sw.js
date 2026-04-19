const CACHE = 'solar-forecast-v1';
const STATIC = ['./solar-forecast.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Install: cache static files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC.filter(u => !u.endsWith('.png') || u)))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fall back to cache
// CDN resources (Chart.js) go network-only — too large to cache
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Skip non-GET and external CDN (Chart.js etc.)
  if (e.request.method !== 'GET') return;
  if (url.includes('cdnjs.cloudflare.com') ||
      url.includes('open-meteo.com') ||
      url.includes('nominatim.openstreetmap.org')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
