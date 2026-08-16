/* Return Apps hub service worker — installability + light shell cache. */
const CACHE = 'return-apps-hub-v7';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/toolbox.svg',
  './apps.json',
  './developers/',
  './developers/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  // Do not intercept deep app SPA navigations aggressively — network first, cache fallback for hub.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        if (
          response.ok &&
          (url.pathname === '/' ||
            url.pathname.endsWith('/index.html') ||
            url.pathname.endsWith('/manifest.webmanifest') ||
            url.pathname.includes('/icons/') ||
            url.pathname.includes('/developers'))
        ) {
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))),
  );
});
