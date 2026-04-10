import type { Note } from '@/domain/note/note'
import type { UUID } from '@/shared-kernel'
import { ref } from 'vue'
import { executeCreateNote, executeDeleteNote, executeDuplicateNote } from '@/application/note/note.command'
import { executeGetNotes } from '@/application/note/note.queries'

const notes = ref<Note[]>([])
const activeNote = ref<Note | null>(null)

export function useNotes() {
	async function loadNotes(): Promise<void> {
		notes.value = await executeGetNotes()
	}

	async function createNote(): Promise<void> {
		const note = await executeCreateNote('')
		await loadNotes()
		activeNote.value = note
	}

	function setActiveNote(note: Note): void {
		activeNote.value = note
	}

	async function deleteNote(noteId: UUID): Promise<void> {
		if (activeNote.value?.id === noteId) {
			activeNote.value = null
		}
		await executeDeleteNote(noteId)
		await loadNotes()
	}

	async function duplicateNote(note: Note): Promise<void> {
		const duplicate = await executeDuplicateNote(note)
		await loadNotes()
		activeNote.value = duplicate
	}

	return { notes, activeNote, loadNotes, setActiveNote, createNote, deleteNote, duplicateNote }
}
