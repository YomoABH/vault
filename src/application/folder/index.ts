import { executeCreateFolder, executeDeleteFolder, executeEditFolder } from './folder.command'
import { executeGetFolder, executeGetFolders } from './folder.queries'

export function useFolderUseCases() {
	return {
		createFolder: executeCreateFolder,
		editFolder: executeEditFolder,
		deleteFolder: executeDeleteFolder,
		getFolders: executeGetFolders,
		getFolder: executeGetFolder,
	}
}
