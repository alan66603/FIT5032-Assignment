import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth()

/** Firebase user object, or null when logged out. */
export const currentUser = ref(null)

/**
 * Firebase restores a saved session asynchronously on page load. Until the
 * first onAuthStateChanged callback fires, currentUser is null even for a
 * logged-in user, so the router guard awaits this promise before deciding.
 */
let resolveReady
const authReady = new Promise((resolve) => {
  resolveReady = resolve
})

export function waitForAuthReady() {
  return authReady
}

onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  resolveReady()
})
