// Service Worker for ShiftFlo Push Notifications
self.addEventListener("push", (event) => {
  console.log('[SW] Push event received', event);
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push notification data:', data);

    const { title, body, url, icon } = data;

    const options = {
      body: body || 'New notification from ShiftFlo',
      icon: icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: { url: url || '/' },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192x192.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: 'shiftflo-notification'
    };

    event.waitUntil(
      self.registration.showNotification(title || 'ShiftFlo Alert', options)
    );
  } catch (error) {
    console.error('[SW] Error processing push event:', error);
    
    // Fallback notification if data parsing fails
    event.waitUntil(
      self.registration.showNotification('ShiftFlo Alert', {
        body: 'You have a new notification',
        icon: '/icon-192x192.png',
        data: { url: '/' }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log('[SW] Notification click event:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log('[SW] Notification closed:', event);
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});