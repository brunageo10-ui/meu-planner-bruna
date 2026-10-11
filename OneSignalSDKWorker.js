importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.1 — base estável sem remendos de tela.
// Este service worker fica apenas para o OneSignal e não altera o HTML do aplicativo.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
