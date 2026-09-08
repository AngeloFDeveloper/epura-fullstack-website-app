// Minimal service worker: a `fetch` listener is required for Chrome to
// consider the site installable at all — even an empty one — plus push
// notification handling for lesson confirmations/cancellations.
//
// `skipWaiting` + `clients.claim` matter in production: without them, a
// visitor who loaded the site before a service worker update ships keeps
// running the stale worker until every tab is closed, silently missing the
// fix that update shipped.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/app" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app";
  event.waitUntil(clients.openWindow(url));
});
