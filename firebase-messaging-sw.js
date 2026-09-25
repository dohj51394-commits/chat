// Firebase Cloud Messaging Service Worker
// Gives background notifications when the app is in the background or killed
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
self.addEventListener('push', function(event) {
  if (event.data) {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Incoming Chat';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have a new update',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || 'chat-notification',
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});
