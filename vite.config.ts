import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
			'@presentation': fileURLToPath(new URL('./src/presentation', import.meta.url)),
			'@shared-kernel': fileURLToPath(new URL('./src/shared-kernel', import.meta.url)),
		},
	},
})
