import type { Note } from '@domain/note/note'
import type { NoteError } from '@domain/note/note.errors'
import type { AsyncResult, UUID } from '@shared-kernel'
import { noteErr } from '@domain/note/note.errors'
import { createNote, duplicateNote, NOTE_DEFAULT_TITLE, updateNote } from '@domain/note/note.rules'
import { vaultDB } from '@infrastructure/persistence/indexeddb'
import { err } from '@shared-kernel'

type TChanges = Partial<Pick<Note, 'title' | 'content'>>

export async function executeCreateNote(title: string): AsyncResult<Note, NoteError> {
	const resolved = title.trim() || NOTE_DEFAULT_TITLE
	const result = createNote(resolved)
	if (!result.ok)
		return result
	const dbResult = await vaultDB.insert({ store: 'notes', record: result.value })
	if (!dbResult.ok)
		return err(noteErr('db_error', dbResult.error))
	return result
}

export async function executeUpdateNote(note: Note, changes: TChanges): AsyncResult<Note, NoteError> {
	const result = updateNote(note, changes)
	if (!result.ok)
		return result
	const dbResult = await vaultDB.update({ store: 'notes', record: result.value })
	if (!dbResult.ok)
		return err(noteErr('db_error', dbResult.error))
	return result
}

export async function executeDeleteNote(noteId: UUID): AsyncResult<void, NoteError> {
	const dbResult = await vaultDB.delete({ store: 'notes', id: noteId })
	if (!dbResult.ok)
		return err(noteErr('db_error', dbResult.error))
	return dbResult
}

export async function executeDuplicateNote(note: Note): AsyncResult<Note, NoteError> {
	const result = duplicateNote(note)
	if (!result.ok)
		return result
	const dbResult = await vaultDB.insert({ store: 'notes', record: result.value })
	if (!dbResult.ok)
		return err(noteErr('db_error', dbResult.error))
	return result
}
