import type { UUID } from '@shared-kernel'

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

	const open = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(name, version)

			request.onupgradeneeded = () => upgrade(request.result)
			request.onsuccess = () => {
				instance = request.result
				resolve(request.result)
			}
			request.onerror = () => reject(request.error)
			request.onblocked = () => {
				console.warn('IndexedDB open blocked (maybe another tab uses old version)')
			}
		})
	}

	const exec = <T>(
		store: string,
		operation: (objectStore: IDBObjectStore) => IDBRequest<T>,
		mode: IDBTransactionMode = 'readwrite',
	): Promise<T> => {
		if (!instance) {
			return Promise.reject(new Error('Database not connected'))
		}

		return new Promise((resolve, reject) => {
			try {
				const tx = instance!.transaction(store, mode)
				const objectStore = tx.objectStore(store)
				const request = operation(objectStore)

				tx.oncomplete = () => resolve(request.result)
				tx.onerror = () => reject(tx.error ?? new Error('Transaction error'))
			}
			catch (error) {
				reject(error)
			}
		})
	}

	return { open, exec }
}

function createDataBase(name: string, options?: DataBaseOptions) {
	const db = useIndexedDB(name, options)
	const ready = db.open()

	return {
		get: async <T>({ store, id }: RecordArgs): Promise<T> => {
			await ready
			return db.exec<T>(store, os => os.get(id), 'readonly')
		},
		insert: async ({ store, record }: InsertArgs): Promise<IDBValidKey> => {
			await ready
			return db.exec(store, os => os.add(record))
		},
		update: async ({ store, record }: UpdateArgs): Promise<IDBValidKey> => {
			await ready
			return db.exec(store, os => os.put(record))
		},
		delete: async ({ store, id }: RecordArgs): Promise<undefined> => {
			await ready
			return db.exec(store, os => os.delete(id))
		},
		getAll: async <T>({ store }: GetAllArgs): Promise<T[]> => {
			await ready
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
