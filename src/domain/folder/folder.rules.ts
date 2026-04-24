import type { Folder } from './folder'
import type { FolderError } from './folder.errors'
import type { Result, Rule, UUID } from '@/shared-kernel'
import { err, ok, validate } from '@/shared-kernel'
import { folderErr } from './folder.errors'

export const FOLDER_TITLE_MAX_LENGTH = 40
export const FOLDER_TITLE_MIN_LENGTH = 2
export const FOLDER_TITLE_REGEX = /^[\p{L}\p{N}_\- ]+$/u

const folderTitleRules: Rule<string, FolderError>[] = [
	v => !v ? folderErr('empty_title') : null,
	v => v.length < FOLDER_TITLE_MIN_LENGTH ? folderErr('title_too_short') : null,
	v => v.length > FOLDER_TITLE_MAX_LENGTH ? folderErr('title_too_long') : null,
	v => !FOLDER_TITLE_REGEX.test(v) ? folderErr('invalid_title_chars') : null,
]

type FolderChanges = Partial<Pick<Folder, 'title' | 'parentId'>>

export function createFolder(title: string, parentId: UUID | null = null): Result<Folder, FolderError> {
	const trimmed = title.trim()
	const error = validate(trimmed, folderTitleRules)
	if (error !== null)
		return err(error)

	const now = Date.now()
	return ok({
		id: crypto.randomUUID(),
		title: trimmed,
		createdAt: now,
		updatedAt: now,
		parentId,
	})
}

export function editFolder(folder: Folder, changes: FolderChanges): Result<Folder, FolderError> {
	if (changes.title === undefined && changes.parentId === undefined) {
		return ok(folder)
	}

	if (changes.title !== undefined) {
		const trimmed = changes.title.trim()
		const error = validate(trimmed, folderTitleRules)
		if (error !== null)
			return err(error)
		changes = { ...changes, title: trimmed }
	}

	if (changes.parentId !== undefined && changes.parentId === folder.id) {
		return err(folderErr('circular_reference'))
	}

	return ok({ ...folder, ...changes, updatedAt: Date.now() })
}
