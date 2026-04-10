<script setup lang="ts">
import { onMounted } from 'vue'
import NoteListItem from './NoteListItem.vue'
import { useNotes } from '../composables/useNotes'

defineEmits<{
	close: []
}>()

const { notes, loadNotes } = useNotes()

onMounted(loadNotes)
</script>

<template>
	<aside class="flex flex-col w-64 h-full border-r border-border bg-sidebar shrink-0 overflow-hidden">
		<div class="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
			<span class="text-sm font-medium">Заметки</span>
		</div>

		<div class="flex-1 overflow-y-auto p-2">
			<template v-if="notes.length > 0">
				<NoteListItem v-for="note in notes" :key="note.id" :note="note" />
			</template>
			<div
				v-else
				class="h-full truncate flex items-center justify-center text-sm font-semibold text-muted-foreground px-2 py-4"
			>
				Заметок пока нет
			</div>
		</div>
	</aside>
</template>
