<script setup lang="ts">
import { useFolders } from '@presentation/features/folder'
import { useNotes } from '@presentation/features/notes/composables/useNotes'
import DefaultLayout from '@presentation/layouts/DefaultLayout.vue'
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'

const route = useRoute()
const layout = computed(() => route.meta.layout ?? DefaultLayout)

const { loadNotes } = useNotes()
const { loadFolders } = useFolders()
onMounted(() => Promise.all([loadNotes(), loadFolders()]))
</script>

<template>
	<component :is="layout">
		<RouterView />
	</component>

	<Teleport to="#modals">
		<Toaster position="bottom-right" theme="dark" rich-colors />
	</Teleport>
</template>
