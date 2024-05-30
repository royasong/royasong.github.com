self.addEventListener("push", (event) => {
  const payload = JSON.parse(event.data.text());
  console.log("ROYA//push");
  console.log(event.data.text());
  event.waitUntil(
    registration.showNotification(payload.title, {
      body: payload.body,
      data: { link: payload.link },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  clients.openWindow(event.notification.data.link);
});

self.addEventListener("install", () => {
	console.log("ROYA//push");
  self.skipWaiting();
});
