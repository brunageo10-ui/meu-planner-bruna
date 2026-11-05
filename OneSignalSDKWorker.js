importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Cache offline do Meu Planner, no mesmo worker usado pelas notificações.
// Nunca armazena dados pessoais, respostas de API ou requisições externas.
const PLANNER_CACHE = 'meu-planner-offline-v1';
const PLANNER_FILES = [
  './',
  './index.html',
  './inicio.html',
  './gastos.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];
const PLANNER_PATHS = new Set(PLANNER_FILES.map(path => new URL(path, self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PLANNER_CACHE)
      .then(cache => Promise.allSettled(PLANNER_FILES.map(path => cache.add(path))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('meu-planner-offline-') && key !== PLANNER_CACHE).map(key => caches.delete(key)))),
      self.clients.claim()
    ])
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !PLANNER_PATHS.has(url.pathname)) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(PLANNER_CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request, {ignoreSearch: true});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await caches.match(new URL('./index.html', self.registration.scope));
        if (fallback) return fallback;
      }
      return Response.error();
    })
  );
});