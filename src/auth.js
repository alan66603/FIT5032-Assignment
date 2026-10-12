import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
// Storage's ref() would clash with Vue's ref(), so rename it.
import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/firebase/init'

/** Firebase user object, or null when logged out. */
export const currentUser = ref(null)

/** Role string from Firestore users/{uid} ('volunteer' | 'corporate' | 'admin'), or null. */
export const userRole = ref(null)

/**
 * Download URL of the user's 200x200 profile thumbnail (made by the
 * makeAvatarThumbnail Cloud Function), or null to show the default picture.
 * Shared so the navbar and the Profile page always show the same picture.
 */
export const avatarUrl = ref(null)

/** Load avatars/{uid}/thumb.jpg. updatedAt is added to the URL so the browser skips its cached copy. */
export async function loadAvatar(uid, updatedAt) {
  try {
    const url = await getDownloadURL(storageRef(storage, `avatars/${uid}/thumb.jpg`))
    avatarUrl.value = `${url}&t=${updatedAt}`
  } catch (error) {
    console.error('Error loading profile picture:', error)
    avatarUrl.value = null
  }
}

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

    // Not awaited: the picture can appear a moment later without delaying navigation.
    const avatarUpdatedAt = docSnap.exists() ? docSnap.data().avatarUpdatedAt : null
    if (avatarUpdatedAt) loadAvatar(uid, avatarUpdatedAt)
  } catch (error) {
    console.error('Error loading user role:', error)
    userRole.value = null
  }
}

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user
  userRole.value = null
  avatarUrl.value = null

  roleLoaded = user ? loadRole(user.uid) : Promise.resolve()
  await roleLoaded
  resolveInitial()
})
