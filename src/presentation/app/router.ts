import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'

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
