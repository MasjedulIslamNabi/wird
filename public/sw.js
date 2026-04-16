const CACHE_NAME = 'wird-v4';
const AUDIO_CACHE = 'wird-audio-v4';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
];

// Allowed API patterns (defense-in-depth)
const API_CACHE_PATTERN = /^https:\/\/api\.alquran\.cloud\/v1\//;
const AUDIO_CACHE_PATTERN = /^https:\/\/cdn\.islamic\.network\/quran\/audio\//;
const GEO_API_PATTERN = /^https:\/\/nominatim\.openstreetmap\.org\//;

// Maximum cache age for API data (1 hour)
const API_MAX_AGE = 3600_000;
// Maximum cache entries to prevent unbounded growth
const MAX_CACHE_ENTRIES = 500;

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

// Validate URL scheme (prevent data: and javascript: schemes)
function isSafeUrl(url: URL): boolean {
  return ['http:', 'https:'].includes(url.protocol);
}

// Fetch — network-first for API, cache-first for audio
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Block non-http(s) protocols
  if (!isSafeUrl(url)) {
    event.respondWith(new Response('', { status: 403 }));
    return;
  }

  // Audio files: cache-first (large, immutable per URL)
  if (AUDIO_CACHE_PATTERN.test(url.href)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
                // Prune cache if too large
                trimCache(AUDIO_CACHE, MAX_CACHE_ENTRIES);
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

  // Geo API: network-only (never cache location data for privacy)
  if (GEO_API_PATTERN.test(url.href)) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 503 }))
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
        if (response.ok && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icon-'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Trim cache to prevent unbounded growth
async function trimCache(cacheName: string, maxEntries: number) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      // Delete oldest entries
      const deleteCount = keys.length - maxEntries;
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch {
    // Silently fail cache trimming
  }
}
