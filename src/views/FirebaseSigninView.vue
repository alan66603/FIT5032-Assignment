<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { DASHBOARD_PATHS } from '@/auth'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()
const db = getFirestore()

const signin = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((data) => {
      console.log('Firebase Sign in Successful!')
      console.log(auth.currentUser) // To check the current user signed in
      return getDoc(doc(db, 'users', data.user.uid))
    })
    .then((snap) => {
      const role = snap.exists() ? snap.data().role : null
      router.push(DASHBOARD_PATHS[role] ?? '/')
    })
    .catch((error) => {
      console.log(error.code)
    })
}
</script>

<template>
  <div class="container py-5" style="max-width: 400px">
    <h1>Sign in</h1>

    <div class="mb-3">
      <input v-model="email" type="text" class="form-control" placeholder="Email" />
    </div>
    <div class="mb-3">
      <input v-model="password" type="password" class="form-control" placeholder="Password" />
    </div>
    <button type="button" class="btn btn-dark w-100 rounded-pill py-2 mb-3" @click="signin">
      Sign in via Firebase
    </button>

    <p class="text-center small text-muted">
      New here? <router-link to="/FireRegister">Create an account</router-link>
    </p>
  </div>
</template>
