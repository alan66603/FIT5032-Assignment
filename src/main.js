import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { startAuthListener } from './auth'

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDAkfyfUI24nXMBT9wFe44BMd3jpXWE7AE',
  authDomain: 'fit5032-ass1-16223.firebaseapp.com',
  projectId: 'fit5032-ass1-16223',
  storageBucket: 'fit5032-ass1-16223.firebasestorage.app',
  messagingSenderId: '85325607184',
  appId: '1:85325607184:web:b652f5aed0a33a1f4fb595',
}

// Initialize Firebase before the Vue app so getAuth() can find it.
initializeApp(firebaseConfig)
startAuthListener()

createApp(App).use(router).mount('#app')
