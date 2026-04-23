import type { rawMarkdown, Result, Rule } from '@shared-kernel'
import type { Note } from './note'
import type { NoteError } from './note.errors'
import { err, ok, validate } from '@shared-kernel'
import { noteErr } from './note.errors'

// --- Constraints ---

export const NOTE_TITLE_MAX_LENGTH = 60
export const NOTE_DEFAULT_TITLE = 'Untitled'

// --- Types ---

type NoteChanges = Partial<Pick<Note, 'title' | 'content'>>

// --- Rules ---
const noteTitleRules: Rule<string, NoteError>[] = [
	v => !v ? noteErr('empty_title') : null,
	v => v.length > NOTE_TITLE_MAX_LENGTH ? noteErr('title_too_long') : null,
]

export function createNote(title: string, content: rawMarkdown = ''): Result<Note, NoteError> {
	const trimmed = title.trim()
	const error = validate(trimmed, noteTitleRules)
	if (error !== null) {
		return err(error)
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

	if (changes.title !== undefined) {
		const trimmed = changes.title.trim()
		const error = validate(trimmed, noteTitleRules)
		if (error !== null) return err(error)
		changes = { ...changes, title: trimmed }
	}

	return ok({ ...note, ...changes, updatedAt: Date.now() })
}

export function duplicateNote(note: Note): Result<Note, NoteError> {
	return createNote(note.title, note.content)
}
