const SHELL_CACHE = 'lz-shell-v4';
const DATA_CACHE = 'lz-data-v4';
const RUNTIME_CACHE = 'lz-runtime-v4';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './styles/reset.css',
  './styles/base.css',
  './styles/layout.css',
  './styles/components.css',
  './js/app.js',
  './js/routes.js',
  './js/state.js',
  './js/config.js',
  './js/i18n/i18n.js',
  './js/i18n/translations.js',
  './js/utils/formatters.js',
  './js/utils/helpers.js',
  './js/utils/persistence.js',
  './js/utils/share.js',
  './js/data/mock-data.js',
  './js/services/weather-service.js',
  './js/services/transport-service.js',
  './js/services/bus-service.js',
  './js/services/decision-engine.js',
  './js/services/external-actions.js',
  './js/services/flight-lookup-service.js',
  './js/modules/llegada.js',
  './js/modules/radar.js',
  './js/modules/decision.js',
  './js/modules/accion.js',
  './js/modules/pro.js',
  './assets/icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => ![SHELL_CACHE, DATA_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isLiveDataRequest(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (isMapTile(url) || isLeafletAsset(url) || isFontAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.destination === 'document') {
      return caches.match('./index.html');
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || new Response('', { status: 504, statusText: 'Offline' }));

  return cached || fetchPromise;
}

function isLiveDataRequest(url) {
  return [
    'api.open-meteo.com',
    'router.project-osrm.org',
    'opensky-network.org',
    'api.aviationstack.com'
  ].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

function isLeafletAsset(url) {
  return url.hostname === 'unpkg.com' && url.pathname.includes('leaflet');
}

function isMapTile(url) {
  return url.hostname.endsWith('tile.openstreetmap.org');
}

function isFontAsset(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}
