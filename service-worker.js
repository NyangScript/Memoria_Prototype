const CACHE_NAME = 'memoria-cache-v2'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Main JS module
  'https://cdn.tailwindcss.com',
  // Local PWA icons (ensure these paths are correct and files exist)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        // Add all specified URLs to the cache.
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('Failed to cache some resources during install:', error);
            // Even if some non-critical resources fail, the SW can still install.
          });
      })
      .catch(error => {
        console.error('Failed to open cache during install:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Exclude API calls and streams from service worker caching
  // These should always go to the network.
  if (requestUrl.hostname.includes('googleapis.com') || // For Gemini API calls
      requestUrl.pathname.endsWith('/stream')) { // For ESP32 camera stream
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigation requests (HTML pages), try network first, then cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If a valid response is received, cache it and return it.
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache.
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/index.html'); // Fallback to the main page.
            });
        })
    );
    return;
  }

  // Strategy for assets (local, esm.sh, tailwindcss)
  // Cache-first, then network, then cache the response.
  // This applies if it's a same-origin request, or from specific CDNs we want to cache.
  if (requestUrl.origin === self.location.origin ||
      requestUrl.hostname === 'esm.sh' ||
      requestUrl.hostname === 'cdn.tailwindcss.com') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse; // Serve from cache
          }
          // Not in cache, fetch from network
          return fetch(event.request).then(
            networkResponse => {
              if (networkResponse && networkResponse.ok) {
                // Cache only valid basic or cors responses from these origins
                 if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });
                 }
              }
              return networkResponse;
            }
          ).catch(error => {
            console.warn(`SW Fetch failed for ${event.request.url}:`, error);
            // Optionally, return a fallback for specific asset types
          });
        })
    );
  } else {
    // For all other requests (e.g., other third-party domains not explicitly handled),
    // just try to fetch them. The browser's HTTP cache will still apply.
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ensure new SW takes control immediately.
  );
});
