import type { rawMarkdown, Result } from '@shared-kernel'
import type { Note } from './note'
import type { NoteError } from './note.errors'
import { err, ok } from '@shared-kernel'
import { noteErr } from './note.errors'

// --- Constraints ---

export const NOTE_TITLE_MAX_LENGTH = 60
export const NOTE_DEFAULT_TITLE = 'Untitled'

// --- Types ---

type NoteChanges = Partial<Pick<Note, 'title' | 'content'>>

// --- Rules ---

export function createNote(title: string, content: rawMarkdown = ''): Result<Note, NoteError> {
	const trimmed = title.trim()
	if (!trimmed) {
		return err(noteErr('empty_title'))
	}

	if (trimmed.length > NOTE_TITLE_MAX_LENGTH) {
		return err(noteErr('title_too_long'))
	}
	const now = Date.now()

	return ok({
		id: crypto.randomUUID(),
		title: trimmed,
		content,
		folderId: null,
		createdAt: now,
		updatedAt: now,
	})
}

export function updateNote(note: Note, changes: NoteChanges): Result<Note, NoteError> {
	if (changes.title === undefined && changes.content === undefined) {
		return ok(note)
	}
	let validated = changes
	if (changes.title !== undefined) {
		const trimmed = changes.title.trim()

		if (!trimmed) {
			return err(noteErr('empty_title'))
		}

		if (trimmed.length > NOTE_TITLE_MAX_LENGTH) {
			return err(noteErr('title_too_long'))
		}

		validated = { ...changes, title: trimmed }
	}
	return ok({ ...note, ...validated, updatedAt: Date.now() })
}

export function duplicateNote(note: Note): Result<Note, NoteError> {
	return createNote(note.title, note.content)
}
