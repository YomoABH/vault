<script setup lang="ts">
import { useFolders } from '@presentation/features/folder'
import { NoteListItem, useNotes } from '@presentation/features/notes'
import { computed } from 'vue'

import DragDropZone from './DragDropZone.vue'
import FolderTreeItem from './FolderTreeItem.vue'

const { folders } = useFolders()
const { notes } = useNotes()

const rootFolders = computed(() => folders.value.filter(f => f.parentId === null))
const rootNotes = computed(() => notes.value.filter(n => n.folderId === null))
const isEmpty = computed(() => rootFolders.value.length === 0 && rootNotes.value.length === 0)
</script>

<template>
	<div class="flex-1 overflow-y-auto py-1">
		<DragDropZone :folder-id="null" class="min-h-full">
			<template v-if="!isEmpty">
				<ul>
					<FolderTreeItem
						v-for="folder in rootFolders"
						:key="folder.id"
						:folder="folder"
						:depth="0"
					/>
				</ul>

				<ul>
					<NoteListItem
						v-for="note in rootNotes"
						:key="note.id"
						:note="note"
						:depth="0"
					/>
				</ul>
			</template>

			<div
				v-else
				class="h-full flex items-center justify-center text-sm font-semibold text-muted-foreground px-2 py-4"
			>
				Заметок пока нет
			</div>
		</DragDropZone>
	</div>
</template>
