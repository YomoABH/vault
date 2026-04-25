<script setup lang="ts">
// #region --- import ---
import type { Folder } from '@domain/folder/folder'
import { useFolders } from '@presentation/features/folder'
import { NoteListItem, useNotes } from '@presentation/features/notes'
import { useUIState } from '@presentation/shared/composables/useUIState'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@presentation/shared/ui/context-menu'
import Icon from '@presentation/shared/ui/icon/Icon.vue'
import { Input } from '@presentation/shared/ui/input'
import { computed, nextTick, ref } from 'vue'
import { useDragDrop } from '../composables/useDragDrop'
import { useSidePanel } from '../composables/useSidePanel'
import DragDropZone from './DragDropZone.vue'
// #endregion

// #region --- props ---
const props = withDefaults(defineProps<{
	folder: Folder
	depth?: number
}>(), { depth: 0 })
// #endregion

// #region --- state/bl ---
const { getChildFolders, deleteFolder, editFolder, createFolder } = useFolders()
const { notes, createNote } = useNotes()
const { isExpanded, toggleFolder } = useSidePanel()
const { activeFolderId } = useUIState()
const { isItemBeingDragged, startDrag, endDrag } = useDragDrop()

const expanded = computed(() => isExpanded(props.folder.id))
const childFolders = computed(() => getChildFolders(props.folder.id))
const folderNotes = computed(() => notes.value.filter(n => n.folderId === props.folder.id))
const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 12 + 8}px` }))
const childIndentStyle = computed(() => ({ paddingLeft: `${(props.depth + 1) * 12 + 8}px` }))

// rename
const isRenaming = ref(false)
const renameTitle = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

async function startRename(): Promise<void> {
	renameTitle.value = props.folder.title
	isRenaming.value = true
	await nextTick()
	renameInputRef.value?.focus()
	renameInputRef.value?.select()
}

async function confirmRename(): Promise<void> {
	const title = renameTitle.value.trim()
	if (title && title !== props.folder.title)
		await editFolder(props.folder, { title })
	isRenaming.value = false
}

function cancelRename(): void {
	isRenaming.value = false
}

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

const contextActions = computed(() => [
	{
		id: 'createNote',
		icon: 'FilePlusCorner',
		label: 'Новая заметка',
		callback: () => createNote(props.folder.id),
	},
	{
		id: 'createChild',
		icon: 'FolderPlus',
		label: 'Новая подпапка',
		callback: startCreateChild,
	},
	{
		id: 'rename',
		icon: 'Pencil',
		label: 'Переименовать',
		callback: startRename,
	},
	{
		id: 'delete',
		icon: 'Trash2',
		label: 'Удалить',
		callback: () => deleteFolder(props.folder.id),
		class: 'text-destructive focus:text-destructive',
	},
])
// #endregion
</script>

<template>
	<li class="list-none" @click.stop="toggleFolder(folder.id)">
		<DragDropZone v-slot="{ isHighlighted }" :folder-id="folder.id">
			<ContextMenu>
				<ContextMenuTrigger as-child>
					<div
						class="flex items-center gap-1 h-7 pr-2 rounded-xs cursor-pointer select-none hover:bg-accent/50 transition-colors"
						:class="{ 'opacity-40': isItemBeingDragged(folder.id), 'ring-1 ring-inset ring-primary/50 bg-primary/5': isHighlighted }"
						:style="indentStyle"
						draggable="true"
						@dragstart.stop="startDrag($event, { type: 'folder', id: folder.id })"
						@dragend="endDrag"
						@click="activeFolderId = folder.id"
					>
						<Icon
							name="ChevronRight"
							:size="14"
							class="transition-transform duration-150"
							:class="{ 'rotate-90': expanded }"
						/>

						<template v-if="isRenaming">
							<Input
								ref="renameInputRef"
								v-model="renameTitle"
								class="h-5 text-sm px-1 py-0"
								@keydown.enter="confirmRename"
								@keydown.escape="cancelRename"
								@blur="confirmRename"
								@click.stop
							/>
						</template>
						<span v-else class="truncate text-sm">{{ folder.title }}</span>
					</div>
				</ContextMenuTrigger>

				<ContextMenuContent>
					<ContextMenuItem
						v-for="action in contextActions"
						:key="action.id"
						class="cursor-pointer"
						:class="action.class"
						@select="action.callback"
					>
						<Icon :size="16" :name="action.icon" />
						<span>{{ action.label }}</span>
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>

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
