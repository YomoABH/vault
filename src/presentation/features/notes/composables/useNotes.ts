import type { Note } from '@/domain/note/note'
import { ref } from 'vue'
import { executeGetNotes } from '@/application/note/note.queries'

const notes = ref<Note[]>([])
const activeNote = ref<Note | null>(null)

export function useNotes() {
	async function loadNotes(): Promise<void> {
		notes.value = await executeGetNotes()
	}

	function setActiveNote(note: Note): void {
		activeNote.value = note
	}

	return { notes, activeNote, loadNotes, setActiveNote }
}
