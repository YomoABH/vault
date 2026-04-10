<script setup lang="ts">
// #region --- import ---
import Sidebar from '@presentation/shared/ui/sidebar/Sidebar.vue'
import SidebarContent from '@presentation/shared/ui/sidebar/SidebarContent.vue'
import SidebarFooter from '@presentation/shared/ui/sidebar/SidebarFooter.vue'
import SidebarGroup from '@presentation/shared/ui/sidebar/SidebarGroup.vue'
import SidebarHeader from '@presentation/shared/ui/sidebar/SidebarHeader.vue'
import SidebarInset from '@presentation/shared/ui/sidebar/SidebarInset.vue'
import SidebarMenuItem from '@presentation/shared/ui/sidebar/SidebarMenuItem.vue'
import SidebarProvider from '@presentation/shared/ui/sidebar/SidebarProvider.vue'
import Icon from '../shared/ui/icon/Icon.vue'
import SidebarMenuButton from '../shared/ui/sidebar/SidebarMenuButton.vue'
// #endregion
</script>

<template>
	<SidebarProvider>
		<Sidebar side="left" collapsible="icon">
			<SidebarHeader>
				<SidebarMenuItem class="flex flex-col justify-center items-center">
					<span>V</span>
					<span>A</span>
					<Icon name="Vault" size="18" />
					<span>L</span>
					<span>T</span>
				</SidebarMenuItem>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarMenuItem class="flex items-center justify-center">
						<SidebarMenuButton tooltip="Заметки">
							<Icon name="NotebookText" />
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem class="flex items-center justify-center">
						<SidebarMenuButton tooltip="Граф">
							<Icon name="VectorSquare" />
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter />
		</Sidebar>

		<SidebarInset class="ml-7.5">
			<header class="flex h-12 items-center gap-2 px-4 border-b border-border">
				header
			</header>
			<slot />
		</SidebarInset>
	</SidebarProvider>
</template>
