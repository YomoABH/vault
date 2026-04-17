# CLAUDE.md — Project Context

## What is Vault

Vault is a personal knowledge base (similar to Obsidian) that runs entirely in the browser. It is a PWA with full offline support, client-side encryption, peer-to-peer sync between devices (no server stores user data), and a native-app feel.

This is a learning-focused pet project. The primary goal is not the product itself, but deep hands-on experience with advanced web platform APIs and architectural patterns that are rare in typical frontend work.

## Goal

Build a local-first, offline-capable, encrypted note-taking app that exercises the following browser APIs and concepts:

- **IndexedDB** — primary structured storage (notes metadata, link graph, search index cache)
- **OPFS (Origin Private File System)** — file-based storage for note content and attachments
- **Web Workers** — offload search indexing, markdown parsing, graph layout calculations
- **SharedWorker / BroadcastChannel** — cross-tab state synchronization and coordination
- **Web Locks API** — exclusive/shared locks for safe concurrent writes across tabs
- **WebRTC DataChannel** — peer-to-peer sync between devices without a central server
- **Streams API** — streaming export/import of large note collections
- **Service Worker + Cache API** — full offline support, app shell caching, background sync
- **Web Crypto API** — client-side encryption (PBKDF2 key derivation, AES-GCM)
- **View Transitions API** — native-feeling animated navigation between views
- **Navigation API** — modern SPA routing (experimental, Chromium only)

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict mode)
- **Vite** (bundler, dev server, worker support)
- **Tailwind CSS** + **shadcn-vue** (UI components)
- **Vue Router**
- No backend for core functionality. Minimal signaling server only for WebRTC peer discovery.

## Architecture: Clean Architecture (frontend-adapted)

The codebase follows Clean Architecture with four layers. The dependency rule is strict: arrows point inward only.

```
presentation/ → application/ → domain/ ← infrastructure/
```

### Layer responsibilities

**`src/domain/`** — Entities, value objects, domain rules, port interfaces. Pure TypeScript. Zero imports from any other layer. Zero framework imports. This code must be usable in main thread, workers, and service worker alike.

**`src/application/`** — Use cases (commands and queries). Each use case is a single function or class that orchestrates domain logic and calls ports. Examples: `SaveNote`, `SearchNotes`, `PairDevice`. Does not import from infrastructure directly (will use injected ports once DI is introduced).

**`src/infrastructure/`** — Concrete implementations of domain ports: `IDBNoteRepository`, `OPFSFileStorage`, `WebCryptoEncryption`, `WebRTCSyncTransport`, `BroadcastChannelCoordinator`, etc. Each implements an interface defined in `domain/ports/`.

**`src/presentation/`** — Vue layer. Pages, feature modules (composables + components), shared UI. Composables are thin reactive wrappers around use cases. Components consume composables.

**`src/workers/`** — Web Worker entry points. Import from `domain/` and `infrastructure/` directly. Never import from `presentation/`.

### Directory structure

```
src/
├── domain/
│   ├── note/           # Note entity (has folderId: UUID | null), NoteContent VO, WikiLink, rules
│   ├── folder/         # Folder entity, folder rules (cycle detection, cascade delete)
│   ├── graph/          # NoteGraph entity, graph rules
│   ├── search/         # SearchIndex entity, tokenizer, search message protocol
│   ├── export/         # Export envelope types (NDJSON)
│   ├── sync/           # ChangeSet, DevicePair, merge strategy
│   └── ports/          # Interfaces: SearchEngine (Phase 2), NoteRepository, FileStorage,
│                       # SyncTransport, Encryption, TabCoordinator
│
├── application/
│   ├── note/           # note.command.ts, note.queries.ts, index.ts
│   ├── folder/         # folder.command.ts, folder.queries.ts, index.ts
│   ├── search/         # search.command.ts, search.queries.ts, index.ts
│   ├── export/         # export.command.ts, import.command.ts, index.ts
│   ├── sync/           # sync.command.ts, index.ts
│   └── services/       # AutoSave, ConflictResolver, BackgroundIndexer
│
├── infrastructure/
│   ├── persistence/
│   │   ├── indexeddb/  # IDBNoteRepository, IDBSearchIndex, client (migrations)
│   │   └── opfs/       # OPFSFileStorage, client
│   ├── crypto/         # WebCryptoEncryption
│   ├── sync/           # WebRTCSyncTransport, signaling client, data channel protocol
│   ├── tabs/           # BroadcastChannelCoordinator, SharedWorkerCoordinator
│   ├── search/         # InvertedIndexEngine
│   └── service-worker/ # SW registration, cache strategies
│
├── presentation/
│   ├── app/            # App.vue, router.ts, di.ts (composition root)
│   ├── pages/          # NotesListPage, NoteEditorPage, GraphPage, SettingsPage
│   ├── features/       # Feature modules, each with composables/ + components/ + index.ts
│   │   ├── notes/
│   │   ├── folders/
│   │   ├── editor/
│   │   ├── search/
│   │   ├── settings/   # Export/Import panels (Phase 2.5)
│   │   ├── graph/
│   │   ├── sync/
│   │   └── tabs/
│   └── shared/         # BaseButton, BaseModal, useKeyboard, useOnline, etc.
│
├── workers/
│   ├── search.worker.ts
│   ├── graph.worker.ts
│   ├── export.worker.ts
│   └── shared.worker.ts
│
└── main.ts
```

### Path aliases (tsconfig + vite)

```
@domain/*         → src/domain/*
@application/*    → src/application/*
@infrastructure/* → src/infrastructure/*
@presentation/*   → src/presentation/*
@workers/*        → src/workers/*
@shared-kernel    → src/shared-kernel
```

## Key architectural rules

1. **`domain/` imports nothing from other layers.** It defines ports (interfaces) that infrastructure implements.
2. **`application/` imports from `domain/` only.** Use cases receive dependencies through constructor injection (or direct import during early phases before DI is introduced).
3. **`infrastructure/` imports from `domain/`** to implement port interfaces. Never imports from `application/` or `presentation/`.
4. **`presentation/` imports from `application/` and `domain/`** (types). Never imports from `infrastructure/` directly (dependencies are provided via Vue's provide/inject from the composition root in `di.ts`).
5. **`workers/` import from `domain/` and `infrastructure/`**. They are a separate delivery mechanism alongside Vue, not part of the presentation layer.
6. **Every feature module exports a public API via `index.ts`.** Internal structure is private. Other features and pages only import from `index.ts`.

## Current phase

The project is being built incrementally in phases. Each phase is self-contained and results in a working application.

**Phase 1: Foundation** — CRUD notes stored in IndexedDB, basic navigation.
**Phase 2: Structure & Performance** — Folders hierarchy (group notes into nested directories), Web Workers (search indexing, markdown parsing), View Transitions, Streams (export/import). See `PHASE2.md` for the detailed roadmap.
**Phase 3: Multi-tab** — SharedWorker/BroadcastChannel, Web Locks, OPFS as second storage.
**Phase 4: Offline & PWA** — Service Worker, Cache API, Background Sync, Web App Manifest.
**Phase 5: P2P & Security** — WebRTC DataChannel, signaling server, Web Crypto encryption.

Ports and DI are introduced gradually: a port interface is created when a second implementation appears or when a worker needs to reuse the same logic. The first real port (`SearchEnginePort`) is introduced in Phase 2 together with the composition root in `presentation/app/di.ts`.

## Code style

- Vue 3 Composition API with `<script setup lang="ts">`.
- Strict TypeScript. Explicit types for function parameters and return values.
- Composables are thin reactive wrappers (`ref`, `computed`, `watch`) around application use cases. Business logic lives in `domain/` and `application/`, not in composables.
- Tailwind CSS for styling. shadcn-vue for base UI components (copied into `presentation/shared/ui/`).
- No class-based components. No Options API. No Vuex/Pinia (state is derived from IndexedDB reads via composables).

## Important context for AI assistance

- This is a **learning project**. When I ask about implementation, explain the *why* behind decisions, not just the *how*. Mention tradeoffs.
- I'm intentionally using raw browser APIs (IndexedDB without wrappers, native WebRTC, etc.) to understand them deeply. Don't suggest libraries unless I ask.
- If a change I'm making violates the architectural rules above, flag it.
- When suggesting code, respect the layer boundaries. Don't put infrastructure concerns in domain, don't put business logic in composables.
- **Roadmaps and plans** (`PHASE2.md`, future `PHASEN.md`) are learning guides, not implementation specs. Do not fill them with ready-to-copy code — describe directions, browser APIs to study, trade-offs, acceptance criteria, and questions to think about. I want to write the implementations myself. Exception: when I explicitly ask to implement/write/build something, then produce the code.

## Phase 2 status (current)

Active phase. Folders hierarchy is a mandatory user-added requirement. Track progress, decisions, and acceptance criteria in [PHASE2.md](PHASE2.md). Key fixed decisions: cascade delete with confirm, non-unique folder names within a parent, `markdown-it` as parser, NDJSON + gzip as export format.
