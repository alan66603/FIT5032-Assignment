<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'
import { DASHBOARD_PATHS } from '@/auth'

// "Continue with Google" (BR D.1 external authentication) - used on the
// Sign in and Register pages. Firebase opens Google's own sign-in window,
// so our app never sees the user's Google password.

const router = useRouter()
const isSigningIn = ref(false)
const errorMessage = ref(null)

const signInWithGoogle = async () => {
  errorMessage.value = null
  isSigningIn.value = true
  try {
    const provider = new GoogleAuthProvider()
    // Always show the account chooser, so people can pick which Google account to use.
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)

    // Already a member? Go to their dashboard. First time? Ask for their role.
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (userDoc.exists()) {
      router.push(DASHBOARD_PATHS[userDoc.data().role] ?? '/')
    } else {
      router.push('/choose-role')
    }
  } catch (error) {
    // Closing the Google window isn't an error worth showing.
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') return

    console.error('Google sign-in failed:', error)
    if (error.code === 'auth/popup-blocked') {
      errorMessage.value = 'Your browser blocked the Google window. Please allow pop-ups for this site and try again.'
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage.value = 'This email already has an account. Please sign in with your email and password.'
    } else {
      errorMessage.value = 'Google sign-in failed. Please try again.'
    }
  } finally {
    isSigningIn.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-items-center my-3" aria-hidden="true">
      <hr class="flex-grow-1" />
      <span class="px-3 small text-muted">or</span>
      <hr class="flex-grow-1" />
    </div>

    <button
      type="button"
      class="btn btn-outline-secondary w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2"
      :disabled="isSigningIn"
      @click="signInWithGoogle"
    >
      <!-- Google "G" logo -->
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {{ isSigningIn ? 'Opening Google…' : 'Continue with Google' }}
    </button>

    <div v-if="errorMessage" class="alert alert-danger py-2 mt-3 mb-0" role="alert">{{ errorMessage }}</div>
  </div>
</template>
