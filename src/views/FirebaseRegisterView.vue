<script setup>
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('')
const router = useRouter()
const auth = getAuth()
const db = getFirestore()

// Roles a user may pick at registration. Admin is assigned manually in
// Firebase Console so nobody can self-promote.
const roles = [
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'corporate', label: 'Corporate Partner' },
]

const errors = ref({
  email: null,
  password: null,
  confirmPassword: null,
  role: null,
})

const registerError = ref(null)
const isSubmitting = ref(false)

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Same blur-triggered pattern as FirebaseSigninView: while typing (blur = false)
 * only clear errors once valid; on blur/submit (blur = true) show them.
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

const validateConfirmPassword = (blur) => {
  if (confirmPassword.value.length === 0) {
    if (blur) errors.value.confirmPassword = 'Please confirm your password.'
  } else if (confirmPassword.value !== password.value) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match.'
  } else {
    errors.value.confirmPassword = null
  }
}

const validateRole = (blur) => {
  if (role.value === '') {
    if (blur) errors.value.role = 'Please select a role.'
  } else {
    errors.value.role = null
  }
}

const register = async () => {
  validateEmail(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateRole(true)
  registerError.value = null

  const hasError = Object.values(errors.value).some((message) => message !== null)
  if (hasError) return

  isSubmitting.value = true
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value,
    )
    console.log('Firebase Register Successful!')

    // Document ID = uid so each user has exactly one profile that can be
    // looked up directly after login without a query.
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email.value.trim(),
      role: role.value,
    })
    console.log('Firestore user profile saved!')
    router.push('/FireLogin')
  } catch (error) {
    console.error('Error creating user:', error)
    if (error.code === 'auth/email-already-in-use') {
      registerError.value = 'An account with this email already exists.'
    } else if (error.code === 'auth/invalid-email') {
      registerError.value = 'Please enter a valid email address.'
    } else if (error.code === 'auth/weak-password') {
      registerError.value = 'Password is too weak.'
    } else {
      registerError.value = 'Registration failed. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 400px">
    <h1>Create an Account</h1>

    <form @submit.prevent="register" novalidate>
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
          placeholder="At least 6 characters"
        />
        <div class="invalid-feedback">{{ errors.password }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label">Confirm Password</label>
        <input
          v-model="confirmPassword"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': errors.confirmPassword }"
          @blur="validateConfirmPassword(true)"
          @input="validateConfirmPassword(false)"
          placeholder="Re-enter your password"
        />
        <div class="invalid-feedback">{{ errors.confirmPassword }}</div>
      </div>

      <div class="mb-3">
        <label class="form-label">I am registering as</label>
        <select
          v-model="role"
          class="form-select"
          :class="{ 'is-invalid': errors.role }"
          @blur="validateRole(true)"
          @change="validateRole(false)"
        >
          <option value="" disabled>Select your role</option>
          <option v-for="option in roles" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.role }}</div>
      </div>

      <div v-if="registerError" class="alert alert-danger py-2" role="alert">{{ registerError }}</div>

      <button type="submit" class="btn btn-dark w-100 rounded-pill py-2 mb-3" :disabled="isSubmitting">
        {{ isSubmitting ? 'Registering…' : 'Register' }}
      </button>

      <p class="text-center small text-muted">
        Already have an account? <router-link to="/FireLogin">Sign in</router-link>
      </p>
    </form>
  </div>
</template>
