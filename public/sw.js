/**
 * WASSCEPrep Service Worker
 *
 * Strategy:
 *   - App shell (HTML/JS/CSS): cache-first, update in background
 *   - Supabase question API calls: network-first, fall back to cache
 *   - Netlify functions (AI, payment): network-only (no offline use)
 *   - All other fetches: network-first with cache fallback
 *
 * Questions are also stored in IndexedDB by src/lib/offlineCache.js so
 * the quiz engine can load them even without any network at all.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE   = `wassce-shell-${CACHE_VERSION}`
const DATA_CACHE    = `wassce-data-${CACHE_VERSION}`

// App shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// ── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate: remove old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: routing logic ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept Netlify functions (AI, payment) — network only
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return
  }

  // Never intercept non-GET requests
  if (request.method !== 'GET') return

  // Supabase API calls — network first, cache fallback
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirstWithCache(request, DATA_CACHE))
    return
  }

  // Navigation requests (HTML pages) — cache first with network update
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          const networkFetch = fetch(request).then(response => {
            if (response.ok) {
              caches.open(SHELL_CACHE).then(c => c.put(request, response.clone()))
            }
            return response
          })
          return cached || networkFetch
        })
        .catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Static assets (JS, CSS, images) — cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(cacheFirstWithUpdate(request, SHELL_CACHE))
    return
  }

  // Default: network first
  event.respondWith(networkFirstWithCache(request, DATA_CACHE))
})

// ── Helper: cache-first, update in background ────────────────────────────────
async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkFetch = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || networkFetch || caches.match('/offline.html')
}

// ── Helper: network first, fall back to cache ────────────────────────────────
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    return cached || new Response(
      JSON.stringify({ error: 'You are offline and this data is not cached.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ── Background sync: queue quiz results while offline ───────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncPendingResults())
  }
})

async function syncPendingResults() {
  // IndexedDB pending results are flushed by offlineCache.js when online
  // This sync event is triggered when connectivity is restored
  const clients = await self.clients.matchAll()
  clients.forEach(client => client.postMessage({ type: 'SYNC_READY' }))
}
