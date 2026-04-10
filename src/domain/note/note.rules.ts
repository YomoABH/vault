import type { Note } from './note'
import type { rawMarkdown } from '@/shared-kernel'

export function createNote(title: string, content: rawMarkdown = ''): Note {
	const now = Date.now()

	return {
		id: crypto.randomUUID(),
		title,
		content,
		createdAt: now,
		updatedAt: now,
	}
}

type TChanges = Partial<Pick<Note, 'title' | 'content'>>

export function updateNote(note: Note, changes: TChanges): Note {
	if (!changes.content && !changes.title) {
		return note
	}

	return {
		...note,
		...changes,
		updatedAt: Date.now(),
	}
}
