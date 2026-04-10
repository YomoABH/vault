<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ContextMenuLabel } from 'reka-ui'
import { cn } from '@/presentation/shared/lib/utils'

interface Props extends ContextMenuLabelProps {
	class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
	<ContextMenuLabel
		data-slot="context-menu-label"
		:class="cn('px-2 py-1.5 text-sm font-semibold text-foreground', props.class)"
		v-bind="props"
	>
		<slot />
	</ContextMenuLabel>
</template>
