import { createApp } from 'vue'
import App from './presentation/app/App.vue'
import router from './presentation/app/router'
import './style.css'

createApp(App).use(router).mount('#app')

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js')
}
