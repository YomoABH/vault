# Phase 7 — Quality & Distribution

> Это дорожная карта. Здесь описаны направления, инструменты для изучения, вопросы для размышления и критерии готовности — но **не готовые реализации**. Код пишется самостоятельно; карта служит навигатором.

## Зачем нужна Phase 7

К этому моменту приложение полнофункциональное: заметки, папки, поиск, офлайн, P2P и серверная синхронизация. Phase 7 решает две задачи:

1. **Качество**: систематическое тестовое покрытие (unit + E2E) поверх кода, написанного в фазах 1–6.
2. **Распространение**: Docker + CI/CD, чтобы поделиться проектом одной командой — `docker compose up --build`.

> **Важно.** Тестирование — НЕ только Phase 7. Unit-тесты для `domain/` и `application/` должны появляться параллельно с каждой фазой (начиная с Phase 2.x). Phase 7 — это финальный аккорд: E2E-тесты сложных сценариев (Service Worker, WebRTC, многовкладочность) и настройка CI, которая прогоняет всё это автоматически.

---

## Зафиксированные решения

| Решение | Выбор | Почему |
|---------|-------|--------|
| Unit-тесты | Vitest | Нативная Vite-интеграция, ESM, path aliases без настройки |
| Component-тесты | @vue/test-utils + Vitest | Официальный инструмент Vue, работает вместе с Vitest |
| E2E-тесты | Playwright | Лучшая поддержка PWA, Service Worker, IndexedDB; headless Chrome/Firefox/WebKit |
| CI | GitHub Actions | Бесплатно для публичных репозиториев, большая экосистема actions |
| Контейнеризация | Docker + docker-compose | Стандарт de facto, легко объяснить другу |
| Nginx в контейнере | nginx:alpine | Минимальный образ для SPA, умеет gzip, заголовки кеширования |
| Backend образ | node:22-alpine | Минимальный, нет лишних инструментов |

---

## Разбиение на под-фазы

Критический путь: **7.1 → 7.2 → 7.3 → 7.4**.

---

## Phase 7.1 — Полное unit-покрытие domain + application

**Что нужно получить.** Все `domain/*/` модули покрыты unit-тестами. Все `application/*/` use cases покрыты unit-тестами с мок-портами. Пробелы, оставшиеся с Phase 2.x по Phase 6, закрыты.

**Инструменты для изучения.**
- **Vitest coverage**: `pnpm vitest run --coverage`. Провайдеры `v8` vs `istanbul` — чем отличаются?
- **`vi.stubGlobal()`** — замена глобальных объектов (`crypto`, `navigator`).
- **`vitest --ui`** — браузерный UI для просмотра тестов и coverage.

**Вопросы для размышления.**
- Что такое coverage и почему 100% coverage ≠ хорошие тесты? Приведи пример теста с 100% coverage, который не находит баг.
- Тесты для `application/sync/` — как замокировать `SyncTransportPort`, чтобы тестировать логику sync use case без реального WebSocket?
- Где граница между unit и интеграционным тестом? Если `application/folder/createFolder` вызывает `IFolderRepository.save()` — это unit или интеграция?
- Тесты на ошибки (unhappy path) — насколько важны? Что тестировать: только `FolderErrors.CycleDetected` или все `FolderErrorCode`?

**Подводные камни.**
- `crypto.randomUUID()` доступен только в Secure Context (HTTPS или localhost). В Node.js Vitest-окружении его нет. Нужен `vi.stubGlobal('crypto', ...)` или рефактор с инъекцией `IdGenerator` порта.
- Тест не должен зависеть от порядка других тестов. Если используешь shared state (глобальный репозиторий) — изолируй через `beforeEach`.

**Acceptance.**
- `pnpm test` прогоняет все unit-тесты без ошибок.
- `pnpm test --coverage` показывает >80% покрытия `domain/` и `application/`.
- Нет ни одного теста типа «вызвать функцию и проверить, что она не бросила».

---

## Phase 7.2 — Интеграционные тесты infrastructure

**Что нужно получить.** Тесты для `IDBNoteRepository`, `IDBFolderRepository` с реальным (или fake) IndexedDB. Тест для `WebCryptoEncryption` (encrypt → decrypt → проверить).

**Инструменты для изучения.**
- **`fake-indexeddb`**: npm-пакет, эмулирует IDB API в Node.js. Быстро, без браузера. Ограничения: не 100% спека.
- **Vitest browser mode**: запускает тесты в реальном Chrome/Firefox через Playwright. Медленнее, но тестирует настоящее IDB.
- **`idb-keyval` vs raw IDB**: почему в проекте используется raw IDB (учебная цель), и как это влияет на тестирование?

**Вопросы для размышления.**
- `fake-indexeddb` — это правильный инструмент для тестирования IDB? Что он может не воспроизвести корректно (транзакции, версионирование)?
- Когда нужен Vitest browser mode, а когда достаточно `fake-indexeddb`? Нарисуй матрицу решений.
- `WebCryptoEncryption` использует `window.crypto.subtle` — доступен ли он в Vitest browser mode? А в Node.js (v19+)?
- Как тестировать миграции IDB? Нужен тест: «база v1 мигрирует в v2 и не теряет данные».

**Подводные камни.**
- `fake-indexeddb` нужно сбрасывать между тестами — иначе состояние протекает. `beforeEach(() => { indexedDB = new IDBFactory() })`.
- Vitest browser mode требует установки Playwright (`pnpm exec playwright install`). Добавь в README.
- `SubtleCrypto` в Node.js доступен через `globalThis.crypto` начиная с Node 19. Проверь версию.

**Acceptance.**
- Тесты: `saveNote → getNote`, `createFolder → listFolders`, `deleteFolder (cascade) → getNotesInFolder`.
- Тест: `encrypt(plaintext, key) → decrypt(ciphertext, key) === plaintext`.
- Тест: `encrypt(plaintext, wrongKey)` бросает ошибку.
- Тест миграции v1→v2: старые заметки получили `folderId: null`.

---

## Phase 7.3 — E2E тесты: Playwright

**Что нужно получить.** Playwright-тесты для критических пользовательских сценариев. Тесты работают в headless Chrome. Сценарии охватывают: CRUD заметок, drag-n-drop папок, экспорт/импорт, offline-режим (Service Worker), синхронизацию между двумя вкладками.

**Инструменты для изучения.**
- **Playwright basics**: `page.goto()`, `page.click()`, `page.fill()`, `page.waitForSelector()`, `expect(page).toHaveURL()`.
- **Page Object Model (POM)**: паттерн инкапсуляции логики страницы. Когда нужен, когда избыточен?
- **Playwright + Service Worker**: `page.context().waitForEvent('serviceworker')`, как проверить офлайн-режим через `page.context().setOffline(true)`.
- **Два браузерных контекста** в одном тесте: `browser.newContext()` × 2 → тест синхронизации между устройствами.
- **IndexedDB в Playwright**: нет встроенного API. Используй `page.evaluate(() => { /* IDB запрос */ })` для проверки состояния БД.
- **Playwright trace viewer**: `--trace on` → HTML-отчёт с видео и снимками.

**Вопросы для размышления.**
- E2E тесты медленные. Какие сценарии стоит покрывать E2E, а какие достаточно unit-тестом? Правило «пирамиды тестирования».
- Как тестировать drag-n-drop в Playwright? (`page.dragAndDrop()` vs. низкоуровневые события мыши.)
- Service Worker офлайн-тест: как убедиться, что приложение работает без сети? Что проверять — просто отображение страницы или полноценный CRUD в офлайне?
- Тест синхронизации между двумя контекстами: нужен ли реальный WebSocket-сервер или можно замокировать? Что проверяем?
- Flaky tests: E2E тесты часто нестабильны. Как правильно ждать асинхронные события (не `sleep(1000)`, а `waitForSelector` / `waitForResponse`)?

**Подводные камни.**
- Service Worker в Playwright: нужен флаг `--ignore-certificate-errors` если HTTPS, или работай на `localhost` (browser exception).
- PWA `showSaveFilePicker` и `showOpenFilePicker` — недоступны в headless без дополнительных флагов. Для теста экспорта/импорта нужен другой подход (mock или `page.evaluate()`).
- IndexedDB персистится между тестами если используется один профиль. Создавай свежий `browserContext` для каждого теста.
- `page.waitForTimeout(ms)` — последнее средство. Если используешь больше одного — что-то не так в архитектуре теста.

**Acceptance.**
- Тест «создать заметку → перезагрузить → заметка сохранена».
- Тест «создать папку → перетащить заметку в папку → заметка в папке».
- Тест «offline → создать заметку → online → заметка синхронизируется».
- Тест «экспорт → очистить базу → импорт → всё восстановлено».
- Тест «два контекста (browser A + browser B) → создать заметку в A → заметка появилась в B».
- `pnpm test:e2e` проходит в headless Chrome без ошибок.

---

## Phase 7.4 — Docker + CI/CD

**Что нужно получить.** Весь проект запускается командой `docker compose up --build`. GitHub Actions прогоняет lint, typecheck, unit-тесты и E2E при каждом PR.

### Docker

**Инструменты для изучения.**
- **Multi-stage build**: зачем два `FROM` в одном Dockerfile? Как уменьшить размер итогового образа.
- **`nginx:alpine`**: конфигурация для SPA — `try_files $uri /index.html`, gzip, cache-control заголовки.
- **`docker-compose.yml`**: сервисы, сети, volumes, `depends_on`, переменные окружения.
- **`.env` и `.env.example`**: разделение секретов и конфигурации. Что попадает в Git, что нет.
- **Healthcheck**: `HEALTHCHECK CMD curl -f http://localhost/ || exit 1` — как compose ждёт готовности сервиса.

**Структура файлов.**
```
Dockerfile.frontend    # multi-stage: build (node:22-alpine) → serve (nginx:alpine)
Dockerfile.backend     # node:22-alpine + compiled backend
docker-compose.yml     # frontend + backend + shared network
.env.example           # JWT_SECRET, PORT, FRONTEND_URL — шаблон для .env
```

**Подводные камни.**
- Service Worker работает только на HTTPS или `localhost`. В Docker, если фронтенд доступен по IP или кастомному хосту — SW не активируется. Решение: nginx с self-signed cert или работать через `localhost`.
- `pnpm` в Docker: нужен `corepack enable` или установка через `npm install -g pnpm`. Или переключись на `npm` для простоты в CI.
- SQLite и volumes: если `better-sqlite3` хранит файл внутри контейнера — данные теряются при `docker compose down`. Монтируй volume: `./data:/app/data`.
- `node_modules` не копируй через COPY — исключи в `.dockerignore`.

**Вопросы для размышления.**
- Зачем multi-stage build для фронтенда? Что не так с одним `FROM node:22-alpine`?
- Почему nginx лучше `vite preview` для production? (`vite preview` — devtools, не оптимизирован.)
- Как передать `VITE_API_URL` в сборку Vite? Почему переменная должна быть `VITE_` префиксом? Что происходит с этим значением после `vite build` — оно inline-ится в JS?
- docker-compose healthcheck vs. `depends_on`: почему `depends_on` без healthcheck не гарантирует, что сервис готов принимать запросы?

### GitHub Actions CI

**Что нужно получить.**
```
.github/
└── workflows/
    ├── ci.yml      # push/PR → lint → typecheck → unit tests → build
    └── e2e.yml     # PR в main → E2E тесты (Playwright в Docker)
```

**Инструменты для изучения.**
- **Workflow syntax**: `on`, `jobs`, `steps`, `uses` (actions), `run`.
- **`actions/cache`**: кешировать `node_modules` или pnpm store между запусками. Как работает ключ кеша?
- **`matrix` strategy**: запустить один и тот же job на нескольких версиях Node.js или браузерах.
- **Playwright в CI**: `mcr.microsoft.com/playwright` Docker образ с предустановленными браузерами. Или `npx playwright install --with-deps`.
- **Artifacts**: загрузить Playwright trace и скриншоты при провале теста (`actions/upload-artifact`).

**Вопросы для размышления.**
- Как ограничить E2E тесты только для PR в `main`, а не для каждого push? (`on: pull_request: branches: [main]`)
- Зачем кешировать `node_modules`? Что происходит, если кеш протух (lock file изменился)?
- `matrix: node-version: [20, 22]` — нужно ли это для frontend проекта? В каких случаях matrix имеет смысл?
- Как вывести статус CI-бейджа в README?

**Acceptance.**
- `docker compose up --build` → фронтенд доступен на `http://localhost:80`, бэкенд на `http://localhost:3000`.
- `docker compose down -v` → следующий `up --build` начинает с чистого состояния.
- GitHub Actions: при открытии PR — CI проходит (зелёный чек). При падении теста — красный чек + артефакт с Playwright trace.
- `README.md` содержит секцию «Getting started» с двумя путями: `pnpm dev` (разработка) и `docker compose up --build` (для друга).

---

## Verification — итоговый чек-лист

- [ ] `pnpm test` — все unit + integration тесты зелёные.
- [ ] `pnpm test --coverage` — >80% coverage для `domain/` и `application/`.
- [ ] `pnpm test:e2e` — все Playwright сценарии проходят в headless Chrome.
- [ ] `docker compose up --build` — приложение работает полностью (фронт + бэк + sync).
- [ ] GitHub Actions: CI зелёный на main ветке.
- [ ] `README.md` обновлён: badge CI, инструкция для Docker, инструкция для локальной разработки.
