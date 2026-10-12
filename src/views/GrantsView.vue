<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { grants } from '@/data/grants';
import { currentUser } from '@/auth';
import StarRating from '@/components/StarRating.vue';

const searchTerm = ref('')

const filterGrants = computed(() => {
    return grants.filter((grant) => {
        const matchesSearch = grant.project.toLowerCase().includes(searchTerm.value.toLowerCase())
        const matchesStatus = statusFilters[grant.status]
        return matchesSearch && matchesStatus
    })
})

/**
 * grants.js stores ISO dates (YYYY-MM-DD) so they sort correctly; display
 * them in Australian DD/MM/YYYY. String split avoids the timezone shift that
 * new Date('YYYY-MM-DD') can introduce.
 */
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function statusBadgeClass(status) {
  if (status === 'Approved') return 'bg-success'
  if (status === 'In Review') return 'bg-warning text-dark'
  if (status === 'Declined') return 'bg-secondary'
  return 'bg-light text-dark'
}

const statusFilters = reactive({
  Approved: true,
  'In Review': true,
  Declined: true,
})

// --- Ratings (Firestore `ratings` collection) ---

// Every rating document: { grantId, uid, score }. Kept in sync live via
// onSnapshot so the average updates the moment anyone rates.
const ratings = ref([])
let unsubscribe = null

onMounted(() => {
  unsubscribe = onSnapshot(collection(db, 'ratings'), (snapshot) => {
    ratings.value = snapshot.docs.map((d) => d.data())
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Aggregate per grant: { [grantId]: { average, count } }
const ratingStats = computed(() => {
  const stats = {}
  for (const rating of ratings.value) {
    if (!stats[rating.grantId]) stats[rating.grantId] = { total: 0, count: 0 }
    stats[rating.grantId].total += rating.score
    stats[rating.grantId].count += 1
  }
  for (const id in stats) {
    stats[id].average = stats[id].total / stats[id].count
  }
  return stats
})

// The signed-in user's own score per grant, so their stars show as filled.
const myRatings = computed(() => {
  const mine = {}
  if (!currentUser.value) return mine
  for (const rating of ratings.value) {
    if (rating.uid === currentUser.value.uid) mine[rating.grantId] = rating.score
  }
  return mine
})

// Document ID = grantId_uid so each user has one rating per grant and
// rating again overwrites instead of adding a duplicate.
const rateGrant = async (grantId, score) => {
  if (!currentUser.value) return
  const uid = currentUser.value.uid

  try {
    await setDoc(doc(db, 'ratings', `${grantId}_${uid}`), {
      grantId,
      uid,
      score,
      updatedAt: serverTimestamp(),
    })
    console.log('Rating saved!')
  } catch (error) {
    console.error('Error saving rating:', error)
  }
}
</script>

<template>
    <!-- Banner -->
    <section class="page-banner">
        <div class="container">
            <p class="eyebrow mb-2">Funding local projects</p>
            <h1 class="display-6 fw-bold mb-2">Community Greening Grants</h1>
            <p class="lead mb-0">Browse the projects we fund and rate the ones you care about.</p>
        </div>
    </section>

    <div class="container py-5">
        <!-- Search + status filters -->
        <div class="card p-3 mb-4">
            <div class="row g-3 align-items-center">
                <div class="col-md-5">
                    <input
                        v-model="searchTerm"
                        type="text"
                        class="form-control rounded-pill"
                        placeholder="🔍 Search by project name"
                    />
                </div>
                <div class="col-md-7">
                    <div class="form-check form-check-inline" v-for="status in Object.keys(statusFilters)" :key="status">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            :id="'status-' + status"
                            v-model="statusFilters[status]"
                        />
                        <label class="form-check-label" :for="'status-' + status">{{ status }}</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-3">
            <p class="mb-0 fw-semibold">Showing {{ filterGrants.length }} of {{ grants.length }} grants</p>
            <p v-if="!currentUser" class="small text-muted mb-0">
                <router-link to="/FireLogin">Log in</router-link> to rate a grant.
            </p>
        </div>

        <div class="card overflow-hidden">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3">Project</th>
                            <th>Suburb</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="grant in filterGrants" :key="grant.id">
                            <td class="ps-3">
                                <div class="d-flex align-items-center">
                                    <img :src="grant.image" :alt="grant.project" class="grant-thumb me-3" />
                                    <div>
                                        <div class="fw-semibold">{{ grant.project }}</div>
                                        <div class="small text-muted grant-desc">{{ grant.description }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{{ grant.suburb }}</td>
                            <td class="fw-semibold">${{ grant.amount.toLocaleString() }}</td>
                            <td>
                                <span class="badge rounded-pill" :class="statusBadgeClass(grant.status)">{{ grant.status }}</span>
                            </td>
                            <td>{{ formatDate(grant.date) }}</td>
                            <td>
                                <StarRating
                                    :value="myRatings[grant.id] ?? 0"
                                    :disabled="!currentUser"
                                    @rate="rateGrant(grant.id, $event)"
                                />
                                <div class="small text-muted">
                                    <template v-if="ratingStats[grant.id]">
                                        {{ ratingStats[grant.id].average.toFixed(1) }} / 5
                                        ({{ ratingStats[grant.id].count }})
                                    </template>
                                    <template v-else>No ratings yet</template>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="filterGrants.length === 0">
                            <td colspan="6" class="text-center text-muted py-5">No grants match your search.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.grant-thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 0.75rem;
}
.grant-desc {
    max-width: 320px;
}
</style>
