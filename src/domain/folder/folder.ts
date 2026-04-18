import type { timestamp, UUID } from '@/shared-kernel'

export interface Folder {
	id: UUID
	title: string
	parentId: UUID | null // подразумевается, что null это root
	createdAt: timestamp
	updatedAt: timestamp
}
