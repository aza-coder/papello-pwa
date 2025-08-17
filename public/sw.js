/* Papello PWA service worker */
const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

/** Что положим в shell-кеш (минимум) */
const SHELL_ASSETS = [
  '/',               // для GitHub Pages может быть не нужен, см. ниже
  '/index.html',
  '/manifest.json'
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
    cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error('offline and no cache');
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || networkPromise || fetch(req);
}

/** Основной роутинг */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Навигация (HTML) — app shell из кеша с сетевым фолбэком
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) =>
        cached || fetch(request)
      )
    );
    return;
  }

  // Продукты — NetworkFirst
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Картинки товаров — StaleWhileRevalidate
  if (request.destination === 'image' && url.pathname.startsWith('/assets/cards/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Остальные статики (иконки и т.п.) — сначала кеш
  if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // По умолчанию — сеть
});
