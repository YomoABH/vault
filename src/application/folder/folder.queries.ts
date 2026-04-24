import type { Folder } from '@domain/folder/folder'
import type { FolderError } from '@domain/folder/folder.errors'
import type { AsyncResult, UUID } from '@shared-kernel'
import { folderErr } from '@domain/folder/folder.errors'
import { vaultDB } from '@infrastructure/persistence/indexeddb'
import { err } from '@shared-kernel'

export async function executeGetFolders(): AsyncResult<Folder[], FolderError> {
	const result = await vaultDB.getAll<Folder>({ store: 'folders' })
	if (!result.ok)
		return err(folderErr('db_error', result.error))
	return result
}

export async function executeGetFolder(folderId: UUID): AsyncResult<Folder, FolderError> {
	const result = await vaultDB.get<Folder>({ store: 'folders', id: folderId })
	if (!result.ok) {
		const code = result.error.code === 'record_not_found' ? 'folder_not_found' : 'db_error'
		return err(folderErr(code, result.error))
	}
	return result
}
