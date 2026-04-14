<script setup lang="ts">
import type { Note } from '@/domain/note/note'
import { useNotes } from '@presentation/features/notes/composables/useNotes'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
	note: Note
}>()

const { activeNote, updateNote } = useNotes()

const onTitleChange = useDebounceFn(async (event: Event) => {
	const title = (event.target as HTMLInputElement).value
	const updated = await updateNote(props.note, { title })
	activeNote.value = updated
}, 500)

const onContentChange = useDebounceFn(async (event: Event) => {
	const content = (event.target as HTMLTextAreaElement).value
	const updated = await updateNote(props.note, { content })
	activeNote.value = updated
}, 500)
</script>

<template>
	<div class="flex flex-col max-w-220 mx-auto h-full p-6 gap-4">
		<input
			class="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground  pb-2"
			placeholder="Название заметки"
			:value="props.note.title"
			@input="onTitleChange"
		>

		<textarea
			class="flex-1 w-full bg-transparent text-base outline-none resize-none placeholder:text-muted-foreground"
			placeholder="Начните писать..."
			:value="props.note.content"
			@input="onContentChange"
		/>
	</div>
</template>
