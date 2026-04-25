<script setup lang="ts">
import type { Folder } from '@domain/folder/folder'
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
import { useFolders } from '../composables/useFolders'
import { useNotes } from '../../notes'

const props = withDefaults(defineProps<{
	folder: Folder
	depth?: number
	isExpanded: boolean
	isDragging: boolean
	isDropHighlighted: boolean
}>(), { depth: 0 })

const emit = defineEmits<{
	toggle: []
	createChildStart: []
}>()

const { editFolder, deleteFolder } = useFolders()
const { createNote } = useNotes()
const { activeFolderId } = useUIState()

const indentStyle = computed(() => ({ paddingLeft: `${props.depth * 12 + 8}px` }))

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
		callback: () => emit('createChildStart'),
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
</script>

<template>
	<ContextMenu>
		<ContextMenuTrigger as-child>
			<div
				class="flex items-center gap-1 h-7 pr-2 rounded-xs cursor-pointer select-none hover:bg-accent/50 transition-colors"
				:class="{ 'opacity-40': isDragging, 'ring-1 ring-inset ring-primary/50 bg-primary/5': isDropHighlighted }"
				:style="indentStyle"
				draggable="true"
				@click.stop="activeFolderId = folder.id; emit('toggle')"
			>
				<Icon
					name="ChevronRight"
					:size="14"
					class="transition-transform duration-150"
					:class="{ 'rotate-90': isExpanded }"
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
</template>
