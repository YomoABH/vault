<script setup lang="ts">
import DefaultLayout from '@presentation/layouts/DefaultLayout.vue'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'

const route = useRoute()
const layout = computed(() => route.meta.layout ?? DefaultLayout)
</script>

<template>
	<component :is="layout">
		<RouterView />
	</component>
	<Toaster position="bottom-right" theme="dark" rich-colors />
</template>
