// DS Creative Studio: self-cleaning service worker.
// An earlier version of this site registered a caching service worker. This file
// replaces it so that returning visitors get unregistered and their old cache cleared,
// then load the plain site directly. Nothing here is registered by the new site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
