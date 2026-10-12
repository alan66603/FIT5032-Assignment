<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore'
// Storage's ref() would clash with Vue's ref(), so rename it.
import { ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/firebase/init'
import { currentUser, userRole, avatarUrl, loadAvatar } from '@/auth'
import defaultAvatar from '@/assets/default-avatar.svg'
import { grants } from '@/data/grants'

const myRatings = ref([])
const isLoading = ref(true)

/** Account creation date from Firebase auth metadata, shown as DD/MM/YYYY. */
const memberSince = computed(() => {
  const created = currentUser.value?.metadata?.creationTime
  return created ? new Date(created).toLocaleDateString('en-AU') : '—'
})

/** Join each rating with its grant so we can show the project name. */
const ratedGrants = computed(() =>
  myRatings.value
    .map((rating) => ({
      ...rating,
      grant: grants.find((grant) => grant.id === rating.grantId),
    }))
    .filter((item) => item.grant),
)

// Collection query filtered by uid — the router guard guarantees a user
// is signed in before this page mounts.
onMounted(async () => {
  try {
    const q = query(collection(db, 'ratings'), where('uid', '==', currentUser.value.uid))
    const querySnapshot = await getDocs(q)
    myRatings.value = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching ratings:', error)
  } finally {
    isLoading.value = false
  }
})

// --- Profile picture (BR E.1) ---
// The page uploads the original picture to Storage. The makeAvatarThumbnail
// Cloud Function then makes a 200x200 thumb.jpg and updates
// users/{uid}.avatarUpdatedAt, which we listen to with onSnapshot.
// avatarUrl lives in auth.js so the navbar updates at the same time.
const avatarFile = ref(null)
const isUploading = ref(false)
const avatarMessage = ref(null)
const avatarError = ref(null)
let unsubscribeUser = null

const onAvatarChange = (event) => {
  avatarFile.value = event.target.files[0] ?? null
}

const uploadAvatar = async () => {
  avatarError.value = null
  avatarMessage.value = null

  if (!avatarFile.value) {
    avatarError.value = 'Please choose a picture first.'
    return
  }
  if (!avatarFile.value.type.startsWith('image/')) {
    avatarError.value = 'Please choose an image file.'
    return
  }
  if (avatarFile.value.size > 5 * 1024 * 1024) {
    avatarError.value = 'Picture must be 5 MB or smaller.'
    return
  }

  isUploading.value = true
  try {
    const originalRef = storageRef(storage, `avatars/${currentUser.value.uid}/original`)
    await uploadBytes(originalRef, avatarFile.value, { contentType: avatarFile.value.type })
    avatarMessage.value = 'Uploaded! Our Cloud Function is making your thumbnail…'
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    avatarError.value = 'Upload failed. Please try again.'
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.value.uid), (snapshot) => {
    const updatedAt = snapshot.data()?.avatarUpdatedAt
    if (updatedAt) {
      loadAvatar(currentUser.value.uid, updatedAt)
      if (avatarMessage.value) avatarMessage.value = 'Your new profile picture is ready.'
    }
  })
})

onUnmounted(() => {
  if (unsubscribeUser) unsubscribeUser()
})
</script>

<template>
  <div class="container py-5">
    <h1 class="fw-bold mb-4">My Profile</h1>

    <div class="row g-4">
      <!-- Account details -->
      <div class="col-md-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h2 class="h5 fw-bold mb-3">Account</h2>

            <!-- Profile picture -->
            <div class="d-flex align-items-center gap-3 mb-4">
              <!-- Falls back to the grey default picture until a thumbnail exists. -->
              <img
                :src="avatarUrl || defaultAvatar"
                :alt="avatarUrl ? 'Your profile picture' : 'No profile picture yet'"
                class="rounded-circle border"
                width="96"
                height="96"
                style="object-fit: cover"
              />

              <div class="flex-grow-1">
                <label for="avatar-file" class="form-label small mb-1">Profile picture (max 5 MB)</label>
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  class="form-control form-control-sm mb-2"
                  @change="onAvatarChange"
                />
                <button
                  type="button"
                  class="btn btn-brand btn-sm rounded-pill px-3"
                  :disabled="isUploading"
                  @click="uploadAvatar"
                >
                  {{ isUploading ? 'Uploading…' : 'Upload' }}
                </button>
              </div>
            </div>
            <div v-if="avatarError" class="alert alert-danger py-2 small" role="alert">{{ avatarError }}</div>
            <div v-if="avatarMessage" class="alert alert-success py-2 small" role="status">{{ avatarMessage }}</div>

            <dl class="row mb-0">
              <dt class="col-sm-4">Email</dt>
              <dd class="col-sm-8">{{ currentUser?.email }}</dd>

              <dt class="col-sm-4">Role</dt>
              <dd class="col-sm-8">
                <span class="badge bg-brand text-capitalize">{{ userRole ?? 'none' }}</span>
              </dd>

              <dt class="col-sm-4">Member since</dt>
              <dd class="col-sm-8">{{ memberSince }}</dd>

              <dt class="col-sm-4">User ID</dt>
              <dd class="col-sm-8"><code class="small">{{ currentUser?.uid }}</code></dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- Ratings -->
      <div class="col-md-7">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h2 class="h5 fw-bold mb-3">My Ratings</h2>

            <p v-if="isLoading" class="text-muted mb-0">Loading…</p>

            <p v-else-if="ratedGrants.length === 0" class="text-muted mb-0">
              You haven't rated any grants yet.
              <router-link to="/grants" class="text-brand">Browse grants</router-link>
            </p>

            <table v-else class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Suburb</th>
                  <th class="text-end">Your rating</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in ratedGrants" :key="item.id">
                  <td>{{ item.grant.project }}</td>
                  <td>{{ item.grant.suburb }}</td>
                  <td class="text-end text-warning">
                    {{ '★'.repeat(item.score) }}<span class="text-muted">{{ '★'.repeat(5 - item.score) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
