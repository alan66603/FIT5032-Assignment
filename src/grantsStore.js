import { ref, computed } from 'vue'
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { currentUser } from '@/auth'
import { grants as baseGrants } from '@/data/grants'

export const GRANT_STATUSES = ['Approved', 'In Review', 'Declined']

/**
 * Status changes made by admins are saved in Firestore:
 *   grantStatuses/{grantId}  { status, updatedAt, updatedBy }
 * Every page listens to them live with onSnapshot, so when an admin changes
 * a status, the Grants table, Home page and Admin dashboard all update at once.
 */
const statusChanges = ref({})

onSnapshot(collection(db, 'grantStatuses'), (snapshot) => {
  const changes = {}
  snapshot.forEach((statusDoc) => {
    changes[statusDoc.id] = statusDoc.data().status
  })
  statusChanges.value = changes
})

/** The demo grants from grants.js, with any status an admin has changed. */
export const grants = computed(() =>
  baseGrants.map((grant) => ({
    ...grant,
    status: statusChanges.value[grant.id] ?? grant.status,
  })),
)

/** Admins only (checked again by the Firestore rules). */
export async function updateGrantStatus(grantId, status) {
  await setDoc(doc(db, 'grantStatuses', String(grantId)), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.value.uid,
  })
}
