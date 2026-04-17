# Phase 2 — Roadmap

> Это дорожная карта. Здесь описаны направления, API для изучения, вопросы для размышления и критерии готовности — но **не готовые реализации**. Код пишется самостоятельно; карта служит навигатором.

## Зачем нужна Phase 2

Phase 1 дал базовый CRUD-заметочник в IndexedDB. Phase 2 делает из него структурированную knowledge-base:

- Заметки больше не плоский список — появляется **иерархия папок**.
- Поиск вынесен в **Web Worker**, не блокирует UI.
- Переходы анимируются через **View Transitions API**.
- Всю базу можно **экспортировать и импортировать** потоково через Streams API.

Побочные архитектурные результаты:
- Первая реальная DI-инъекция через порт (`SearchEnginePort`) — до этого все зависимости были прямыми импортами.
- Composition root в `presentation/app/di.ts`.
- IndexedDB мигрирует с версии 1 на 2.

## Цели обучения (что прокачать)

- IndexedDB: версионная транзакция в `onupgradeneeded`, `event.oldVersion`, `createIndex`, `IDBKeyRange`, backfill через cursor.
- Dedicated Web Worker: `new Worker(new URL(...), { type: 'module' })`, протокол сообщений, correlation id, transferable objects.
- Clean Architecture на практике — момент, когда port уместен, а когда преждевременен.
- `document.startViewTransition()`, CSS `::view-transition-*`, `view-transition-name`, feature-detect + fallback.
- Streams: `ReadableStream`, `TransformStream`, `WritableStream`, `CompressionStream('gzip')`, `TextEncoderStream`, `FileSystemWritableFileStream` (File System Access API), backpressure.
- Рекурсивные Vue-компоненты и производительность реактивности на дереве.

## Зафиксированные решения

Эти пункты обсуждены и подтверждены — не пересматривать без веской причины.

| Решение | Выбор | Почему |
|---------|-------|--------|
| Удаление непустой папки | Каскадное с confirm-диалогом | Проще UX; атомарно в одной IDB-транзакции |
| Уникальность имён в пределах родителя | Не требовать | Identity — по `id`; упрощает drag-n-drop |
| Markdown-парсер | `markdown-it` | Модульный API, плагины для wikilinks позже |
| Формат экспорта | NDJSON + gzip | Честно стримится через `CompressionStream`, не требует внешней zip-либы |
| DI-порты вводим только под Search | Phase 2.3 | «Port is created when a second implementation appears» — про Note/Folder пока одна реализация |

---

## Разбиение на под-фазы

Критический путь: **2.1 → 2.2 → 2.3**. После 2.3 — 2.4 и 2.5 можно параллелить.

Почему именно такой порядок:
- Folders идут первыми, чтобы Search сразу индексировал с `folderId` и не пришлось переделывать индекс.
- Streams идут последними, чтобы формат экспорта включал уже финальную схему (folders + notes).

---

## Phase 2.1 — Folders: domain + IndexedDB migration

**Что нужно получить.** Доменная сущность `Folder`, связь `Note.folderId`, IDB на версии 2 с новым store `folders` и индексом `folderId` на `notes`, существующие заметки получили `folderId: null`.

**API и концепции для изучения.**
- `IDBOpenDBRequest.onupgradeneeded` и объект события — что такое `oldVersion`, `newVersion`, `transaction`.
- Версионная транзакция vs обычная: почему только в ней можно добавлять индексы и создавать stores.
- `IDBObjectStore.createIndex(name, keyPath, { unique })` — что попадает в индекс, когда unique имеет смысл.
- Cursor-итерация для backfill: `openCursor()`, `cursor.update()`, `cursor.continue()`.

**Вопросы для размышления.**
- Где живёт `Folder` — отдельный domain-модуль (`domain/folder/`) или расширение `domain/note/`? Что даёт разделение с точки зрения Clean Architecture?
- Как представить «корень»? Отдельная служебная запись или просто `parentId: null`? Какие плюсы/минусы у каждого варианта для рендера дерева и запросов?
- Что делает `canMoveFolder` правилом домена и почему детект цикла — бизнес-правило, а не валидация?
- Какой набор `FolderErrorCode` минимально достаточен? (См. как устроены `NoteErrorCode` в текущем коде.)
- Как расширить декларативную `StoreSchema` в [src/infrastructure/persistence/indexeddb/index.ts](src/infrastructure/persistence/indexeddb/index.ts), чтобы индексы описывались в `createDataBase(...)`, а не только императивно?

**Подводные камни.**
- Текущий `upgrade(db)` в [index.ts:66](src/infrastructure/persistence/indexeddb/index.ts#L66) получает только `db`. Для добавления индекса к существующему store нужна версионная транзакция — её надо пробросить из `request.transaction`. Заодно пробрось `event.oldVersion` — миграция v1→v2 должна быть идемпотентной.
- Backfill cursor-ом выполняется **внутри той же upgrade-транзакции**. Не пытайся сделать отдельную транзакцию после — схема будет уже обновлена, а данные ещё нет.
- Что делать, если пользователь открыл приложение в старой версии в другой вкладке? Обработка `onblocked` — уже есть, но пройтись по сценарию полезно.

**Acceptance.**
- DevTools → Application → IndexedDB: vault v2, store `folders` (пустой), индекс `folderId` на `notes`, старые заметки имеют `folderId: null`.
- `pnpm tsc --noEmit` проходит.
- Приложение продолжает работать как Phase 1 (с точки зрения пользователя — пока ничего не изменилось визуально).

---

## Phase 2.2 — Folders: application + presentation

**Что нужно получить.** Use cases для папок, дерево в sidebar, drag-n-drop заметок, контекст-меню, каскадное удаление с confirm.

**API и концепции для изучения.**
- Рекурсивные SFC в Vue — `<FolderNode>` который рендерит сам себя; как правильно передавать reactive children, чтобы не словить бесконечные ре-рендеры.
- HTML5 Drag-and-Drop (`dragstart`, `dragover`, `drop`, `dataTransfer`) или `@vueuse/core useDraggable` — выбрать, сравнить.
- `shallowRef` vs `ref` для дерева — когда важно не делать глубокую реактивность.
- IDB `IDBKeyRange.only(folderId)` для фильтрации заметок по папке.

**Вопросы для размышления.**
- Дерево строить в `application/` (возвращать уже готовую tree-структуру из use case) или в `presentation/` из flat-массива? Где граница ответственности?
- Как отобразить «корневые» заметки (с `folderId: null`) — наравне с корневыми папками или отдельной секцией? Что даёт лучше UX у аналогов (Obsidian, Bear)?
- Каскадное удаление: загружать всех потомков в use case и удалять списком, или использовать `IDBKeyRange` + cursor? Какой вариант атомарен?
- Drag-n-drop: нужна ли валидация на стороне UI (нельзя тащить папку в себя) или достаточно `canMoveFolder` в domain, и UI просто покажет ошибку через toast?
- Как composable `useNotes` должен сосуществовать с новым `useFolders` — кто источник истины для active state?

**Подводные камни.**
- Контекст-меню на правом клике в браузере — `@contextmenu.prevent`. Позиционирование во viewport (не вылезать за границы).
- Drag-n-drop с вложенными drop-targets — событие всплывает, нужен `@dragover.stop`.
- При каскадном удалении проверить, что active note (если она в удаляемой ветке) сбрасывается — иначе UI покажет stale-ссылку.

**Acceptance.**
- Пользователь создаёт вложенную структуру (например Work → Projects → Vault), добавляет заметку внутрь, перетаскивает.
- Удаление папки показывает confirm с точным счётчиком «N подпапок, M заметок».
- Переименование через контекст-меню работает, синхронизируется в IDB.
- После reload структура полностью восстанавливается из IDB.

---

## Phase 2.3 — Search Worker + первый DI-порт

**Что нужно получить.** Полнотекстовый поиск в отдельном воркере. ⌘K открывает palette. Инкрементальная переиндексация при save/delete. Первый порт `SearchEnginePort`, первая DI-инъекция через `provide/inject`.

**API и концепции для изучения.**
- Dedicated Worker в Vite: синтаксис `new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' })`, ESM-воркеры, как Vite бандлит их.
- `postMessage` + structured clone; что можно пересылать, что — нельзя.
- Correlation id и `Map<id, {resolve, reject}>` для превращения event-based протокола в промисы.
- `markdown-it`: `md.parse(src, env)` возвращает токены — их можно обойти и извлечь plain text без HTML-рендеринга.
- Vue `provide/inject` с TypeScript (InjectionKey), DI без фреймворков.

**Вопросы для размышления.**
- Почему `tokenizer` — часть `domain/`, а `InvertedIndexEngine` — `infrastructure/`? Какой критерий разделения? (Подсказка: зависимости и portability.)
- Стоит ли индексировать `title` и `content` с разным весом в инвертированном индексе? Как реализовать scoring в самом простом варианте (TF-IDF излишне для начала)?
- Инкрементальная индексация: кто и когда её триггерит — `application/note` после save (кросс-импорт), presentation composable (оркестрация), или отдельный "background indexer" service? Что лучше соответствует текущей архитектуре?
- Где живёт протокол сообщений `SearchRequest`/`SearchResponse` — он нужен и воркеру, и клиенту? Подходит ли `domain/search/` для shared-контракта, или это пахнет просачиванием infra в domain?
- При первом запуске после миграции индекс пуст — как запустить первичный `rebuild`? В App.vue при mount? В `di.ts`? Что если заметок 10 000 — нужно ли показывать progress?
- Сериализация индекса на диск — сразу в Phase 2.3 или отложить? (Подсказка: это tech-debt, отложи в `TECH_DEBT.md`.)
- Нужен ли fallback для browsers без поддержки modular workers? (На 2026 — уже нет.)

**Подводные камни.**
- Воркер импортирует только `domain/` и `infrastructure/` — если случайно потянет что-то из `presentation/`, Vite соберёт, но runtime упадёт (документ недоступен). Следи за импортами.
- `markdown-it` — cjs-модуль исторически; в ESM-воркере может потребоваться нюансы с импортом. Проверь перед реализацией.
- Correlation id должен быть уникальным в рамках сессии воркера — используй счётчик или crypto.randomUUID.
- `postMessage` делает structured clone — большой `notes[]` массив при `rebuild` копируется целиком. Для 10 000 заметок — подумать про transferable ArrayBuffer.

**Acceptance.**
- DevTools → Application → Workers показывает живой search-worker.
- Поиск на ~1000 тестовых заметок отрабатывает за <50ms (сгенерировать через консоль).
- Сохранение новой заметки → её слова сразу находятся в palette.
- Удаление заметки → её больше нет в результатах.
- ⌘K закрывается по Esc, навигация по результатам стрелками.

---

## Phase 2.4 — View Transitions

**Что нужно получить.** Плавные переходы при смене активной заметки, раскрытии папок, переходах между страницами.

**API и концепции для изучения.**
- `document.startViewTransition(updateCallback)` — как работает snapshot → DOM-мутация → cross-fade.
- CSS `::view-transition-old(*)`, `::view-transition-new(*)`, `view-transition-name` на элементе.
- Интеграция с vue-router: `router.beforeResolve` или watch(route) + startViewTransition обёрнутая вокруг navigation.
- Feature detection: `'startViewTransition' in document`.

**Вопросы для размышления.**
- Где корректнее завернуть переход — в navigation guard или в watch на уровне `App.vue`? Какие edge cases у обоих вариантов (async-компоненты, suspense)?
- `view-transition-name` должен быть **уникален в документе** одномоментно. Если заметки две на экране (например, сплит) — как генерировать?
- Что делать с длинной анимацией когда пользователь быстро кликает несколько раз? Прерывание, очередь, игнор?
- Нужно ли анимировать раскрытие папки? Это не навигация, но тоже смена DOM. Попробуй обернуть toggle в `startViewTransition` — что получится?
- Как деградировать в Firefox? (Ответ: feature-detect и просто вызвать callback синхронно.)

**Подводные камни.**
- Анимация проигрывается только если callback меняет DOM **синхронно** или возвращает промис. Async Vue-обновления — через `nextTick` после мутации.
- Конфликт с CSS transitions/animations на том же элементе — их нужно отключать, пока идёт VT.
- `view-transition-name` нельзя присваивать сразу многим элементам.

**Acceptance.**
- В Chrome: заголовок активной заметки плавно morph-ится при смене active note.
- В Chrome: раскрытие/сворачивание папки — с плавной анимацией высоты.
- В Firefox: переход мгновенный, без ошибок в консоли.

---

## Phase 2.5 — Streams export / import

**Что нужно получить.** Кнопка Export → скачивается `vault-YYYY-MM-DD.ndjson.gz`. Импорт файла восстанавливает структуру папок и заметок на чистой базе.

**API и концепции для изучения.**
- `ReadableStream` с pull-источником (`new ReadableStream({ pull(controller) { ... } })`).
- `TransformStream` — для JSON.stringify + '\n', для line-split на импорте.
- `CompressionStream('gzip')` / `DecompressionStream('gzip')`.
- `TextEncoderStream` / `TextDecoderStream`.
- `showSaveFilePicker()` (File System Access API) → `FileSystemFileHandle.createWritable()` → `FileSystemWritableFileStream`.
- `File.stream()` для импорта.
- Transferable `WritableStream` через `postMessage(stream, [stream])`.
- Backpressure: когда `controller.enqueue` возвращает промис, и как это взаимодействует с pull.

**Вопросы для размышления.**
- Формат envelope: `{ version, exportedAt, kind: 'folder' | 'note', payload }` — или сделать два раздела в файле (`folders: [...]`, а потом `notes: [...]`)? Что проще стримить и что проще импортировать?
- Порядок записи: сначала все папки, потом все заметки — или интерливинг? Что важно для идемпотентного импорта?
- Импорт: как обрабатывать конфликт с существующими `id`? Перезапись, пропуск, diff-слияние? В Phase 2 достаточно простого: требовать пустую базу или перезаписывать.
- Воркер нужен или main-thread справится? Подумай: при 10 000 заметок сериализация + gzip — это секунды CPU. UI фризить не хочется.
- Как передать `FileSystemWritableFileStream` в воркер? (Подсказка: WritableStream transferable since Chrome 94.)
- Backpressure: если пользователь экспортирует 100 000 заметок — как не съесть всю память? Pull-based source правильно работает, если IDB cursor читать по одной записи.

**Подводные камни.**
- `showSaveFilePicker` требует user-gesture (клик). Вызывать строго в обработчике клика, не в ответе на worker-сообщение.
- Safari/Firefox не имеют File System Access API — нужен fallback через Blob + `<a download>` (теряем стриминг, вся база в памяти).
- `CompressionStream` — Safari 16.4+. Feature-detect, fallback без gzip.
- NDJSON требует строгого `\n` разделения — если в payload есть непроэкранированный newline, всё сломается. JSON.stringify сам экранирует, но проверь edge cases.
- Импорт на импортах в произвольном порядке — при ref на `parentId` родитель может ещё не быть вставлен. Решение: сначала все папки, потом все заметки; или второй проход после первого с fixup.

**Acceptance.**
- Settings → Export скачивает `vault-YYYY-MM-DD.ndjson.gz`.
- Распаковка gzip → валидный NDJSON (одна строка = один envelope).
- Очистка IDB → Settings → Import → вся структура восстановлена, навигация работает.
- При импорте большого файла (сгенерировать 10 000 записей) UI не фризит.

---

## Изменения по слоям (быстрая шпаргалка)

| Слой | Что появляется в Phase 2 |
|------|--------------------------|
| `domain/` | `folder/` (entity, rules, errors), `search/` (tokenizer, types, messages, errors), `export/` (envelope types), `ports/SearchEnginePort` |
| `application/` | `folder/` (commands, queries), `search/` (commands, queries), `export/` (export & import commands) |
| `infrastructure/` | миграция IDB v1→v2 (folders store + index folderId), `search/InvertedIndexEngine`, `search/SearchWorkerClient` |
| `presentation/` | `app/di.ts` (composition root), `features/folders/`, `features/search/`, `features/settings/`, routes `/notes/:id` и `/settings`, integration View Transitions |
| `workers/` | `search.worker.ts`, `export.worker.ts` |

## Вопросы, оставленные на «после Phase 2»

- Сериализация search-индекса на диск (в Phase 2 держим в памяти; rebuild при каждом запуске). Добавь запись в `TECH_DEBT.md`.
- Wikilinks (`[[...]]`) в markdown-it — это Phase 3+ вместе с графом связей.
- Race condition в сохранении (уже в `TECH_DEBT.md`) — Phase 3 с Web Locks.
- Порты `NoteRepositoryPort` / `FolderRepositoryPort` — появятся в Phase 3 вместе с OPFS как второй реализацией.

## Документация

- [CLAUDE.md](CLAUDE.md) уже обновлён: Phase 2 в списке фаз, новые папки в directory structure, упоминание composition root.
- [README.md](README.md) — расширь при случае: описание продукта, ссылка на CLAUDE.md и этот файл, основные команды (`pnpm dev`, `pnpm build`).
- [TECH_DEBT.md](TECH_DEBT.md) — допиши запись «Search index persistence» после Phase 2.3.

## Verification — быстрый чек-лист

- [ ] IDB v2, `folders` store, индекс `folderId`, старые заметки с `folderId: null`.
- [ ] Дерево папок в sidebar, drag-n-drop, каскадное удаление с confirm.
- [ ] Search-worker живой, ⌘K, <50ms на 1000 заметок, инкрементальная переиндексация.
- [ ] View Transitions в Chrome, graceful degradation в Firefox.
- [ ] Export → NDJSON.gz, Import на чистой базе восстанавливает всё.
- [ ] `pnpm tsc --noEmit` и `pnpm build` проходят.
