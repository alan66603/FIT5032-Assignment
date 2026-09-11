<script setup>
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then(() => {
      console.log('Firebase Register Successful!')
      router.push('/FireLogin')
    })
    .catch((error) => {
      console.log(error.code)
    })
}
</script>

<template>
  <div class="container py-5" style="max-width: 400px">
    <h1>Create an Account</h1>

    <div class="mb-3">
      <input v-model="email" type="text" class="form-control" placeholder="Email" />
    </div>
    <div class="mb-3">
      <input v-model="password" type="password" class="form-control" placeholder="Password" />
    </div>
    <button type="button" class="btn btn-dark w-100 rounded-pill py-2 mb-3" @click="register">
      Save to Firebase
    </button>

    <p class="text-center small text-muted">
      Already have an account? <router-link to="/FireLogin">Sign in</router-link>
    </p>
  </div>
</template>
