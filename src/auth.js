import { ref } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

/** Firebase user object, or null when logged out. */
export const currentUser = ref(null)

/** Role string from Firestore users/{uid} ('volunteer' | 'corporate' | 'admin'), or null. */
export const userRole = ref(null)

/** Where each role lands after login. */
export const DASHBOARD_PATHS = {
  volunteer: '/dashboard/volunteer',
  corporate: '/dashboard/corporate',
  admin: '/dashboard/admin',
}

/**
 * Firebase restores a saved session asynchronously on page load, and the
 * role needs a Firestore read on top of that. The router guard awaits
 * waitForAuthReady() so it never decides on a half-loaded state.
 */
let resolveInitial
const initialAuth = new Promise((resolve) => {
  resolveInitial = resolve
})
let roleLoaded = Promise.resolve()

export function waitForAuthReady() {
  return initialAuth.then(() => roleLoaded)
}

/**
 * Called from main.js right after initializeApp(). ES module imports are
 * evaluated before main.js's own body runs, so getAuth() cannot live at the
 * top level of this file — Firebase would not be initialised yet.
 */
export function startAuthListener() {
  const auth = getAuth()
  const db = getFirestore()

  onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    userRole.value = null

    roleLoaded = user
      ? getDoc(doc(db, 'users', user.uid))
          .then((snap) => {
            userRole.value = snap.exists() ? snap.data().role : null
          })
          .catch((error) => {
            // A failed read must not block navigation; treat as "no role".
            console.log(error.code)
            userRole.value = null
          })
      : Promise.resolve()

    roleLoaded.then(resolveInitial)
  })
}
