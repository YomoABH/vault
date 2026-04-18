import type { rawMarkdown, timestamp, UUID } from '@shared-kernel'

export interface Note {
	id: UUID
	title: string
	content: rawMarkdown
	folderId: UUID | null
	createdAt: timestamp
	updatedAt: timestamp
}
