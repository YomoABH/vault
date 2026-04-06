import type { Note } from '@/domain/note/node'
import type { UUID } from '@/shared-kernel'
import { createNote, updateNote } from '@/domain/note/note.rules'

type TChanges = Partial<Pick<Note, 'title' | 'content'>>

export async function executeCreateNote(title: string) {
	const note = createNote(title)
	// await saveIndexDB(note)
	return note
}

export async function executeUpdateNote(note: Note, changes: TChanges) {
	const updatingNote = updateNote(note, changes)
	// await updateIndexDB(note)
	return updatingNote
}

export async function executeDeleteNote(noteId: UUID) {
	noteId.at(3) // просто чтобы линтер не ругал меня
	// await deleteIndexDB(noteId)
}
