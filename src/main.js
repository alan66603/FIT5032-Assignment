import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'

// PrimeVue (Week 4 lab) gives us the DataTable with sorting, filtering and paging.
const app = createApp(App)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    // Always use the light theme. By default PrimeVue follows the computer's
    // dark mode, which made the tables dark while the rest of the site is light.
    options: { darkModeSelector: false },
  },
})
app.use(router)
app.mount('#app')
