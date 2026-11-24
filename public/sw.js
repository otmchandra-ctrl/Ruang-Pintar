// Ruang Pintar — Progressive Web App (PWA) Service Worker
// Version: rp-sw-v2
// Strict Invariants: Non-Negotiable CBT & Auth Network-Only Exemption

const CACHE_NAME_STATIC = "rp-static-v2";
const CACHE_NAME_PAGES = "rp-pages-v1";

const PRECACHE_ASSETS = [
  "/offline",
  "/favicon.ico",
  "/brand/ruang-pintar-mark.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/manifest.json",
  "/fonts/space-mono/space-mono-400.woff2",
  "/fonts/space-mono/space-mono-700.woff2",
];

// URLs or path patterns that must NEVER be cached (Strict Network-Only)
const NETWORK_ONLY_PATTERNS = [
  /\/cbt\//i,
  /\/cbt-ujian/i,
  /\/api\//i,
  /\/login/i,
  /\/logout/i,
  /\/ganti-password/i,
  /\/actions\//i,
];

// Helper: Check if request is strictly Network-Only
function isNetworkOnly(request) {
  // Only GET requests can be cached
  if (request.method !== "GET") {
    return true;
  }

  const url = new URL(request.url);

  // Local development host bypass (localhost, 127.0.0.1, 0.0.0.0)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") {
    return true;
  }

  // Check URL pathname against network-only rules
  for (const pattern of NETWORK_ONLY_PATTERNS) {
    if (pattern.test(url.pathname)) {
      return true;
    }
  }

  // Next.js Server Action headers
  if (request.headers.get("Next-Action") || request.headers.get("x-action-redirect")) {
    return true;
  }

  return false;
}

// 1. INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME_STATIC)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE (Purge old cache versions)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME_STATIC && cacheName !== CACHE_NAME_PAGES) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. FETCH STRATEGY
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore cross-origin non-GET schemes (e.g. chrome-extension://)
  if (!request.url.startsWith("http")) {
    return;
  }

  // A. Strict Network-Only for CBT, Auth, API, & Server Action mutations
  if (isNetworkOnly(request)) {
    return; // Let browser handle natively via standard network stack
  }

  // B. Navigation Requests (HTML Pages) -> Network-First with Offline Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, clone into pages cache for resilient reload
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME_PAGES).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: try cache first, then fallback to /offline
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback = await caches.match("/offline");
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response("Anda sedang offline. Silakan periksa koneksi internet Anda.", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }

  // C. Static Next.js Bundles & Assets (_next/static, fonts, icons) -> Stale-While-Revalidate
  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/brand/") ||
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com";

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME_STATIC).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Silently handle offline fetch errors for static assets
              return cachedResponse;
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // D. Default fallback for other requests: Network-First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
