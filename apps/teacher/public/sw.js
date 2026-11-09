// PadhaiPilot Web Push Service Worker
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'PadhaiPilot Notification';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {},
      actions: payload.actions || [],
      vibrate: [100, 50, 100],
      tag: payload.data?.notificationId || 'padhaipilot-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('Failed to parse push event data:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Check if an action button was clicked with actionUrl
  if (event.action && data.actionButtons) {
    const actionBtn = data.actionButtons.find((b) => b.id === event.action);
    if (actionBtn?.actionUrl) {
      targetUrl = actionBtn.actionUrl;
    }
  } else if (data.link) {
    targetUrl = data.link;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetUrl && client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});

