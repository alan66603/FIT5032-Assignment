<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { DASHBOARD_PATHS } from '@/auth';

const router = useRouter()
const auth = getAuth()
const db = getFirestore()

const formData = ref({
    email: '',
    password: '',
})

const errors = ref({
    email: null,
    password: null,
})

const loginError = ref(null)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Email validation: required, then format check via regex.
 * @param blur: boolean - if true, show the error message.
 */
const validateEmail = (blur) => {
  const email = formData.value.email.trim()

  if (email.length === 0) {
    if (blur) errors.value.email = 'Email is required.'
  } else if (!emailPattern.test(email)) {
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
  const password = formData.value.password
  const minLength = 6

  if (password.length === 0) {
    if (blur) errors.value.password = 'Password is required.'
  } else if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters.`
  } else {
    errors.value.password = null
  }
}

const submitForm = () => {
  validateEmail(true)
  validatePassword(true)
  loginError.value = null

  const hasError = Object.values(errors.value).some((message) => message !== null)
  if (hasError) return

  signInWithEmailAndPassword(auth, formData.value.email.trim(), formData.value.password)
    .then((data) => {
      console.log('Firebase Sign in Successful!')
      // Read the role saved at registration to pick the right dashboard.
      return getDoc(doc(db, 'users', data.user.uid))
    })
    .then((snap) => {
      const role = snap.exists() ? snap.data().role : null
      router.push(DASHBOARD_PATHS[role] ?? '/')
    })
    .catch((error) => {
      console.log(error.code)
      loginError.value = 'Incorrect email or password.'
    })
}
</script>

<template>
  <div class="container py-5" style="max-width: 400px">
    <h1>Log In</h1>

    <form @submit.prevent="submitForm" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input
          v-model="formData.email"
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
          v-model="formData.password"
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

      <button type="submit" class="btn btn-dark w-100 rounded-pill py-2 mb-3">Log In</button>

      <p class="text-center small text-muted">
        New here? Register as a <a href="#">Volunteer</a> or <a href="#">Corporate Partner</a>
      </p>
    </form>
  </div>
</template>