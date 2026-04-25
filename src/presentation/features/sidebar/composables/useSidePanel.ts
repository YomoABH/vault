import type { UUID } from '@shared-kernel'
import { ref } from 'vue'

// Module-level singleton — shared across all callers
const expandedFolderIds = ref<Set<UUID>>(new Set())

export function useSidePanel() {
	function toggleFolder(id: UUID): void {
		const next = new Set(expandedFolderIds.value)
		if (next.has(id))
			next.delete(id)
		else
			next.add(id)
		expandedFolderIds.value = next
	}

	function isExpanded(id: UUID): boolean {
		return expandedFolderIds.value.has(id)
	}

	return { expandedFolderIds, toggleFolder, isExpanded }
}
