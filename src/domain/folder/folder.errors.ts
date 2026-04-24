export type FolderErrorCode
	= | 'empty_title' // title is empty after trim
		| 'title_too_short' // title is below FOLDER_TITLE_MIN_LENGTH
		| 'title_too_long' // title exceeds FOLDER_TITLE_MAX_LENGTH
		| 'invalid_title_chars' // title doesn't match allowed character regex
		| 'circular_reference' // parentId === folder.id
		| 'folder_not_found' // folder ID doesn't exist in store
		| 'db_error' // persistence layer failure
		| 'unknown_error' // unexpected catch

export interface FolderError {
	readonly code: FolderErrorCode
	readonly cause?: unknown
}

export function folderErr(code: FolderErrorCode, cause?: unknown): FolderError {
	return cause !== undefined ? { code, cause } : { code }
}
