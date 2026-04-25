<script setup lang="ts">
import type { UUID } from '@shared-kernel'
import { computed, ref } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'

const props = defineProps<{ folderId: UUID | null }>()

const { isDragging, isValidDropTarget, dropOnFolder } = useDragDrop()

const isOver = ref(false)

function onDragOver(event: DragEvent): void {
	event.preventDefault()
	if (event.dataTransfer)
		event.dataTransfer.dropEffect = 'move'
	isOver.value = true
}

function onDragLeave(event: DragEvent): void {
	const zone = event.currentTarget as HTMLElement
	if (!zone.contains(event.relatedTarget as Node))
		isOver.value = false
}

function onDrop(event: DragEvent): void {
	event.preventDefault()
	isOver.value = false
	dropOnFolder(props.folderId)
}

const isHighlighted = computed(() =>
	isOver.value && isDragging.value && isValidDropTarget(props.folderId),
)
</script>

<template>
	<div
		@dragover="onDragOver"
		@dragleave="onDragLeave"
		@drop="onDrop"
	>
		<slot :is-highlighted="isHighlighted" />
	</div>
</template>
