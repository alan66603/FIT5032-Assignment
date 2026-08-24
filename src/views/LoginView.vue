<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { isAuthenticated } from '@/auth';

const router = useRouter()

const formData = ref({
    email: '',
    password: '',
})

const errors = ref({
    email: null,
    password: null,
})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function handleSubmit() {
    console.log('submitted', form.email, form.password)
}

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

  const hasError = Object.values(errors.value).some((message) => message !== null)
  if (!hasError) {
    isAuthenticated.value = true
    router.push('/about')
  }
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
        />
        <div class="invalid-feedback">{{ errors.password }}</div>
      </div>

      <button type="submit" class="btn btn-dark">Log In</button>
    </form>
  </div>
</template>