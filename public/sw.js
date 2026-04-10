// Service Worker — Phase 4 stub
// Сейчас только регистрируется и перехватывает fetch, чтобы браузер
// считал приложение installable. Кэширование добавим в Phase 4.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Минимальный fetch-обработчик: просто пропускаем всё в сеть.
// Без него Chrome не покажет кнопку "Установить".
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
