import type { Result, UUID } from '@shared-kernel'
import { err, ok } from '@shared-kernel'

// #region --- errors ---
export type IDBErrorCode
	= | 'open_failed' // indexedDB.open() rejected (storage policy, corrupted DB)
		| 'open_blocked' // another tab holds an older version open
		| 'migration_failed' // a migration threw; versionchange tx aborted
		| 'not_connected' // exec() called before open succeeded
		| 'store_not_found' // objectStore name not in schema
		| 'quota_exceeded' // QuotaExceededError on write
		| 'transaction_failed' // generic tx.onerror
		| 'record_not_found' // get() returned undefined
		| 'unknown_error' // unexpected synchronous throw

export interface IDBError {
	readonly code: IDBErrorCode
	readonly cause?: unknown
}

function idbErr(code: IDBErrorCode, cause?: unknown): IDBError {
	return cause !== undefined ? { code, cause } : { code }
}

// #endregion

// #region --- types ---

export interface MigrationContext {
	readonly db: IDBDatabase
	readonly tx: IDBTransaction // versionchange tx; scope = all stores, lifespan = this upgrade only
	readonly oldVersion: number
	readonly newVersion: number
}

export type Migration = (ctx: MigrationContext) => void

export interface DataBaseOptions {
	migrations: Record<number, Migration>
}

export interface RecordArgs {
	store: string
	id: UUID
}

export interface InsertArgs {
	store: string
	record: unknown
}

export interface UpdateArgs extends InsertArgs {}

export interface GetAllArgs {
	store: string
}

// #endregion

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

function useIndexedDB(name: string, options: DataBaseOptions) {
	const migrations = options.migrations
	const versions = Object.keys(migrations).map(Number)
	if (versions.length === 0) {
		throw new Error('DataBaseOptions.migrations must define at least one version')
	}
	const version = Math.max(...versions)

	let instance: IDBDatabase | null = null

	const runMigrations = (event: IDBVersionChangeEvent, request: IDBOpenDBRequest) => {
		const db = request.result
		const tx = request.transaction!

		const oldVersion = event.oldVersion
		const newVersion = event.newVersion ?? version

		for (let v = oldVersion + 1; v <= newVersion; v++) {
			const migration = migrations[v]
			if (!migration) {
				throw new Error(`Missing migration for version ${v}`)
			}
			migration({ db, tx, oldVersion, newVersion })
		}
	}

	const open = (onVersionChange: () => void): Promise<Result<IDBDatabase, IDBError>> => {
		return new Promise((resolve) => {
			const request = indexedDB.open(name, version)
			let migrationErr: IDBError | undefined

			request.onupgradeneeded = (event) => {
				const tx = request.transaction!
				tx.onerror = () => {
					migrationErr = idbErr('migration_failed', tx.error ?? undefined)
				}
				try {
					runMigrations(event, request)
				}
				catch (cause) {
					tx.abort()
					migrationErr = idbErr('migration_failed', cause)
				}
			}

			request.onsuccess = () => {
				instance = request.result
				instance.onversionchange = () => {
					instance?.close()
					instance = null
					onVersionChange()
				}
				resolve(ok(request.result))
			}
			request.onerror = () => resolve(err(migrationErr ?? idbErr('open_failed', request.error)))
			request.onblocked = () => {
				// ждём 3с: если другой таб закроется — onsuccess сработает сам
				setTimeout(() => {
					if (!instance)
						resolve(err(idbErr('open_blocked')))
				}, 3000)
			}
		})
	}

	const openWithRetry = async (onVersionChange: () => void, attempts = 3, delayMs = 500): Promise<Result<IDBDatabase, IDBError>> => {
		let last: Result<IDBDatabase, IDBError> = err(idbErr('not_connected'))
		for (let i = 0; i < attempts; i++) {
			last = await open(onVersionChange)
			if (last.ok || last.error.code === 'open_blocked' || last.error.code === 'migration_failed')
				return last
			if (i < attempts - 1)
				await sleep(delayMs * 2 ** i)
		}
		return last
	}

	const exec = <T>(
		store: string,
		operation: (objectStore: IDBObjectStore) => IDBRequest<T>,
		mode: IDBTransactionMode = 'readwrite',
	): Promise<Result<T, IDBError>> => {
		if (!instance) {
			return Promise.resolve(err(idbErr('not_connected')))
		}

		return new Promise((resolve) => {
			try {
				const tx = instance!.transaction(store, mode)

				let objectStore: IDBObjectStore
				try {
					objectStore = tx.objectStore(store)
				}
				catch (cause) {
					resolve(err(idbErr('store_not_found', cause)))
					return
				}

				const request = operation(objectStore)

				tx.oncomplete = () => resolve(ok(request.result))
				tx.onerror = () => {
					const cause = tx.error ?? undefined
					const code
						= cause instanceof DOMException && cause.name === 'QuotaExceededError'
							? 'quota_exceeded'
							: 'transaction_failed'
					resolve(err(idbErr(code, cause)))
				}
			}
			catch (cause) {
				resolve(err(idbErr('unknown_error', cause)))
			}
		})
	}

	return { openWithRetry, exec }
}

function createDataBase(name: string, options: DataBaseOptions) {
	const db = useIndexedDB(name, options)
	let ready: Promise<Result<IDBDatabase, IDBError>>
	const reconnect = () => {
		ready = db.openWithRetry(reconnect)
	}
	ready = db.openWithRetry(reconnect)

	return {
		get: async <T>({ store, id }: RecordArgs): Promise<Result<T, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok)
				return openResult
			const result = await db.exec<T | undefined>(store, os => os.get(id), 'readonly')
			if (!result.ok)
				return result
			if (result.value === undefined)
				return err(idbErr('record_not_found'))
			return ok(result.value)
		},
		insert: async ({ store, record }: InsertArgs): Promise<Result<IDBValidKey, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok)
				return openResult
			return db.exec(store, os => os.add(record))
		},
		update: async ({ store, record }: UpdateArgs): Promise<Result<IDBValidKey, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok)
				return openResult
			return db.exec(store, os => os.put(record))
		},
		delete: async ({ store, id }: RecordArgs): Promise<Result<undefined, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok)
				return openResult
			return db.exec(store, os => os.delete(id))
		},
		getAll: async <T>({ store }: GetAllArgs): Promise<Result<T[], IDBError>> => {
			const openResult = await ready
			if (!openResult.ok)
				return openResult
			return db.exec<T[]>(store, os => os.getAll(), 'readonly')
		},
	}
}

export const vaultDB = createDataBase('vault', {
	migrations: {
		1: ({ db }) => {
			db.createObjectStore('notes', { keyPath: 'id' })
		},
		2: ({ db, tx }) => {
			const foldersStore = db.createObjectStore('folders', { keyPath: 'id' })
			foldersStore.createIndex('by_title', 'title', { unique: false })
			foldersStore.createIndex('by_parentId', 'parentId', { unique: false })

			const notesStore = tx.objectStore('notes')
			notesStore.createIndex('by_title', 'title', { unique: false })
			notesStore.createIndex('by_folderId', 'folderId', { unique: false })

			const request = notesStore.openCursor()
			request.onerror = () => {}
			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest).result
				if (!cursor) {
					return
				}

				const note = cursor.value

				if (note.folderId === undefined) {
					note.folderId = null
					cursor.update(note)
				}

				cursor.continue()
			}
		},
	},
})
