import './assets/main.css'

import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import vuetify from '@/plugins/vuetify.ts'
import { Toast, options } from '@/plugins/toastification'
import { store, key } from './store'

const app = createApp(App)

app.use(router).use(vuetify).use(store, key).use(Toast, options).mount('#app')
