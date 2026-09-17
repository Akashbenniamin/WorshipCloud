// Worship Cloud Service Worker - Offline & Cache-First Data Engine
const CACHE_NAME = 'worship-cloud-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin or non-http requests (e.g. Supabase API calls or chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Handle data requests and static assets: Cache-First with Network Fallback & Update
  const isDataRequest = url.pathname.includes('/data/');
  const isStaticAsset = url.pathname.endsWith('.js') || 
                        url.pathname.endsWith('.css') || 
                        url.pathname.endsWith('.svg') || 
                        url.pathname.endsWith('.woff2') || 
                        url.pathname.endsWith('.ttf') || 
                        url.pathname.endsWith('.json') ||
                        url.pathname.endsWith('.mjs');

  if (isDataRequest || isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and not in cache, fallback
          return cachedResponse || new Response('Offline resource not found', { status: 503 });
        }
      })
    );
    return;
  }

  // HTML Navigation: Network-First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Fallback to index.html for SPA offline navigation
        return caches.match('./index.html') || caches.match('./');
      })
  );
});

