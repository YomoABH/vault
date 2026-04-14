import type { Note } from '@/domain/note/note'
import type { NoteError, NoteErrorCode } from '@/domain/note/note.errors'
import type { UUID } from '@/shared-kernel'
import { useNoteUseCases } from '@application/note'
import { useToast } from '@presentation/shared/composables/useToast'
import { ref } from 'vue'

const { createNote: executeCreateNote, updateNote: executeUpdateNote, deleteNote: executeDeleteNote, duplicateNote: executeDuplicateNote, getNotes: executeGetNotes } = useNoteUseCases()

const notes = ref<Note[]>([])
const activeNote = ref<Note | null>(null)

const ERROR_MESSAGES: Record<NoteErrorCode, string> = {
	empty_title: 'Название заметки не может быть пустым',
	title_too_long: 'Название слишком длинное',
	note_not_found: 'Заметка не найдена',
	db_error: 'Ошибка хранилища данных',
	unknown_error: 'Неизвестная ошибка',
}

const { error: toastError } = useToast()

function showError(error: NoteError): void {
	toastError(ERROR_MESSAGES[error.code])
}

export function useNotes() {
	async function loadNotes(): Promise<void> {
		const result = await executeGetNotes()
		if (result.ok) {
			notes.value = result.value
		}
		else {
			showError(result.error)
		}
	}

	async function createNote(): Promise<void> {
		const result = await executeCreateNote('')
		if (!result.ok) {
			showError(result.error)
			return
		}
		notes.value = [result.value, ...notes.value]
		activeNote.value = result.value
	}

	function setActiveNote(note: Note): void {
		activeNote.value = note
	}

	async function deleteNote(noteId: UUID): Promise<void> {
		const result = await executeDeleteNote(noteId)
		if (!result.ok) {
			showError(result.error)
			return
		}
		if (activeNote.value?.id === noteId) {
			activeNote.value = null
		}
		notes.value = notes.value.filter(n => n.id !== noteId)
	}

	async function duplicateNote(note: Note): Promise<void> {
		const result = await executeDuplicateNote(note)
		if (!result.ok) {
			showError(result.error)
			return
		}
		notes.value = [...notes.value, result.value]
		activeNote.value = result.value
	}

	async function updateNote(note: Note, changes: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note | null> {
		const result = await executeUpdateNote(note, changes)
		if (!result.ok) {
			showError(result.error)
			return null
		}
		notes.value = notes.value.map(n => n.id !== result.value.id ? n : { ...result.value })
		return result.value
	}

	return { notes, activeNote, loadNotes, setActiveNote, createNote, deleteNote, duplicateNote, updateNote }
}
