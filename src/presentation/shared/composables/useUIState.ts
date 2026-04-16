import { useLocalStorage } from '@vueuse/core'

// Module-level refs — shared across all callers (same as useNotes pattern)
const activeNoteId = useLocalStorage<string | null>('vault:activeNoteId', null)
const isNotesPanelOpen = useLocalStorage<boolean>('vault:isNotesPanelOpen', false)

export function useUIState() {
	return { activeNoteId, isNotesPanelOpen }
}
