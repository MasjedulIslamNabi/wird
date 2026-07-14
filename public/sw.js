const CACHE_NAME = 'wird-v6';
const AUDIO_CACHE = 'wird-audio-v6';
const ADHAN_CACHE = 'wird-adhan-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/audio/adhan.mp3',
  '/audio/adhan-fajr.mp3',
  '/audio/dua-after-adhan.mp3',
];

// Local adhan audio pattern (served from same origin)
const ADHAN_CACHE_PATTERN = /\/audio\/(adhan|adhan-fajr|dua-after-adhan)\.mp3$/;

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
  // Also pre-cache adhan audio in its own cache for offline alarm use
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore individual pre-cache failures — they'll be cached on first fetch
      })
    ).then(() =>
      caches.open(ADHAN_CACHE).then((cache) =>
        Promise.all([
          '/audio/adhan.mp3',
          '/audio/adhan-fajr.mp3',
          '/audio/dua-after-adhan.mp3',
        ].map((url) => cache.add(url).catch(() => {})))
      )
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches (preserve adhan cache too)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE && key !== ADHAN_CACHE)
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

  // Local adhan files: cache-first from dedicated adhan cache (for offline alarm)
  if (ADHAN_CACHE_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.open(ADHAN_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // Remote Quran audio files: cache-first (large, immutable per URL)
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
        if (response.ok && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icon-') || url.pathname.startsWith('/audio/'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ─── Notification click handler ───────────────────────────────────────────
// When the user taps any Wird notification, focus an existing app window
// (or open a new one to '/'). Handles action buttons:
//   - 'stop'     → tells the page to stop the Adhan
//   - 'play'     → tells the page to play the Adhan (autoplay-blocked fallback)
//   - default    → focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const action = event.action || '';
  const notifData = event.notification.data || {};

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Find a client on the Wird origin to receive the action message
      let targetClient = null;
      for (const client of allClients) {
        try {
          const u = new URL(client.url);
          if (u.origin === self.location.origin) {
            targetClient = client;
            break;
          }
        } catch { /* ignore invalid URLs */ }
      }

      // If an action button was clicked, message the page
      if (action === 'stop' && targetClient && 'postMessage' in targetClient) {
        targetClient.postMessage({ type: 'wird:adhan-stop' });
        if ('focus' in targetClient) await targetClient.focus();
        return;
      }
      if (action === 'play' && targetClient && 'postMessage' in targetClient) {
        targetClient.postMessage({ type: 'wird:adhan-play', prayerName: notifData.prayerName });
        if ('focus' in targetClient) await targetClient.focus();
        return;
      }

      // Default: focus existing client or open a new window
      if (targetClient && 'focus' in targetClient) {
        await targetClient.focus();
        if (targetUrl !== '/' && 'postMessage' in targetClient) {
          targetClient.postMessage({ type: 'wird:navigate', url: targetUrl });
        }
        return;
      }

      // No existing client — open a new window
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// ─── Push event scaffold (for future server-side push) ────────────────────
// Wired now so that when VAPID keys + a push subscription are added, the SW
// is already prepared to surface notifications from background push events.
self.addEventListener('push', (event) => {
  let payload = { title: 'Wird', body: 'You have a new reminder.' };
  try {
    if (event.data) {
      const text = event.data.text();
      try { payload = JSON.parse(text); } catch { payload.body = text; }
    }
  } catch { /* ignore */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag || 'wird-push',
      requireInteraction: !!payload.requireInteraction,
      silent: false,
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
