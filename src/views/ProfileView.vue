<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { currentUser, userRole } from '@/auth'
import { grants } from '@/data/grants'

const db = getFirestore()

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
            <dl class="row mb-0">
              <dt class="col-sm-4">Email</dt>
              <dd class="col-sm-8">{{ currentUser?.email }}</dd>

              <dt class="col-sm-4">Role</dt>
              <dd class="col-sm-8">
                <span class="badge text-bg-dark text-capitalize">{{ userRole ?? 'none' }}</span>
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
              <router-link to="/grants" class="text-dark">Browse grants</router-link>
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
