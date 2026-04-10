import type { Note } from '@/domain/note/note'
import { vaultDB } from '@/infrastructure/persistence/indexeddb'

export async function executeGetNotes(): Promise<Note[]> {
	return vaultDB.getAll<Note>({ store: 'notes' })
}
