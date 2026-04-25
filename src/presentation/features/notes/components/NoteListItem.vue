<script setup lang="ts">
import type { Note } from '@/domain/note/note'
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
</script>

<template>
	<ContextMenu>
		<ContextMenuTrigger as-child>
			<button
				class="w-full text-left py-1.5 pr-2 rounded-xs text-sm truncate transition-colors cursor-pointer"
				:class="activeNote?.id === props.note.id
					? 'bg-accent/50 text-white font-medium'
					: 'text-foreground hover:bg-accent/50'"
				:style="{ paddingLeft: `${props.depth * 12 + 20}px` }"
				@click="setActiveNote(props.note)"
			>
				{{ props.note.title || 'Без названия' }}
			</button>
		</ContextMenuTrigger>

		<ContextMenuContent>
			<ContextMenuItem class="cursor-pointer" @select="duplicateNote(props.note)">
				<Icon size="16" name="Copy" />
				<span>Дублировать</span>
			</ContextMenuItem>

			<ContextMenuItem class="cursor-pointer text-destructive focus:text-destructive" @select="deleteNote(props.note.id)">
				<Icon size="16" name="Trash2" />
				<span>Удалить</span>
			</ContextMenuItem>
		</ContextMenuContent>
	</ContextMenu>
</template>
