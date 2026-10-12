/* Droga365 – Service Worker (PWA offline) */
const VERSION = 'v2-2026-10-12';
const SHELL_CACHE = `droga365-shell-${VERSION}`;
const ASSET_CACHE = `droga365-assets-${VERSION}`;
const RUNTIME_CACHE = `droga365-runtime-${VERSION}`;
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/img/icon-192.png',
  '/img/icon-512.png'
];

// Never cache: API, installers and large media (they are fetched on demand)
const BYPASS = /^\/(api|downloads)\/|\.(apk|aab|ipa|zip|mp4|webm|docx)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const putInCache = (cacheName, request, response) => {
  if (response && response.ok && (response.type === 'basic' || response.type === 'cors')) {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);

  if (!sameOrigin && !isFont) return;
  if (sameOrigin && BYPASS.test(url.pathname)) return;

  // 1) Navigation: network first, cached app shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(SHELL_CACHE, '/index.html', res))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2) Hashed build assets & web fonts: cache first (immutable)
  if ((sameOrigin && url.pathname.startsWith('/assets/')) || isFont) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => putInCache(ASSET_CACHE, request, res)))
    );
    return;
  }

  // 3) Everything else (data, images, PDFs): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => putInCache(RUNTIME_CACHE, request, res))
        .catch(() => cached);
      return cached || network;
    })
  );
});
