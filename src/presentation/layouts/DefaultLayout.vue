<script setup lang="ts">
// #region --- import ---
import { NotesPanel } from '@presentation/features/notes'
import Sidebar from '@presentation/shared/ui/sidebar/Sidebar.vue'
import SidebarContent from '@presentation/shared/ui/sidebar/SidebarContent.vue'
import SidebarFooter from '@presentation/shared/ui/sidebar/SidebarFooter.vue'
import SidebarGroup from '@presentation/shared/ui/sidebar/SidebarGroup.vue'
import SidebarHeader from '@presentation/shared/ui/sidebar/SidebarHeader.vue'
import SidebarInset from '@presentation/shared/ui/sidebar/SidebarInset.vue'
import SidebarMenuItem from '@presentation/shared/ui/sidebar/SidebarMenuItem.vue'
import SidebarProvider from '@presentation/shared/ui/sidebar/SidebarProvider.vue'
import { ref } from 'vue'
import Icon from '../shared/ui/icon/Icon.vue'
import SidebarMenuButton from '../shared/ui/sidebar/SidebarMenuButton.vue'
// #endregion

const isNotesPanelOpen = ref(false)

function toggleNotesPanel() {
	isNotesPanelOpen.value = !isNotesPanelOpen.value
}
</script>

<template>
	<SidebarProvider>
		<Sidebar class=" border-r-border" side="left" collapsible="icon">
			<SidebarHeader>
				<SidebarMenuItem class="flex items-center justify-center">
					<SidebarMenuButton
						@click="toggleNotesPanel"
					>
						<Icon name="PanelLeft" />
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenuItem class="flex items-center justify-center">
						<SidebarMenuButton tooltip="Граф">
							<Icon name="VectorSquare" />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter />
		</Sidebar>

		<SidebarInset class="flex flex-row" :style="{ marginLeft: 'var(--sidebar-width-icon)' }">
			<Transition name="notes-panel">
				<NotesPanel v-if="isNotesPanelOpen" @close="isNotesPanelOpen = false" />
			</Transition>

			<div class="w-full h-full overflow-hidden">
				<header class="flex h-12 items-center gap-2 px-4 border-b border-border">
					<SidebarMenuItem class="flex gap-1 items-center">
						<span>V</span>
						<span>A</span>
						<Icon name="Vault" :size="18" />
						<span>L</span>
						<span>T</span>
					</SidebarMenuItem>
				</header>
				<slot />
			</div>
		</SidebarInset>
	</SidebarProvider>
</template>

<style scoped>
.notes-panel-enter-active,
.notes-panel-leave-active {
	transition: width 0.2s ease, opacity 0.2s ease;
}

.notes-panel-enter-from,
.notes-panel-leave-to {
	width: 0;
	opacity: 0;
}
</style>
