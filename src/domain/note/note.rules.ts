import type { Note } from './note'
import type { rawMarkdown } from '@/shared-kernel'

// --- Constraints ---

export const NOTE_TITLE_MAX_LENGTH = 255
export const NOTE_DEFAULT_TITLE = 'Untitled'

// --- Types ---

type NoteChanges = Partial<Pick<Note, 'title' | 'content'>>

// --- Rules ---

export function createNote(title: string, content: rawMarkdown = ''): Note {
	const now = Date.now()
	return {
		id: crypto.randomUUID(),
		title: title.trim().slice(0, NOTE_TITLE_MAX_LENGTH) || NOTE_DEFAULT_TITLE,
		content,
		createdAt: now,
		updatedAt: now,
	}
}

export function updateNote(note: Note, changes: NoteChanges): Note {
	if (!changes.title && !changes.content) {
		return note
	}
	return { ...note, ...changes, updatedAt: Date.now() }
}

export function duplicateNote(note: Note): Note {
	return createNote(note.title, note.content)
}
