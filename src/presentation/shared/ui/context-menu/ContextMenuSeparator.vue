<script setup lang="ts">
import type { ContextMenuSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ContextMenuSeparator } from 'reka-ui'
import { cn } from '@/presentation/shared/lib/utils'

interface Props extends ContextMenuSeparatorProps {
	class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
	<ContextMenuSeparator
		data-slot="context-menu-separator"
		:class="cn('bg-border -mx-1 my-1 h-px', props.class)"
		v-bind="props"
	/>
</template>
