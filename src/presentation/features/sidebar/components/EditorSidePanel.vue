<script setup lang="ts">
// #region --- import ---
import { useFolders } from '@presentation/features/folder'
import { useNotes } from '@presentation/features/notes'
import { Button } from '@presentation/shared/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@presentation/shared/ui/context-menu'
import Icon from '@presentation/shared/ui/icon/Icon.vue'
import { Input } from '@presentation/shared/ui/input'
import { nextTick, ref } from 'vue'
import FolderNoteTree from './FolderNoteTree.vue'
// #endregion

// #region --- emits ---
defineEmits<{ close: [] }>()
// #endregion

// #region --- state/bl ---
const { createFolder } = useFolders()
const { createNote } = useNotes()

const isCreatingFolder = ref(false)
const newFolderTitle = ref('')
const newFolderInputRef = ref<HTMLInputElement | null>(null)

async function startCreateFolder(): Promise<void> {
	newFolderTitle.value = ''
	isCreatingFolder.value = true
	await nextTick()
	newFolderInputRef.value?.focus()
}

async function confirmCreateFolder(): Promise<void> {
	const title = newFolderTitle.value.trim()
	if (title)
		await createFolder(title, null)
	isCreatingFolder.value = false
	newFolderTitle.value = ''
}

function cancelCreateFolder(): void {
	isCreatingFolder.value = false
	newFolderTitle.value = ''
}

const actions = [
	{
		id: 'createNote',
		icon: 'FilePlusCorner',
		tooltip: 'Новая заметка',
		callback: () => createNote(null),
	},
	{
		id: 'createFolder',
		icon: 'FolderPlus',
		tooltip: 'Новая папка',
		callback: startCreateFolder,
	},
] as const
// #endregion
</script>

<template>
	<aside class="flex flex-col w-85 h-full border-r border-border bg-sidebar shrink-0 overflow-hidden">
		<div class="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
			<span class="text-base font-semibold">Заметки</span>
		</div>

		<ul class="flex gap-1 p-1 shrink-0">
			<li v-for="action in actions" :key="action.id" class="cursor-pointer">
				<Button size="icon-sm" variant="ghost" :title="action.tooltip" @click.stop="action.callback">
					<Icon :name="action.icon" :size="28" />
				</Button>
			</li>
		</ul>

		<div v-if="isCreatingFolder" class="px-2 pb-1 shrink-0">
			<Input
				ref="newFolderInputRef"
				v-model="newFolderTitle"
				class="h-7 text-sm"
				placeholder="Название папки..."
				@keydown.enter="confirmCreateFolder"
				@keydown.escape="cancelCreateFolder"
				@blur="cancelCreateFolder"
			/>
		</div>

		<ContextMenu>
			<ContextMenuTrigger as-child>
				<FolderNoteTree class="p-3" />
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem v-for="action in actions" :key="action.id" class="cursor-pointer" @select="action.callback">
					<Icon :size="16" :name="action.icon" />
					<span>{{ action.tooltip }}</span>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	</aside>
</template>
