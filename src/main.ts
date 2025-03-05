import './assets/main.css'

import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import vuetify from '@/plugins/vuetify.ts'
import { store, key } from './store'

const app = createApp(App)

app.use(router).use(vuetify).use(store, key).mount('#app')
