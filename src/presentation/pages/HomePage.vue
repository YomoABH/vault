<script setup lang="ts">
import { NoteEditor } from '@presentation/features/editor'
import { useNotes, WelcomeComponent } from '@presentation/features/notes'

const { activeNote } = useNotes()
</script>

<template>
	<div class="grow shrink">
		<WelcomeComponent v-if="!activeNote" />
		<NoteEditor v-else :note="activeNote" />
	</div>
</template>
