import type { Note } from '@/domain/note/note'
import type { UUID } from '@/shared-kernel'
import { createNote, updateNote } from '@/domain/note/note.rules'
import { vaultDB } from '@/infrastructure/persistence/indexeddb'

type TChanges = Partial<Pick<Note, 'title' | 'content'>>

export async function executeCreateNote(title: string) {
	const note = createNote(title)
	await vaultDB.insert({ store: 'notes', record: note })
	return note
}

export async function executeUpdateNote(note: Note, changes: TChanges) {
	const updatingNote = updateNote(note, changes)
	await vaultDB.update({ store: 'notes', record: updatingNote })
	return updatingNote
}

export async function executeDeleteNote(noteId: UUID) {
	await vaultDB.delete({ store: 'notes', id: noteId })
}
