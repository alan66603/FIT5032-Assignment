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

const errors = ref({
  email: null,
  password: null,
})

const loginError = ref(null)
const isSubmitting = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Email validation: required, then format check via regex.
 * @param blur: boolean - if true, show the error message.
 */
const validateEmail = (blur) => {
  const value = email.value.trim()

  if (value.length === 0) {
    if (blur) errors.value.email = 'Email is required.'
  } else if (!emailPattern.test(value)) {
    if (blur) errors.value.email = 'Please enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

/**
 * Password validation: required, then minimum length check.
 * @param blur: boolean - if true, show the error message.
 */
const validatePassword = (blur) => {
  const minLength = 6

  if (password.value.length === 0) {
    if (blur) errors.value.password = 'Password is required.'
  } else if (password.value.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters.`
  } else {
    errors.value.password = null
  }
}

const signin = async () => {
  validateEmail(true)
  validatePassword(true)
  loginError.value = null

  const hasError = Object.values(errors.value).some((message) => message !== null)
  if (hasError) return

  isSubmitting.value = true
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    console.log('Firebase Sign in Successful!')
    console.log(auth.currentUser) // To check the current user signed in

    // Read the role saved at registration to pick the right dashboard.
    const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid))
    const role = docSnap.exists() ? docSnap.data().role : null
    router.push(DASHBOARD_PATHS[role] ?? '/')
  } catch (error) {
    console.error('Error signing in:', error)
    // Same message for wrong password and unknown email so the form
    // does not reveal which accounts exist.
    loginError.value = 'Incorrect email or password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 400px">
    <h1>Sign in</h1>

    <form @submit.prevent="signin" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input
          v-model="email"
          type="email"
          class="form-control"
          :class="{ 'is-invalid': errors.email }"
          @blur="validateEmail(true)"
          @input="validateEmail(false)"
          placeholder="priya.n@example.com"
        />
        <div class="invalid-feedback">{{ errors.email }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input
          v-model="password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': errors.password }"
          @blur="validatePassword(true)"
          @input="validatePassword(false)"
          placeholder="••••••••"
        />
        <div class="invalid-feedback">{{ errors.password }}</div>
      </div>

      <div v-if="loginError" class="alert alert-danger py-2" role="alert">{{ loginError }}</div>

      <button type="submit" class="btn btn-dark w-100 rounded-pill py-2 mb-3" :disabled="isSubmitting">
        {{ isSubmitting ? 'Signing in…' : 'Sign in via Firebase' }}
      </button>

      <p class="text-center small text-muted">
        New here? <router-link to="/FireRegister">Register as a Volunteer or Corporate Partner</router-link>
      </p>
    </form>
  </div>
</template>
