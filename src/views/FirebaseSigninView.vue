<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const signin = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      console.log('Firebase Sign in Successful!')
      console.log(auth.currentUser) // To check the current user signed in
      router.push('/')
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
    <button type="button" class="btn btn-dark w-100 rounded-pill py-2" @click="signin">
      Sign in via Firebase
    </button>
  </div>
</template>
