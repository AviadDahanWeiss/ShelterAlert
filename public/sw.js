// ShelterAlert — Service Worker
// Handles push-style desktop notifications via registration.showNotification().
// SW notifications are shown as native OS toast notifications on Windows/macOS,
// which are more reliable than new Notification() (not affected by browser
// notification UI quirks).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Bring the app window into focus when user clicks a notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/dashboard');
    })
  );
});
