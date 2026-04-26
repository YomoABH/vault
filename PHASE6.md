# Phase 6 — Server Sync

> Это дорожная карта. Здесь описаны направления, API для изучения, вопросы для размышления и критерии готовности — но **не готовые реализации**. Код пишется самостоятельно; карта служит навигатором.

## Зачем нужна Phase 6

Phase 5 реализовал P2P-синхронизацию через WebRTC: устройства общаются напрямую, без сервера. Это отлично для сценария «два устройства в одной сети», но ломается когда:
- Оба устройства не онлайн одновременно (async sync невозможен).
- Нужно добавить третье устройство — нет «точки встречи».
- Пользователь хочет поделиться заметками с другом через ссылку.

Phase 6 добавляет **серверную синхронизацию** как альтернативный транспорт. Ключевое: это **вторая реализация `SyncTransportPort`** — того самого порта, который появился в Phase 5. Клиентский код (`application/sync/`) не меняется.

Параллельно: мини-бэкенд — отличный полигон для изучения Node.js HTTP-серверов, WebSocket, JWT, SQL.

## Зафиксированные решения

| Решение | Выбор | Почему |
|---------|-------|--------|
| Шифрование vs. аутентификация | Разделены | JWT идентифицирует пользователя на сервере; мастер-пароль шифрует данные клиентски. Сервер хранит зашифрованные blobs |
| Хранилище на сервере | SQLite | Zero-config, файловая БД, легко переносить. Достаточно для учебного проекта |
| Транспорт | WebSocket | Двунаправленный, realtime push без polling. Нативный в Node.js |
| Conflict resolution | Server-wins (last-write-wins) | Простейшая стратегия для старта; понять ограничения и когда нужен CRDT |
| Backend framework | Hono | Tiny, TypeScript-first, работает на Node.js и в Edge Runtime |

---

## Архитектурный контекст

### Почему нет конфликта с Phase 5

`SyncTransportPort` (появился в Phase 5) определён в `domain/ports/`. `WebRTCSyncTransport` — первая реализация. `WsSyncTransport` — вторая. Клиентский `application/sync/` использует только порт — ничего менять не нужно.

```
domain/ports/SyncTransportPort  ←  interface
    ↑                               ↑
WebRTCSyncTransport          WsSyncTransport
(Phase 5, P2P)               (Phase 6, Server)
```

### Аутентификация vs. шифрование

Это разные концепции — не смешивай:
- **JWT**: доказывает серверу, что запрос от конкретного пользователя. Путешествует в `Authorization: Bearer` заголовке.
- **Мастер-пароль + AES-GCM**: шифрует содержимое заметок на клиенте. Сервер никогда не видит мастер-пароль.

Сервер хранит `{ userId, noteId, encryptedPayload, updatedAt }`. Он не может прочитать `encryptedPayload` — это намеренно.

---

## Разбиение на под-фазы

Критический путь: **6.1 → 6.2 → 6.3**.

---

## Phase 6.1 — Мини-бэкенд: HTTP + JWT

**Что нужно получить.** Node.js сервер с REST endpoints для регистрации/логина. JWT выдаётся при логине, проверяется middleware на защищённых роутах. SQLite хранит пользователей (email + hashed password).

**Инструменты и концепции для изучения.**
- **Hono** (или Express): `app.get()`, `app.post()`, middleware (`app.use()`), JSON body parsing.
- **JWT**: структура (header.payload.signature), `jsonwebtoken` — `sign()`, `verify()`. Access token + refresh token pattern — зачем два?
- **bcrypt**: почему plain password нельзя хранить в БД. `bcrypt.hash()`, `bcrypt.compare()`, cost factor.
- **better-sqlite3**: синхронный API (в отличие от `sqlite3` с callbacks). `db.prepare()`, `stmt.run()`, `stmt.get()`, `stmt.all()`. WAL mode.
- **CORS**: почему браузер блокирует запросы с `localhost:8848` к `localhost:3000`. Preflight request, `Access-Control-Allow-Origin`.

**Вопросы для размышления.**
- Как хранить JWT на клиенте — `localStorage` или `httpOnly cookie`? В чём уязвимость каждого? (XSS vs CSRF.)
- Refresh token: почему access token делают короткоживущим (15мин)? Где хранить refresh token?
- Что проверять в JWT middleware: только подпись или ещё и expiration, issuer?
- Почему SQLite на сервере, а не IndexedDB? Каким будет схема: одна таблица `sync_blobs` или несколько?
- Как структурировать бэкенд: один файл vs. MVC-папки? Когда разделение имеет смысл?

**Подводные камни.**
- `better-sqlite3` — нативный модуль Node.js, нужна компиляция. На разных ОС поведение отличается. Проверь в Docker сразу.
- JWT `secret` нельзя хардкодить в код. Переменная окружения `JWT_SECRET`, `.env` файл, `.gitignore`.
- CORS preflight — браузер посылает `OPTIONS` перед `POST`. Hono и Express оба имеют CORS middleware — изучи, что он делает под капотом.

**Acceptance.**
- `POST /auth/register` — создаёт пользователя, возвращает `{ accessToken, refreshToken }`.
- `POST /auth/login` — то же самое для существующего пользователя.
- `GET /api/me` (protected) — возвращает данные пользователя, отклоняет запрос без валидного JWT.
- `curl` тесты для всех трёх endpoints проходят.

---

## Phase 6.2 — WebSocket sync transport

**Что нужно получить.** WebSocket-сервер на бэкенде принимает подключения авторизованных пользователей. `WsSyncTransport` на клиенте реализует `SyncTransportPort`. Push-синхронизация: изменение на вкладке 1 → бэкенд → вкладка 2 (другой браузер/устройство).

**Инструменты и концепции для изучения.**
- **`ws` пакет**: `WebSocketServer`, события `connection`, `message`, `close`. Broadcast всем клиентам кроме отправителя.
- **WebSocket upgrade**: как HTTP-соединение переключается в WebSocket (`101 Switching Protocols`), заголовки `Upgrade` и `Connection`.
- **Аутентификация WebSocket**: нельзя послать `Authorization` заголовок из браузера при `new WebSocket()`. Решения: токен в query string (`?token=...`) или первый message после connect.
- **Heartbeat**: `ping/pong` чтобы обнаруживать разорванные соединения (TCP не всегда уведомляет о дисконнекте).
- **`WsSyncTransport`** на клиенте: реализует `SyncTransportPort`, живёт в `infrastructure/sync/`. Пересоединение при обрыве (exponential backoff).

**Вопросы для размышления.**
- Что хранить в SQLite при получении changeSet: весь зашифрованный blob заметки или только diff? Что проще для начала?
- Как разрулить гонку: два устройства одновременно отправили изменение одной заметки? Server-wins означает: кто пришёл последним, тот и прав. Что теряется и когда это неприемлемо?
- `WsSyncTransport` vs `WebRTCSyncTransport` — как `SyncTransportPort` должен быть спроектирован, чтобы оба транспорта реализовывали его без натяжек? Что входит в интерфейс: `send(changeset)`, `onReceive(callback)`, `connect()`, `disconnect()`?
- Нужен ли reconnect в `WsSyncTransport`? Что происходит с сообщениями во время разрыва — теряются или буферизуются?
- Где в DI-графе выбирается транспорт — P2P или серверный? Можно ли переключать их в runtime?

**Подводные камни.**
- `ws` на сервере и нативный `WebSocket` в браузере — разные API. Не путай.
- Токен в query string попадает в логи сервера. Для production — первый message после handshake безопаснее. Для учёбы — query string допустим.
- Клиентский WebSocket в Vue: создавать его в `infrastructure/`, не в composable и не в компоненте. Composable только подписывается на события через реактивный `ref`.
- `ws` не поддерживает `ping/pong` из коробки автоматически — нужно поднять интервал вручную на сервере.

**Acceptance.**
- Открыть два браузера (или два профиля), залогиниться одним аккаунтом.
- Создать заметку в браузере 1 → через ≤1 секунду она появляется в браузере 2.
- Отключить браузер 2, создать заметку в браузере 1, восстановить соединение в браузере 2 → заметка синхронизируется.
- DevTools → Network → WS-фрейм показывает зашифрованный payload (не plaintext).

---

## Phase 6.3 — Клиентская интеграция + UI

**Что нужно получить.** UI для логина/регистрации. Отображение статуса синхронизации (online / syncing / offline). Выбор транспорта (P2P или Server) в Settings.

**Концепции для изучения.**
- Composable `useSync`: реактивный `syncStatus: Ref<'idle' | 'syncing' | 'error' | 'offline'>`.
- Отображение `ConnectionStatus` в sidebar — использовать `useOnline` из VueUse (уже есть в `presentation/shared/`).
- `di.ts` — как переключать транспорт: через `provide` разных реализаций в зависимости от пользовательских настроек.

**Вопросы для размышления.**
- Аккаунт Vault vs. мастер-пароль шифрования: нужно ли их объяснять пользователю отдельно в UI? Как Obsidian Sync решает это?
- Что делать при ошибке синхронизации — тихо ретраить или показывать пользователю?
- Если P2P (Phase 5) и Server (Phase 6) оба реализуют `SyncTransportPort` — можно ли запустить оба одновременно? Что сломается?

**Acceptance.**
- Settings → Sync → выбор «Server» vs «P2P».
- Server mode: форма логина, после логина — статус «Connected».
- Sidebar показывает иконку синхронизации, меняет состояние при обрыве соединения.

---

## Изменения по слоям

| Слой | Что появляется в Phase 6 |
|------|--------------------------|
| `domain/sync/` | `ChangeSet`, `SyncStatus` типы (если не появились в Phase 5) |
| `infrastructure/sync/` | `WsSyncTransport` (реализует `SyncTransportPort`) |
| `presentation/features/sync/` | `useSync` composable, `SyncSettings`, `ConnectionStatus` |
| `backend/` *(новая папка в корне)* | Hono-сервер: `src/routes/auth.ts`, `src/routes/sync.ts`, `src/db/schema.ts`, `src/ws/handler.ts` |

**Почему `backend/` в корне репозитория, а не в `src/`:** фронтенд и бэкенд — разные deployment units. В `src/` живёт только клиентский код, который собирается Vite.

---

## Вопросы, оставленные на «после Phase 6»

- CRDT-слияние вместо server-wins — Phase N+1 или отдельная тема. Изучи `automerge` или `yjs`.
- Шифрование ключей для мульти-устройств: как безопасно передать мастер-пароль на второе устройство? (Key agreement через WebRTC?)
- Rate limiting и защита API-endpoints.
- Полноценный refresh token rotation.
