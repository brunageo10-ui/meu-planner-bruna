importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Versão 15.9 — base estável restaurada.
// Service worker apenas para OneSignal. Não altera HTML, CSS, botões, microfone, organização, tarefas, pastas ou notificações.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
