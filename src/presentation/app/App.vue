<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import DefaultLayout from '@presentation/layouts/DefaultLayout.vue'

const route = useRoute()
const layout = computed(() => route.meta.layout ?? DefaultLayout)
</script>

<template>
	<component :is="layout">
		<RouterView />
	</component>
</template>
