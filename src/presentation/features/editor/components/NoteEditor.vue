<script setup lang="ts">
import type { Note } from '@/domain/note/note'
import { useNotes } from '@presentation/features/notes/composables/useNotes'
import { executeUpdateNote } from '@/application/note/note.command'

const props = defineProps<{
	note: Note
}>()

const { activeNote } = useNotes()

async function onTitleChange(event: Event) {
	const title = (event.target as HTMLInputElement).value
	const updated = await executeUpdateNote(props.note, { title })
	activeNote.value = updated
}

async function onContentChange(event: Event) {
	const content = (event.target as HTMLTextAreaElement).value
	const updated = await executeUpdateNote(props.note, { content })
	activeNote.value = updated
}
</script>

<template>
	<div class="flex flex-col max-w-220 mx-auto h-full p-6 gap-4">
		<input
			class="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground  pb-2"
			placeholder="Название заметки"
			:value="props.note.title"
			@change="onTitleChange"
		>

		<textarea
			class="flex-1 w-full bg-transparent text-base outline-none resize-none placeholder:text-muted-foreground"
			placeholder="Начните писать..."
			:value="props.note.content"
			@change="onContentChange"
		/>
	</div>
</template>
