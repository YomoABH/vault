<script setup lang="ts">
// #region --- import ---
import { Button } from '@/presentation/shared/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/presentation/shared/ui/context-menu'
import Icon from '@/presentation/shared/ui/icon/Icon.vue'

import { useNotes } from '../composables/useNotes'
import NoteListItem from './NoteListItem.vue'
// #endregion

// #region --- state/bl ---
defineEmits<{
	close: []
}>()

const { notes, createNote } = useNotes()

const actions = [
	{
		id: 'createNote',
		icon: 'FilePlusCorner',
		callback: createNote,
	},
	{
		id: 'createFolder',
		icon: 'FolderPlus',
		callback: () => {},
	},
] as const
</script>
// #endregion

<template>
	<aside class="flex flex-col w-64 h-full border-r border-border bg-sidebar shrink-0 overflow-hidden">
		<div class="flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
			<span class="text-base font-semibold">Заметки</span>
		</div>

		<ul class="flex gap-1 p-1">
			<li v-for="action in actions" :key="action.id" class="cursor-pointer">
				<Button size="icon-sm" variant="ghost" @click.stop="action.callback">
					<Icon :name="action.icon" :size="28" />
				</Button>
			</li>
		</ul>

		<ContextMenu>
			<ContextMenuTrigger as-child>
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
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem class="cursor-pointer" @select="createNote">
					<Icon size="16" name="FilePlusCorner" />
					<span>Новая заметка</span>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	</aside>
</template>
