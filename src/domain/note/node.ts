import type { rawMarkdown, timestamp, UUID } from '@shared-kernel'

export interface Note {
	id: UUID
	title: string
	content: rawMarkdown
	createdAt: timestamp
	updatedAt: timestamp
}
