import type { Note } from '@domain/note/note'
import type { NoteError } from '@domain/note/note.errors'
import type { AsyncResult } from '@shared-kernel'
import { noteErr } from '@domain/note/note.errors'
import { vaultDB } from '@infrastructure/persistence/indexeddb'
import { err } from '@shared-kernel'

export async function executeGetNotes(): AsyncResult<Note[], NoteError> {
	const result = await vaultDB.getAll<Note>({ store: 'notes' })
	if (!result.ok)
		return err(noteErr('db_error', result.error))
	return result
}
