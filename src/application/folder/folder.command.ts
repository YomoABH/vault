import type { Folder } from '@domain/folder/folder'
import type { FolderError } from '@domain/folder/folder.errors'
import type { Note } from '@domain/note/note'
import type { IDBError } from '@infrastructure/persistence/indexeddb'
import type { AsyncResult, Result, UUID } from '@shared-kernel'

import { folderErr } from '@domain/folder/folder.errors'
import { createFolder, editFolder } from '@domain/folder/folder.rules'
import { vaultDB } from '@infrastructure/persistence/indexeddb'
import { err, ok } from '@shared-kernel'

const FOLDERS_STORE = 'folders' as const
const NOTES_STORE = 'notes' as const

type FolderChanges = Partial<Pick<Folder, 'title' | 'parentId'>>

async function checkDeepCycle(movingFolderId: UUID, newParentId: UUID): Promise<Result<void, FolderError>> {
	let currentId: UUID | null = newParentId
	while (currentId !== null) {
		if (currentId === movingFolderId)
			return err(folderErr('circular_reference'))
		const dbResult: Result<Folder, IDBError> = await vaultDB.get<Folder>({ store: FOLDERS_STORE, id: currentId })
		if (!dbResult.ok)
			return err(folderErr('db_error', dbResult.error))
		currentId = dbResult.value.parentId
	}
	return ok(undefined)
}

function collectDescendantIds(folderId: UUID, allFolders: Folder[]): UUID[] {
	const children = allFolders.filter(f => f.parentId === folderId)
	return children.flatMap(child => [child.id, ...collectDescendantIds(child.id, allFolders)])
}

export async function executeCreateFolder(title: string, parentId: UUID | null = null): AsyncResult<Folder, FolderError> {
	if (parentId !== null) {
		const parentResult = await vaultDB.get({ store: FOLDERS_STORE, id: parentId })
		if (!parentResult.ok)
			return err(folderErr('folder_not_found'))
	}

	const result = createFolder(title, parentId)
	if (!result.ok)
		return result

	const dbResult = await vaultDB.insert({ store: FOLDERS_STORE, record: result.value })
	if (!dbResult.ok)
		return err(folderErr('db_error', dbResult.error))

	return result
}

export async function executeEditFolder(folder: Folder, changes: FolderChanges): AsyncResult<Folder, FolderError> {
	const [freshResult, parentResult] = await Promise.all([
		vaultDB.get<Folder>({ store: FOLDERS_STORE, id: folder.id }),
		changes.parentId != null
			? vaultDB.get({ store: FOLDERS_STORE, id: changes.parentId })
			: Promise.resolve(null),
	])

	if (!freshResult.ok)
		return err(folderErr('folder_not_found'))

	if (parentResult !== null && !parentResult.ok)
		return err(folderErr('folder_not_found'))

	if (changes.parentId != null) {
		const cycleResult = await checkDeepCycle(folder.id, changes.parentId)
		if (!cycleResult.ok)
			return cycleResult
	}

	const result = editFolder(freshResult.value, changes)
	if (!result.ok)
		return result

	const dbResult = await vaultDB.update({ store: FOLDERS_STORE, record: result.value })
	if (!dbResult.ok)
		return err(folderErr('db_error', dbResult.error))

	return result
}

export async function executeDeleteFolder(folderId: UUID): AsyncResult<void, FolderError> {
	const [folderResult, allFoldersResult, allNotesResult] = await Promise.all([
		vaultDB.get({ store: FOLDERS_STORE, id: folderId }),
		vaultDB.getAll<Folder>({ store: FOLDERS_STORE }),
		vaultDB.getAll<Note>({ store: NOTES_STORE }),
	])

	if (!folderResult.ok)
		return err(folderErr('folder_not_found'))
	if (!allFoldersResult.ok)
		return err(folderErr('db_error', allFoldersResult.error))
	if (!allNotesResult.ok)
		return err(folderErr('db_error', allNotesResult.error))

	const deletedFolderIds = new Set([folderId, ...collectDescendantIds(folderId, allFoldersResult.value)])

	for (const note of allNotesResult.value) {
		if (note.folderId !== null && deletedFolderIds.has(note.folderId)) {
			const deleteResult = await vaultDB.delete({ store: NOTES_STORE, id: note.id })
			if (!deleteResult.ok)
				return err(folderErr('db_error', deleteResult.error))
		}
	}

	for (const id of deletedFolderIds) {
		const deleteResult = await vaultDB.delete({ store: FOLDERS_STORE, id })
		if (!deleteResult.ok)
			return err(folderErr('db_error', deleteResult.error))
	}

	return ok(undefined)
}
