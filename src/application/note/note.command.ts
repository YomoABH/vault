import type { Note } from '@/domain/note/note'
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

export async function executeDeleteNote(_noteId: UUID) {
	// await deleteIndexDB(_noteId)
}
