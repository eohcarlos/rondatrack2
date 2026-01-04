const CACHE_NAME = 'rondatrack-v2';
const STATIC_ASSETS = [
  '/lovable-uploads/b183aeaf-2480-4887-9cfa-8436f7579f9b.png',
  '/manifest.json'
];

// Install - cache only static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first for navigation, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip API calls and Supabase requests
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('/rest/') ||
      url.pathname.includes('/auth/')) {
    return;
  }

  // For navigation requests (HTML pages) - always network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Only return cached index.html as fallback when offline
          return caches.match('/').then((response) => {
            if (response) return response;
            // If no cached index, try to fetch it
            return fetch('/');
          });
        })
    );
    return;
  }

  // For static assets - cache first, then network
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset)) ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|css)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(request).then((response) => {
          // Don't cache bad responses
          if (!response || response.status !== 200) return response;
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // For everything else (JS bundles, etc.) - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
