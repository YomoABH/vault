import type { Component } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
	interface RouteMeta {
		layout?: Component
	}
}

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: () => import('@presentation/pages/HomePage.vue'),
		},
	],
})

export default router
