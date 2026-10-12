<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { FilterMatchMode } from '@primevue/core/api';
import { db } from '@/firebase/init';
import { grants, GRANT_STATUSES, updateGrantStatus } from '@/grantsStore';
import { currentUser, userRole } from '@/auth';
import StarRating from '@/components/StarRating.vue';

// DataTable filters (BR D.3): one search box for every column ("global"),
// plus one box per column so users can search by an individual column.
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  project: { value: null, matchMode: FilterMatchMode.CONTAINS },
  suburb: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  averageRating: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
})

const statuses = GRANT_STATUSES

// Options for the rating filter: show grants rated at least N stars on average.
const ratingOptions = [
  { label: '4★ and up', value: 4 },
  { label: '3★ and up', value: 3 },
  { label: '2★ and up', value: 2 },
  { label: '1★ and up', value: 1 },
]

// --- Admins can change a grant's status (saved in Firestore grantStatuses) ---
const isAdmin = computed(() => userRole.value === 'admin')
const statusError = ref(null)

const changeStatus = async (grantId, status) => {
  statusError.value = null
  try {
    await updateGrantStatus(grantId, status)
  } catch (error) {
    console.error('Error changing status:', error)
    statusError.value = 'Could not change the status. Please try again.'
  }
}

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

// The rows for the table: each grant plus its average rating, so the Rating
// column can be sorted and filtered like any other column.
// Grants with no ratings get 0, which puts them last when sorting by rating.
const grantRows = computed(() =>
  grants.value.map((grant) => ({
    ...grant,
    averageRating: ratingStats.value[grant.id]?.average ?? 0,
  })),
)

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
        <div v-if="statusError" class="alert alert-danger" role="alert">{{ statusError }}</div>

        <!-- PrimeVue DataTable (BR D.3): sort, global search, search by column, 10 rows per page -->
        <div class="card p-3">
            <DataTable
                v-model:filters="filters"
                :value="grantRows"
                dataKey="id"
                paginator
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} grants"
                filterDisplay="row"
                :globalFilterFields="['project', 'suburb', 'status', 'description']"
                removableSort
                stripedRows
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <InputText
                            v-model="filters.global.value"
                            placeholder="🔍 Search all grants"
                            aria-label="Search all grants"
                        />
                        <span v-if="!currentUser" class="small text-muted">
                            <router-link to="/FireLogin">Log in</router-link> to rate a grant.
                        </span>
                    </div>
                </template>

                <template #empty>
                    <p class="text-center text-muted py-4 mb-0">No grants match your search.</p>
                </template>

                <Column field="project" header="Project" sortable :showFilterMenu="false" style="min-width: 20rem">
                    <template #body="{ data }">
                        <div class="d-flex align-items-center">
                            <img :src="data.image" :alt="data.project" class="grant-thumb me-3" />
                            <div>
                                <div class="fw-semibold">{{ data.project }}</div>
                                <div class="small text-muted grant-desc">{{ data.description }}</div>
                            </div>
                        </div>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText
                            v-model="filterModel.value"
                            @input="filterCallback()"
                            placeholder="Search project"
                            aria-label="Filter by project"
                            size="small"
                        />
                    </template>
                </Column>

                <Column field="suburb" header="Suburb" sortable :showFilterMenu="false">
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText
                            v-model="filterModel.value"
                            @input="filterCallback()"
                            placeholder="Search suburb"
                            aria-label="Filter by suburb"
                            size="small"
                        />
                    </template>
                </Column>

                <Column field="amount" header="Amount" sortable>
                    <template #body="{ data }">
                        <span class="fw-semibold">${{ data.amount.toLocaleString() }}</span>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable :showFilterMenu="false">
                    <template #body="{ data }">
                        <!-- Admins get a dropdown to change the status; everyone else sees a badge. -->
                        <select
                            v-if="isAdmin"
                            class="form-select form-select-sm"
                            :value="data.status"
                            :aria-label="`Status of ${data.project}`"
                            @change="changeStatus(data.id, $event.target.value)"
                        >
                            <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
                        </select>
                        <span v-else class="badge rounded-pill" :class="statusBadgeClass(data.status)">{{ data.status }}</span>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <Select
                            v-model="filterModel.value"
                            @change="filterCallback()"
                            :options="statuses"
                            placeholder="All"
                            showClear
                            aria-label="Filter by status"
                            size="small"
                        />
                    </template>
                </Column>

                <!-- ISO dates (YYYY-MM-DD) sort correctly as text; show them as DD/MM/YYYY. -->
                <Column field="date" header="Date" sortable>
                    <template #body="{ data }">{{ formatDate(data.date) }}</template>
                </Column>

                <Column field="averageRating" header="Rating" sortable :showFilterMenu="false">
                    <template #filter="{ filterModel, filterCallback }">
                        <Select
                            v-model="filterModel.value"
                            @change="filterCallback()"
                            :options="ratingOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Any"
                            showClear
                            aria-label="Filter by rating"
                            size="small"
                        />
                    </template>
                    <template #body="{ data }">
                        <StarRating
                            :value="myRatings[data.id] ?? 0"
                            :disabled="!currentUser"
                            @rate="rateGrant(data.id, $event)"
                        />
                        <div class="small text-muted">
                            <template v-if="ratingStats[data.id]">
                                {{ ratingStats[data.id].average.toFixed(1) }} / 5
                                ({{ ratingStats[data.id].count }})
                            </template>
                            <template v-else>No ratings yet</template>
                        </div>
                    </template>
                </Column>
            </DataTable>
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
