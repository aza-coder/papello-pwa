// Service Worker для Papéllo PWA
// Версия: v5

const SW_VERSION = 'v5';

// Имена кэшей с версионированием
const STATIC_CACHE = 'static-' + SW_VERSION;
const DATA_CACHE = 'data-' + SW_VERSION;
const IMG_CACHE = 'img-' + SW_VERSION;

// Критичные ресурсы для предзагрузки
const CRITICAL_RESOURCES = [
  './index.html',
  './manifest.json',
  './sw.js',
  './assets/brand/logo-512.svg',
  './assets/icons/home.svg',
  './assets/icons/heart.svg',
  './assets/icons/grid.svg',
  './assets/icons/download.svg'
];

// Максимальное количество изображений в кэше
const MAX_IMG_CACHE_ENTRIES = 50;

// Утилиты для работы с кэшем
async function openCache(cacheName) {
  return await caches.open(cacheName);
}

async function deleteCache(cacheName) {
  await caches.delete(cacheName);
}

async function getCacheKeys() {
  return await caches.keys();
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const entries = await Promise.all(
    keys.map(async (key) => {
      const response = await cache.match(key);
      const date = response?.headers.get('date') || new Date().toISOString();
      return { key, date };
    })
  );
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const toDelete = entries.slice(0, entries.length - maxEntries);
  for (const entry of toDelete) {
    await cache.delete(entry.key);
  }
}

// Стратегии кэширования
async function networkFirstWithTimeout(request, cacheName, timeout = 4000) {
  const cache = await openCache(cacheName);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
    ]);
    if (response && response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    console.log('Network failed or timeout, falling back to cache:', error);
  }
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;
  return new Response('Offline content not available', { status: 503 });
}

async function cacheFirstWithUpdate(request, cacheName) {
  const cache = await openCache(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cache, MAX_IMG_CACHE_ENTRIES);
    }
    return response;
  }).catch(() => null);
  if (cached) {
    fetchPromise.catch(() => {});
    return cached;
  }
  const response = await fetchPromise;
  return response || new Response('Resource not available', { status: 503 });
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await openCache(cacheName);
  
  // Сначала возвращаем кэшированный ответ (если есть)
  const cachedResponse = await cache.match(request);
  
  // Параллельно обновляем кэш
  fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      
      await trimCache(cache, MAX_IMG_CACHE_ENTRIES);
    }
  }).catch(error => {
    console.log('Background update failed:', error);
  });
  
  // Возвращаем кэшированный ответ или делаем fetch
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Image not available', { status: 503 });
  }
}

// Очистка старых кэшей
async function cleanupOldCaches() {
  const cacheKeys = await getCacheKeys();
  const currentCaches = [STATIC_CACHE, DATA_CACHE, IMG_CACHE];
  
  for (const cacheKey of cacheKeys) {
    if (cacheKey.startsWith('static-') || cacheKey.startsWith('data-') || cacheKey.startsWith('img-')) {
      if (!currentCaches.includes(cacheKey)) {
        console.log('Deleting old cache:', cacheKey);
        await deleteCache(cacheKey);
      }
    }
  }
}

// Уведомление клиентов об активации
async function notifyClients() {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({
      type: 'SW_ACTIVATED',
      version: SW_VERSION
    });
  }
}

// Обработчик установки
self.addEventListener('install', (event) => {
  console.log('Service Worker installing, version:', SW_VERSION);
  
  // Предзагружаем критичные ресурсы
  event.waitUntil(
    openCache(STATIC_CACHE).then(async (cache) => {
      await cache.addAll(CRITICAL_RESOURCES);
      console.log('Critical resources cached');
    }).then(() => {
      // Сразу активируем новую версию
      return self.skipWaiting();
    })
  );
});

// Обработчик активации
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, version:', SW_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Очищаем старые кэши
      cleanupOldCaches(),
      // Берем контроль над всеми клиентами
      self.clients.claim()
    ]).then(() => {
      // Уведомляем клиентов об активации
      return notifyClients();
    })
  );
});

// Обработчик fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Игнорируем запросы к внешним доменам
  if (url.origin !== location.origin) {
    return;
  }
  
  // HTML/навигация - cache-first
  if (request.mode === 'navigate' ||
      request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('/') ||
      url.pathname.endsWith('/index.html')) {

    console.log('HTML request, using cache-first:', url.pathname);
    event.respondWith(cacheFirstWithUpdate(request, STATIC_CACHE));
    return;
  }

  // JSON данные - network-first с таймаутом
  if (url.pathname.startsWith('./data/') ||
      url.pathname.includes('/data/') ||
      url.pathname.endsWith('.json')) {

    console.log('JSON request, using network-first with timeout:', url.pathname);
    event.respondWith(networkFirstWithTimeout(request, DATA_CACHE));
    return;
  }

  // Изображения
  if (request.destination === 'image' ||
      url.pathname.includes('/assets/cards/') ||
      url.pathname.includes('/assets/icons/') ||
      url.pathname.includes('/assets/brand/')) {

    const ref = request.referrer || '';
    if (ref.includes('#/home') || ref.includes('#/likes')) {
      console.log('Image request from Home/Likes, using cache-first:', url.pathname);
      event.respondWith(cacheFirstWithUpdate(request, IMG_CACHE));
    } else {
      console.log('Image request from All, using stale-while-revalidate:', url.pathname);
      event.respondWith(staleWhileRevalidate(request, IMG_CACHE));
    }
    return;
  }

  // Остальные статические ресурсы - network-first
  if (url.pathname.includes('/assets/') ||
      url.pathname.includes('/fonts/') ||
      url.pathname.includes('/css/') ||
      url.pathname.includes('/js/')) {

    console.log('Static resource, using network-first with timeout:', url.pathname);
    event.respondWith(networkFirstWithTimeout(request, STATIC_CACHE));
    return;
  }

  // Для всех остальных запросов - network-first
  console.log('Other request, using network-first with timeout:', url.pathname);
  event.respondWith(networkFirstWithTimeout(request, STATIC_CACHE));
});

// Обработчик сообщений от клиентов
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: SW_VERSION
    });
  }
});

// Обработчик ошибок
self.addEventListener('error', (error) => {
  console.error('Service Worker error:', error);
});

// Обработчик необработанных отклонений
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
