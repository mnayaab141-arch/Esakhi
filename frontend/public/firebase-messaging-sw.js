importScripts('https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js');

const configValue = new URL(self.location.href).searchParams.get('config');
if (configValue) {
  firebase.initializeApp(JSON.parse(configValue));
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'eSakhi order update';
    const options = {
      body: payload.notification?.body || 'Your order has a new update.',
      data: payload.data || {},
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  if (!orderId) return;
  const url = new URL(`/orders/${encodeURIComponent(orderId)}`, self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
