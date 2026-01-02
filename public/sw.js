const CACHE_NAME = 'rentsafe-v2';
const OFFLINE_URL = '/offline';

// Assets to cache on install - only essential ones
const STATIC_ASSETS = [
    '/',
    '/offline',
];

// Install event - cache static assets with error handling
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Cache each asset individually to prevent one failure from breaking everything
            for (const asset of STATIC_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (error) {
                    console.warn('Failed to cache:', asset, error);
                }
            }
        }).catch((error) => {
            console.error('Cache open failed:', error);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests
    if (event.request.url.includes('/api/')) return;

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(async () => {
                // Try to get from cache
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    const offlineResponse = await caches.match(OFFLINE_URL);
                    if (offlineResponse) {
                        return offlineResponse;
                    }
                }

                // Return a basic offline response
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                });
            })
    );
});
