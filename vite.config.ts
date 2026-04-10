import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	server: {
		port: 8848,
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
			'@application': fileURLToPath(new URL('./src/application', import.meta.url)),
			'@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
			'@presentation': fileURLToPath(new URL('./src/presentation', import.meta.url)),
			'@workers': fileURLToPath(new URL('./src/workers', import.meta.url)),
			'@shared-kernel': fileURLToPath(new URL('./src/shared-kernel', import.meta.url)),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
						return 'vue-vendor'
					}
					if (id.includes('node_modules/reka-ui') || id.includes('node_modules/radix-vue')) {
						return 'ui-vendor'
					}
					if (id.includes('node_modules/lucide-vue-next')) {
						return 'icons'
					}
				},
			},
		},
	},
})
