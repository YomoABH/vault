<script setup lang="ts">
// #region --- import ---
import type { Note } from '@/domain/note/note'
import { useNotes } from '@presentation/features/notes/composables/useNotes'
import { useTimeoutFn } from '@vueuse/core'
import { onUnmounted, ref, watch } from 'vue'
// #endregion

// #region ---state---
const props = defineProps<{
	note: Note
}>()

const { activeNote, updateNote } = useNotes()

const title = ref(props.note.title)
const content = ref(props.note.content)
let isMounted = true

const { start: scheduleSave } = useTimeoutFn(async () => {
	const updated = await updateNote(props.note, {
		title: title.value,
		content: content.value,
	})
	if (!isMounted)
		return
	if (updated !== null) {
		activeNote.value = updated
	}
}, 500, { immediate: false })

function onTitleChange(event: Event) {
	title.value = (event.target as HTMLInputElement).value
	scheduleSave()
}

function onContentChange(event: Event) {
	content.value = (event.target as HTMLTextAreaElement).value
	scheduleSave()
}

watch(
	() => props.note.id,
	() => {
		title.value = props.note.title
		content.value = props.note.content
	},
)

onUnmounted(() => {
	isMounted = false
})
// #endregion
</script>

<template>
	<div class="flex flex-col max-w-220 mx-auto h-full p-6 gap-4">
		<div class="flex items-start gap-2">
			<input
				class="flex-1 bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground pb-2"
				placeholder="Название заметки"
				:value="props.note.title"
				@input="onTitleChange"
			>
		</div>

		<textarea
			class="flex-1 w-full bg-transparent text-base outline-none resize-none placeholder:text-muted-foreground"
			placeholder="Начните писать..."
			:value="props.note.content"
			@input="onContentChange"
		/>
	</div>
</template>
