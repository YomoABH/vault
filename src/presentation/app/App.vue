<script setup lang="ts">
import DefaultLayout from '@presentation/layouts/DefaultLayout.vue'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const layout = computed(() => route.meta.layout ?? DefaultLayout)
</script>

<template>
	<component :is="layout">
		<RouterView />
	</component>
</template>
