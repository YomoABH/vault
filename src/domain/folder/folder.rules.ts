import type { Folder } from './folder'
import type { Result, Rule, UUID } from '@/shared-kernel'
import { err, ok, validate } from '@/shared-kernel'

export const FOLDER_TITLE_MAX_LENGTH = 40
export const FOLDER_TITLE_MIN_LENGTH = 2
export const FOLDER_TITLE_REGEX = /^[\p{L}\p{N}_\- ]+$/u

const folderTitleRules: Rule<string>[] = [
	(v) => !v ? 'Название папки не может быть пустым' : null,
	(v) => v.length < FOLDER_TITLE_MIN_LENGTH ? `Название должно быть не короче ${FOLDER_TITLE_MIN_LENGTH} символов` : null,
	(v) => v.length > FOLDER_TITLE_MAX_LENGTH ? `Название не должно превышать ${FOLDER_TITLE_MAX_LENGTH} символов` : null,
	(v) => !FOLDER_TITLE_REGEX.test(v) ? 'Название содержит недопустимые символы' : null,
]

export function createFolder(title: string, parentId: UUID | null = null): Result<Folder, string> {
	const trimmed = title.trim()
	const error = validate(trimmed, folderTitleRules)
	if (error !== null) return err(error)

	const now = Date.now()
	return ok({
		id: crypto.randomUUID(),
		title: trimmed,
		createdAt: now,
		updatedAt: now,
		parentId,
	})
}
