const CACHE_NAME = "alrehla-shell-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        const requestUrl = new URL(event.request.url);
        if (requestUrl.origin !== self.location.origin) return networkResponse;

        const responseClone = networkResponse.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      });
    })
  );
});

/* ──────────────────────────────────────────────
   Web Push: Show native notification
   ────────────────────────────────────────────── */

self.addEventListener("push", (event) => {
  const defaults = {
    title: "الرحلة",
    body: "لديك تنبيه جديد من تحليل الأنماط السلوكية.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    dir: "rtl",
    lang: "ar",
    url: "/",
  };

  let payload = defaults;
  try {
    if (event.data) payload = { ...defaults, ...event.data.json() };
  } catch (_) { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      dir: "rtl",
      lang: "ar",
      tag: "alrehla-behavioral",
      renotify: true,
      data: { url: payload.url },
    })
  );
});

/* ──────────────────────────────────────────────
   Notification Click: Open / focus app
   ────────────────────────────────────────────── */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          void client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
