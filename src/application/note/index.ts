import { executeCreateNote, executeDeleteNote, executeUpdateNote } from './note.command'
import { executeGetNotes } from './note.queries'

export function useNoteUseCases() {
	return {
		createNote: executeCreateNote,
		updateNote: executeUpdateNote,
		deleteNote: executeDeleteNote,
		getNotes: executeGetNotes,
	}
}
