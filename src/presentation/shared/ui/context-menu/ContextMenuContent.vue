<script setup lang="ts">
import type { ContextMenuContentEmits, ContextMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuContent, ContextMenuPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/presentation/shared/lib/utils'

interface Props extends ContextMenuContentProps {
	class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emits = defineEmits<ContextMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
	<ContextMenuPortal>
		<ContextMenuContent
			data-slot="context-menu-content"
			:class="cn(
				'bg-popover text-popover-foreground z-50 min-w-32 overflow-hidden rounded-md border border-border p-1 shadow-2xl',
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				props.class,
			)"
			v-bind="forwarded"
		>
			<slot />
		</ContextMenuContent>
	</ContextMenuPortal>
</template>
