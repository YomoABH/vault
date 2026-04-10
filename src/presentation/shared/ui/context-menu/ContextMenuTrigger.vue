<script setup lang="ts">
import type { ContextMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ContextMenuTrigger } from 'reka-ui'

interface Props extends ContextMenuTriggerProps {
	class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
	<ContextMenuTrigger data-slot="context-menu-trigger" v-bind="props">
		<slot />
	</ContextMenuTrigger>
</template>
