<script setup lang="ts">
import type { Note } from '@/domain/note/note'
import { useNotes } from '@presentation/features/notes/composables/useNotes'
import { useDebounceFn } from '@vueuse/core'
import { ref, watch } from 'vue'

const props = defineProps<{
	note: Note
}>()

const { activeNote, updateNote } = useNotes()

const title = ref(props.note.title)
const content = ref(props.note.content)

watch(
	() => props.note.id,
	() => {
		title.value = props.note.title
		content.value = props.note.content
	},
)

const saveNote = useDebounceFn(async () => {
	const updated = await updateNote(props.note, {
		title: title.value,
		content: content.value,
	})
	activeNote.value = updated
}, 500)

function onTitleChange(event: Event) {
	title.value = (event.target as HTMLInputElement).value
	saveNote()
}

function onContentChange(event: Event) {
	content.value = (event.target as HTMLTextAreaElement).value
	saveNote()
}
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
