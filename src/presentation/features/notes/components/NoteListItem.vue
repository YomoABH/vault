<script setup lang="ts">
import type { Note } from '@/domain/note/note'
import { useDragDrop } from '@presentation/features/sidebar/composables/useDragDrop'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/presentation/shared/ui/context-menu'
import Icon from '@/presentation/shared/ui/icon/Icon.vue'
import { useNotes } from '../composables/useNotes'

const props = withDefaults(defineProps<{
	note: Note
	depth?: number
}>(), { depth: 0 })

const { activeNote, setActiveNote, deleteNote, duplicateNote } = useNotes()
const { isItemBeingDragged, startDrag, endDrag } = useDragDrop()

const contextActions = [
	{
		id: 'duplicate',
		icon: 'Copy',
		label: 'Дублировать',
		callback: () => duplicateNote(props.note),
	},
	{
		id: 'delete',
		icon: 'Trash2',
		label: 'Удалить',
		callback: () => deleteNote(props.note.id),
		class: 'text-destructive focus:text-destructive',
	},
]
</script>

<template>
	<ContextMenu>
		<ContextMenuTrigger as-child>
			<button
				class="w-full text-left py-1.5 pr-2 rounded-xs text-sm truncate transition-colors cursor-pointer"
				:class="[
					activeNote?.id === props.note.id ? 'bg-accent/50 text-white font-medium' : 'text-foreground hover:bg-accent/50',
					isItemBeingDragged(note.id) && 'opacity-40',
				]"
				:style="{ paddingLeft: `${props.depth * 12 + 20}px` }"
				draggable="true"
				@dragstart.stop="startDrag($event, { type: 'note', id: note.id })"
				@dragend="endDrag"
				@click="setActiveNote(props.note)"
			>
				{{ props.note.title || 'Без названия' }}
			</button>
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
