/*
 * Service worker de l'admin (portée /admin) : affiche les notifications envoyées par le site
 * (nouveau message, nouvelle inscription) et ouvre la bonne page quand on les touche.
 * Il ne met rien en cache : l'admin reste toujours à jour.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Admin Beth Habad", {
      body: data.body || "",
      icon: "/admin-icons/icon-192.png",
      badge: "/admin-icons/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/admin" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const admin = windows.find((w) => new URL(w.url).pathname.startsWith("/admin"));
      if (admin) {
        await admin.focus();
        return admin.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});
