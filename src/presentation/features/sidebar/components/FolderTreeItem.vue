<script setup lang="ts">
import type { Folder } from '@domain/folder/folder'
import { FolderItem, useFolders } from '@presentation/features/folder'
import { NoteListItem, useNotes } from '@presentation/features/notes'
import { Input } from '@presentation/shared/ui/input'
import { computed, nextTick, ref } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'
import { useSidePanel } from '../composables/useSidePanel'
import DragDropZone from './DragDropZone.vue'

const props = withDefaults(defineProps<{
	folder: Folder
	depth?: number
}>(), { depth: 0 })

const { getChildFolders, createFolder } = useFolders()
const { notes } = useNotes()
const { isExpanded, toggleFolder } = useSidePanel()
const { isItemBeingDragged, startDrag, endDrag } = useDragDrop()

const expanded = computed(() => isExpanded(props.folder.id))
const childFolders = computed(() => getChildFolders(props.folder.id))
const folderNotes = computed(() => notes.value.filter(n => n.folderId === props.folder.id))
const childIndentStyle = computed(() => ({ paddingLeft: `${(props.depth + 1) * 12 + 8}px` }))

const isCreatingChild = ref(false)
const newChildTitle = ref('')
const newChildInputRef = ref<HTMLInputElement | null>(null)

async function startCreateChild(): Promise<void> {
	if (!expanded.value)
		toggleFolder(props.folder.id)

	newChildTitle.value = ''
	isCreatingChild.value = true

	await nextTick()
	newChildInputRef.value?.focus()
}

async function confirmCreateChild(): Promise<void> {
	const title = newChildTitle.value.trim()
	if (title)
		await createFolder(title, props.folder.id)
	isCreatingChild.value = false
	newChildTitle.value = ''
}

function cancelCreateChild(): void {
	isCreatingChild.value = false
	newChildTitle.value = ''
}
</script>

<template>
	<li class="list-none">
		<DragDropZone v-slot="{ isHighlighted }" :folder-id="folder.id">
			<FolderItem
				:folder="folder"
				:depth="depth"
				:is-expanded="expanded"
				:is-dragging="isItemBeingDragged(folder.id)"
				:is-drop-highlighted="isHighlighted"
				@toggle="toggleFolder(folder.id)"
				@create-child-start="startCreateChild"
				@dragstart.stop="startDrag($event, { type: 'folder', id: folder.id })"
				@dragend="endDrag"
			/>

			<ul v-if="expanded">
				<FolderTreeItem
					v-for="child in childFolders"
					:key="child.id"
					:folder="child"
					:depth="depth + 1"
				/>

				<li v-if="isCreatingChild" class="list-none" :style="childIndentStyle">
					<Input
						ref="newChildInputRef"
						v-model="newChildTitle"
						class="h-7 text-sm my-0.5"
						placeholder="Название папки..."
						@keydown.enter="confirmCreateChild"
						@keydown.escape="cancelCreateChild"
						@blur="cancelCreateChild"
					/>
				</li>

				<NoteListItem
					v-for="note in folderNotes"
					:key="note.id"
					:note="note"
					:depth="depth + 1"
				/>
			</ul>
		</DragDropZone>
	</li>
</template>
