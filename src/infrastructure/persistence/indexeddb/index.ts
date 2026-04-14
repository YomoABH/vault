import type { Result, UUID } from '@shared-kernel'
import { err, ok } from '@shared-kernel'

// #region --- errors ---

export type IDBErrorCode =
	| 'open_failed'        // indexedDB.open() rejected (storage policy, corrupted DB)
	| 'open_blocked'       // another tab holds an older version open
	| 'not_connected'      // exec() called before open succeeded
	| 'store_not_found'    // objectStore name not in schema
	| 'quota_exceeded'     // QuotaExceededError on write
	| 'transaction_failed' // generic tx.onerror
	| 'record_not_found'   // get() returned undefined
	| 'unknown_error'      // unexpected synchronous throw

export interface IDBError {
	readonly code: IDBErrorCode
	readonly cause?: unknown
}

const idbErr = (code: IDBErrorCode, cause?: unknown): IDBError =>
	cause !== undefined ? { code, cause } : { code }

// #endregion

// #region --- types ---

interface SchemaField {
	index?: boolean
}

interface StoreSchema {
	[field: string]: SchemaField
}

export interface DataBaseOptions {
	version?: number
	schemas?: Record<string, StoreSchema>
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

function useIndexedDB(name: string, options?: DataBaseOptions) {
	const version = options?.version ?? 1
	const schemas = options?.schemas ?? {}

	let instance: IDBDatabase | null = null

	const upgrade = (db: IDBDatabase) => {
		for (const [storeName, schema] of Object.entries(schemas)) {
			if (db.objectStoreNames.contains(storeName)) {
				continue
			}

			const store = db.createObjectStore(storeName, { keyPath: 'id' })

			for (const [field, def] of Object.entries(schema)) {
				if (field !== 'id' && def.index) {
					store.createIndex(field, field, { unique: false })
				}
			}
		}
	}

	const open = (): Promise<Result<IDBDatabase, IDBError>> => {
		return new Promise((resolve) => {
			const request = indexedDB.open(name, version)

			request.onupgradeneeded = () => upgrade(request.result)
			request.onsuccess = () => {
				instance = request.result
				resolve(ok(request.result))
			}
			request.onerror = () => resolve(err(idbErr('open_failed', request.error)))
			// Another tab holds an older connection open — resolve immediately
			// so callers get a clear error rather than a hanging promise
			request.onblocked = () => resolve(err(idbErr('open_blocked')))
		})
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

	return { open, exec }
}

function createDataBase(name: string, options?: DataBaseOptions) {
	const db = useIndexedDB(name, options)
	const ready = db.open()

	return {
		get: async <T>({ store, id }: RecordArgs): Promise<Result<T, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok) return openResult
			const result = await db.exec<T | undefined>(store, os => os.get(id), 'readonly')
			if (!result.ok) return result
			if (result.value === undefined) return err(idbErr('record_not_found'))
			return ok(result.value)
		},
		insert: async ({ store, record }: InsertArgs): Promise<Result<IDBValidKey, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok) return openResult
			return db.exec(store, os => os.add(record))
		},
		update: async ({ store, record }: UpdateArgs): Promise<Result<IDBValidKey, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok) return openResult
			return db.exec(store, os => os.put(record))
		},
		delete: async ({ store, id }: RecordArgs): Promise<Result<undefined, IDBError>> => {
			const openResult = await ready
			if (!openResult.ok) return openResult
			return db.exec(store, os => os.delete(id))
		},
		getAll: async <T>({ store }: GetAllArgs): Promise<Result<T[], IDBError>> => {
			const openResult = await ready
			if (!openResult.ok) return openResult
			return db.exec<T[]>(store, os => os.getAll(), 'readonly')
		},
	}
}

export const vaultDB = createDataBase('vault', {
	version: 1,
	schemas: {
		notes: {},
	},
})
