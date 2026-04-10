<script setup>
import { computed } from 'vue'
import { iconRegistry } from './registry'

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
	size: Number,
	color: String,
	strokeWidth: Number,
	defaultClass: String,
})

const icon = computed(() => iconRegistry[props.name])
</script>

<template>
	<component
		:is="icon"
		:size="size"
		:color="color"
		:stroke-width="strokeWidth" :default-class="defaultClass"
	/>
</template>
