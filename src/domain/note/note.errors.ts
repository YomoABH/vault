export type NoteErrorCode
	= | 'empty_title' // title is empty after trim
		| 'title_too_long' // title exceeds NOTE_TITLE_MAX_LENGTH
		| 'note_not_found' // note ID doesn't exist in store
		| 'db_error' // persistence layer failure
		| 'unknown_error' // unexpected catch

export interface NoteError {
	readonly code: NoteErrorCode
	readonly cause?: unknown
}

export function noteErr(code: NoteErrorCode, cause?: unknown): NoteError {
	return cause !== undefined ? { code, cause } : { code }
}
