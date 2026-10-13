importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.5 — volta para a base estável.
// Remove a camada visual 15.4 que interferiu nos botões. Não altera o HTML do app.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
