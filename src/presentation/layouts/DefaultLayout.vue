<script setup lang="ts">
import { Icon } from '@presentation/shared/ui/icon'
import { Button } from '@/presentation/shared/ui/button'
</script>

<template>
	<div class="w-screen h-screen flex">
		<div class="w-50">
			<Button
				size="icon"
			>
				<Icon name="PanelLeft" />
			</Button>
		</div>
		<div class="flex flex-col">
			<header>header</header>
			<slot />
		</div>
	</div>
</template>
