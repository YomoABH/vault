<script setup lang="ts">
import type { ContextMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuItem } from 'reka-ui'
import { cn } from '@/presentation/shared/lib/utils'

interface Props extends ContextMenuItemProps {
	class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
	<ContextMenuItem
		data-slot="context-menu-item"
		:class="cn(
			'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none',
			'[&_svg]:pointer-events-none [&_svg]:shrink-0',
			props.class,
		)"
		v-bind="delegatedProps"
	>
		<slot />
	</ContextMenuItem>
</template>
