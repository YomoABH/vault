import type { Folder } from '@domain/folder/folder'
import type { FolderError, FolderErrorCode } from '@domain/folder/folder.errors'
import type { UUID } from '@shared-kernel'
import { useFolderUseCases } from '@application/folder'
import { useToast } from '@presentation/shared/composables/useToast'
import { ref } from 'vue'

const {
	createFolder: executeCreateFolder,
	editFolder: executeEditFolder,
	deleteFolder: executeDeleteFolder,
	getFolders: executeGetFolders,
} = useFolderUseCases()

const folders = ref<Folder[]>([])

const ERROR_MESSAGES: Record<FolderErrorCode, string> = {
	empty_title: 'Название папки не может быть пустым',
	title_too_short: 'Название слишком короткое',
	title_too_long: 'Название слишком длинное',
	invalid_title_chars: 'Название содержит недопустимые символы',
	circular_reference: 'Папка не может быть вложена сама в себя',
	folder_not_found: 'Папка не найдена',
	db_error: 'Ошибка хранилища данных',
	unknown_error: 'Неизвестная ошибка',
}

const { error: toastError } = useToast()

function showError(error: FolderError): void {
	toastError(ERROR_MESSAGES[error.code])
}

export function useFolders() {
	async function loadFolders(): Promise<void> {
		const result = await executeGetFolders()
		if (!result.ok) {
			showError(result.error)
			return
		}
		folders.value = result.value
	}

	async function createFolder(title: string, parentId: UUID | null = null): Promise<Folder | null> {
		const result = await executeCreateFolder(title, parentId)
		if (!result.ok) {
			showError(result.error)
			return null
		}
		folders.value = [...folders.value, result.value]
		return result.value
	}

	async function editFolder(folder: Folder, changes: Partial<Pick<Folder, 'title' | 'parentId'>>): Promise<Folder | null> {
		const result = await executeEditFolder(folder, changes)
		if (!result.ok) {
			showError(result.error)
			return null
		}
		folders.value = folders.value.map(f => f.id === result.value.id ? result.value : f)
		return result.value
	}

	async function deleteFolder(folderId: UUID): Promise<boolean> {
		const result = await executeDeleteFolder(folderId)
		if (!result.ok) {
			showError(result.error)
			return false
		}
		folders.value = folders.value.filter(f => f.id !== folderId)
		return true
	}

	function getChildFolders(parentId: UUID | null): Folder[] {
		return folders.value.filter(f => f.parentId === parentId)
	}

	function getFolderById(folderId: UUID): Folder | undefined {
		return folders.value.find(f => f.id === folderId)
	}

	return {
		folders,
		loadFolders,
		createFolder,
		editFolder,
		deleteFolder,
		getChildFolders,
		getFolderById,
	}
}
