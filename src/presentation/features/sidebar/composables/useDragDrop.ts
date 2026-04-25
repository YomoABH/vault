import type { UUID } from '@shared-kernel'
import { useFolders } from '@presentation/features/folder'
import { useNotes } from '@presentation/features/notes'
import { computed, ref } from 'vue'

type DragItem = { type: 'folder', id: UUID } | { type: 'note', id: UUID }

const DRAG_DATA_KEY = 'application/vault-drag'

const draggedItem = ref<DragItem | null>(null)
// module-level — one instance shared across all components, not recreated per call
const isDragging = computed(() => draggedItem.value !== null)

export function useDragDrop() {
	const { editFolder, getFolderById } = useFolders()
	const { notes, updateNote } = useNotes()

	function startDrag(event: DragEvent, item: DragItem): void {
		draggedItem.value = item
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move'
			event.dataTransfer.setData(DRAG_DATA_KEY, item.type)
		}
	}

	function endDrag(): void {
		draggedItem.value = null
	}

	function isItemBeingDragged(id: UUID): boolean {
		return isDragging.value && draggedItem.value?.id === id
	}

	function isValidDropTarget(targetFolderId: UUID | null): boolean {
		if (!draggedItem.value)
			return false
		// folder can't be dropped on itself
		if (draggedItem.value.type === 'folder' && targetFolderId === draggedItem.value.id)
			return false
		return true
	}

	async function dropOnFolder(targetFolderId: UUID | null): Promise<void> {
		const item = draggedItem.value

		endDrag()

		if (!item)
			return
		if (item.type === 'folder' && targetFolderId === item.id)
			return

		if (item.type === 'folder') {
			const folder = getFolderById(item.id)
			if (!folder || folder.parentId === targetFolderId)
				return
			await editFolder(folder, { parentId: targetFolderId })
		}

		else {
			const note = notes.value.find(n => n.id === item.id)
			if (!note || note.folderId === targetFolderId)
				return
			await updateNote(note, { folderId: targetFolderId })
		}
	}

	return { isDragging, isItemBeingDragged, startDrag, endDrag, isValidDropTarget, dropOnFolder }
}
