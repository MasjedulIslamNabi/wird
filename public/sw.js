const CACHE_NAME = 'noor-v2';
const AUDIO_CACHE = 'noor-audio-v2';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
];

// API patterns to cache
const API_CACHE_PATTERN = /^https:\/\/api\.alquran\.cloud\/v1\//;
const AUDIO_CACHE_PATTERN = /^https:\/\/cdn\.islamic\.network\/quran\/audio\//;

// Install — pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore individual failures
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for audio
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Audio files: cache-first (these are large, immutable per URL)
  if (AUDIO_CACHE_PATTERN.test(url.href)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Quran API: stale-while-revalidate (show cached, update in background)
  if (API_CACHE_PATTERN.test(url.href)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached || new Response(JSON.stringify({ code: 503, status: 'Offline', data: null }), {
              headers: { 'Content-Type': 'application/json' }
            }));

          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Navigation & static assets: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Other static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
