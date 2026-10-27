// Soma AI Service Worker — Offline-first caching for Kenyan connectivity
const CACHE_NAME = 'somo-smart-v3';
const PAPERS_CACHE = 'somo-papers-cache-v1';

const STATIC_ASSETS = [
    '/',
    '/favicon.png',
    '/manifest.json',
    '/robots.txt',
    '/revision',
    '/exam-papers',
    '/learner',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    '/assets/apple-touch-icon.png',
];

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Install: Cache static assets safely
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching core learner assets');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Pre-cache partial fail (safe to ignore in dev):', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== PAPERS_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: Resilient offline caching
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Past Paper PDFs & Syllabus Documents Caching:
    // When online, cache PDFs so students can study them even when their data bundle runs out!
    const isSyllabusOrPaperDoc =
        (url.hostname.includes('supabase') && url.pathname.includes('/storage/v1/object/public/syllabus-docs')) ||
        url.pathname.endsWith('.pdf');

    if (isSyllabusOrPaperDoc) {
        event.respondWith(
            caches.open(PAPERS_CACHE).then(async (cache) => {
                const cached = await cache.match(request);
                // Stale-while-revalidate / Network fallback
                try {
                    const response = await fetch(request);
                    if (response && response.ok) {
                        cache.put(request, response.clone());
                    }
                    return response;
                } catch {
                    if (cached) {
                        console.info('[SW] Serving offline past paper from cache:', url.pathname);
                        return cached;
                    }
                    return new Response('Offline: Paper not downloaded yet.', {
                        status: 503,
                        statusText: 'Service Unavailable',
                    });
                }
            })
        );
        return;
    }

    // Skip Supabase database REST & Gemini API calls (dynamic real-time queries)
    if (
        (url.hostname.includes('supabase') && !isSyllabusOrPaperDoc) ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('generativelanguage')
    ) {
        return;
    }

    // For navigation requests: network-first with cache fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match('/');
                return (
                    cachedResponse ||
                    new Response('Offline - Connect to internet to refresh Soma AI', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' },
                    })
                );
            })
        );
        return;
    }

    // For static assets: cache-first with safe network fallback
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|ico)$/)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return empty or cached fallback if available
                        return cached || new Response('', { status: 408 });
                    });
            })
        );
        return;
    }

    // For Google Fonts: cache with long TTL
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        return response;
                    })
                    .catch(() => cached || new Response('', { status: 408 }));
            })
        );
        return;
    }
});
