<script setup lang="ts">
import type { Note } from '@/domain/note/note'
import { useNotes } from '../composables/useNotes'

const props = defineProps<{
	note: Note
}>()

const { activeNote, setActiveNote } = useNotes()
</script>

<template>
	<button
		class="w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors"
		:class="activeNote?.id === props.note.id
			? 'bg-accent text-accent-foreground font-medium'
			: 'text-foreground hover:bg-accent/50'"
		@click="setActiveNote(props.note)"
	>
		{{ props.note.title || 'Без названия' }}
	</button>
</template>
