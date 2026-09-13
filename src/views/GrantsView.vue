<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { grants } from '@/data/grants';
import { currentUser } from '@/auth';
import StarRating from '@/components/StarRating.vue';

const db = getFirestore()

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
    <div class="container py-5">
        <h1>Community Greening Grants</h1>
        <input
            v-model="searchTerm"
            type="text"
            class="form-control mb-3"
            style="max-width: 400px"
            placeholder="Search by project name"
        />

        <div class="mb-3">
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

        <p>We have {{ filterGrants.length }} grants.</p>
        <p v-if="!currentUser" class="small text-muted">
            <router-link to="/FireLogin">Log in</router-link> to rate a grant.
        </p>

        <table class="table">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Surburb</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="grant in filterGrants" :key="grant.id">
                    <td>{{ grant.project }}</td>
                    <td>{{ grant.suburb }}</td>
                    <td>${{ grant.amount.toLocaleString() }}</td>
                    <td>
                        <span class="badge" :class="statusBadgeClass(grant.status)">{{ grant.status }}</span>
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
            </tbody>
        </table>
    </div>
</template>
