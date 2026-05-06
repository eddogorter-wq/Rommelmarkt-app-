importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "lelu-1nwjh0",
  appId: "1:684679734174:web:8c1a283479b13b0fa5ac8f",
  apiKey: "AIzaSyArzVYVNimOclXAs16471kRyi0QyRpXUf4",
  authDomain: "lelu-1nwjh0.firebaseapp.com",
  messagingSenderId: "684679734174",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Nieuwe melding';
  const notificationOptions = {
    body: payload.notification?.body || 'Je hebt een nieuw bericht!',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
