/* Papello PWA service worker */
const VERSION = 'v3';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

/** Что положим в shell-кеш (минимум) */
const SHELL_ASSETS = [
  '/index.html',
  '/manifest.json',
  '/assets/brand/logo.svg',
  '/assets/icons/home.svg',
  '/assets/icons/heart.svg',
  '/assets/icons/grid.svg',
  '/assets/icons/logo-16.png',
  '/assets/icons/logo-32.png',
  '/assets/icons/logo-144.png',
  '/assets/icons/logo-152.png',
  '/assets/icons/logo-167.png',
  '/assets/icons/logo-180.png',
  '/assets/icons/logo-192.png',
  '/assets/icons/logo-512.png',
  '/assets/icons/download.svg'
];

/** Установка: кэшируем shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

/** Активация: чистим старые кеши */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k))
        .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/** Хелперы стратегий */
async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) {
      cache.put(req, res.clone());
      return res;
    }
    throw new Error('Network response not ok');
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error('Offline and no cache');
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  
  const networkPromise = fetch(req).then((res) => {
    if (res.ok) {
      cache.put(req, res.clone());
      return res;
    }
    return null;
  }).catch(() => null);
  
  return cached || networkPromise || fetch(req);
}

async function cacheFirst(req) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  
  try {
    const res = await fetch(req);
    if (res.ok) {
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/** Основной роутинг */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Shell assets — Cache First (HTML, manifest, icons, logo)
  if (request.mode === 'navigate' || 
      url.pathname === '/manifest.json' ||
      url.pathname.startsWith('/assets/brand/') ||
      url.pathname.startsWith('/assets/icons/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // JSON data — Network First with cache fallback
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Product images — Stale While Revalidate
  if (request.destination === 'image' && url.pathname.startsWith('/assets/cards/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default — Network First for other resources
  event.respondWith(networkFirst(request));
});
