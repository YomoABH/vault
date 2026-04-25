import { useLocalStorage } from '@vueuse/core'

// Module-level refs — shared across all callers (same as useNotes pattern)
const activeNoteId = useLocalStorage<string | null>('vault:activeNoteId', null)
const activeFolderId = useLocalStorage<string | null>('vault:activeFolderId', null)
const isNotesPanelOpen = useLocalStorage<boolean>('vault:isNotesPanelOpen', false)

export function useUIState() {
	return { activeNoteId, activeFolderId, isNotesPanelOpen }
}
