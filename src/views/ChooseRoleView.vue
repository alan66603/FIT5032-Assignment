<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { currentUser, userRole, DASHBOARD_PATHS } from '@/auth'

// First Google sign-in: the account exists in Firebase Auth but has no
// users/{uid} profile yet, so ask which kind of member they are.
// The Firestore rules only allow 'volunteer' or 'corporate' here.

const router = useRouter()
const role = ref('volunteer')
const isSaving = ref(false)
const errorMessage = ref(null)

const roles = [
  { value: 'volunteer', icon: '🌱', title: 'Volunteer', text: 'Join planting days and rate the projects you care about.' },
  { value: 'corporate', icon: '🏢', title: 'Corporate partner', text: 'Book team planting days and support local projects.' },
]

// Someone who already has a role doesn't need this page.
onMounted(() => {
  if (userRole.value) router.replace(DASHBOARD_PATHS[userRole.value] ?? '/')
})

const saveRole = async () => {
  errorMessage.value = null
  isSaving.value = true
  try {
    await setDoc(doc(db, 'users', currentUser.value.uid), {
      email: currentUser.value.email,
      role: role.value,
    })
    // Update the shared role straight away so the navbar and route guard see it.
    userRole.value = role.value
    router.push(DASHBOARD_PATHS[role.value])
  } catch (error) {
    console.error('Error saving role:', error)
    errorMessage.value = 'Could not save your choice. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 560px">
    <div class="card p-4 p-md-5">
      <h1 class="h3 fw-bold mb-1">Welcome to GreenRoots 🌿</h1>
      <p class="text-muted mb-4">
        You're signed in as <strong>{{ currentUser?.email }}</strong>. How would you like to take part?
      </p>

      <form @submit.prevent="saveRole" novalidate>
        <fieldset class="mb-4">
          <legend class="visually-hidden">Choose your role</legend>
          <div v-for="option in roles" :key="option.value" class="form-check role-option mb-3">
            <input
              :id="`role-${option.value}`"
              v-model="role"
              class="form-check-input"
              type="radio"
              name="role"
              :value="option.value"
            />
            <label :for="`role-${option.value}`" class="form-check-label w-100">
              <span class="fw-semibold">{{ option.icon }} {{ option.title }}</span>
              <span class="d-block small text-muted">{{ option.text }}</span>
            </label>
          </div>
        </fieldset>

        <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>

        <button type="submit" class="btn btn-brand w-100 rounded-pill py-2" :disabled="isSaving">
          {{ isSaving ? 'Saving…' : 'Continue' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.role-option {
  border: 1px solid #dee2e6;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
}
</style>
