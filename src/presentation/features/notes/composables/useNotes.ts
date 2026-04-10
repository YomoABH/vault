import type { Note } from '@/domain/note/note'
import type { UUID } from '@/shared-kernel'
import { ref } from 'vue'
import { executeCreateNote, executeDeleteNote, executeDuplicateNote, executeUpdateNote } from '@/application/note/note.command'
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

	async function updateNote(note: Note, changes: Partial<Pick<Note, 'title' | 'content'>>) {
		const updated = await executeUpdateNote(note, changes)
		notes.value = notes.value.map((n) => {
			if (n.id !== updated.id) {
				return n
			}
			return { ...updated }
		})
		return updated
	}

	return { notes, activeNote, loadNotes, setActiveNote, createNote, deleteNote, duplicateNote, updateNote }
}
