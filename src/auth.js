import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'

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

export async function waitForAuthReady() {
  await initialAuth
  await roleLoaded
}

/** Read users/{uid}.role into userRole; a failed read must not block navigation. */
const loadRole = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid))
    userRole.value = docSnap.exists() ? docSnap.data().role : null
  } catch (error) {
    console.error('Error loading user role:', error)
    userRole.value = null
  }
}

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user
  userRole.value = null

  roleLoaded = user ? loadRole(user.uid) : Promise.resolve()
  await roleLoaded
  resolveInitial()
})
