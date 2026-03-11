// Minimal service worker for PWA installability (pass-through, no cache)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
  // Pass through - no caching
});
