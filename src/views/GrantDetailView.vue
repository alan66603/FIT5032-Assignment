<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { currentUser } from '@/auth'
import { grants } from '@/grantsStore'
import { eventsForGrant, myBookedEventIds, bookEvent, cancelBooking } from '@/eventsStore'
import NavigateIcon from '@/components/NavigateIcon.vue'

// One grant project: its details, average rating and the planting days that belong to it.

const route = useRoute()
const grantId = computed(() => Number(route.params.id))
const grant = computed(() => grants.value.find((g) => g.id === grantId.value))

// --- Average rating (Firestore ratings for this grant) ---
const ratingAverage = ref(null)
const ratingCount = ref(0)

const loadRatings = async () => {
  try {
    const ratingsQuery = query(collection(db, 'ratings'), where('grantId', '==', grantId.value))
    const snapshot = await getDocs(ratingsQuery)
    const scores = snapshot.docs.map((ratingDoc) => ratingDoc.data().score)
    ratingCount.value = scores.length
    ratingAverage.value = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
  } catch (error) {
    console.error('Error loading ratings:', error)
  }
}
// Load again if the user goes from one grant page to another.
watch(grantId, loadRatings, { immediate: true })

// --- Planting days for this grant ---
const grantEvents = computed(() => eventsForGrant(grantId.value))
const upcomingEvents = computed(() => grantEvents.value.filter((event) => event.start > new Date()))
const pastEvents = computed(() => grantEvents.value.filter((event) => event.start <= new Date()).reverse())

const isFull = (event) => event.bookedCount >= event.capacity
const isBooked = (event) => myBookedEventIds.value.has(event.id)

const formatDateTime = (date) =>
  date.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const statusBadgeClass = (status) => {
  if (status === 'Approved') return 'bg-success'
  if (status === 'In Review') return 'bg-warning text-dark'
  return 'bg-secondary'
}

// Book / cancel straight from this page (same checks as the Events page).
const workingId = ref(null)
const eventError = ref(null)

const toggleBooking = async (event) => {
  eventError.value = null
  workingId.value = event.id
  try {
    if (isBooked(event)) await cancelBooking(event)
    else await bookEvent(event)
  } catch (error) {
    console.error('Error updating booking:', error)
    eventError.value = error.message
  } finally {
    workingId.value = null
  }
}
</script>

<template>
  <div v-if="!grant" class="container py-5 text-center">
    <h1 class="h3 fw-bold">Grant not found</h1>
    <router-link to="/grants" class="btn btn-brand rounded-pill px-4 mt-3">Back to all grants</router-link>
  </div>

  <template v-else>
    <!-- Photo banner -->
    <section class="grant-hero" :style="{ backgroundImage: `url(${grant.image})` }">
      <div class="grant-hero-overlay">
        <div class="container py-5">
          <router-link to="/grants" class="text-white small">← All grants</router-link>
          <h1 class="display-6 fw-bold text-white mt-2 mb-2">{{ grant.project }}</h1>
          <p class="text-white mb-0">📍 {{ grant.suburb }}</p>
        </div>
      </div>
    </section>

    <div class="container py-5">
      <div class="row g-4">
        <!-- Details -->
        <div class="col-lg-4">
          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3">About this project</h2>
            <p class="text-muted">{{ grant.description }}</p>
            <dl class="row small mb-0">
              <dt class="col-5">Status</dt>
              <dd class="col-7">
                <span class="badge rounded-pill" :class="statusBadgeClass(grant.status)">{{ grant.status }}</span>
              </dd>
              <dt class="col-5">Grant amount</dt>
              <dd class="col-7 fw-semibold">${{ grant.amount.toLocaleString() }}</dd>
              <dt class="col-5">Applied</dt>
              <dd class="col-7">{{ formatDate(grant.date) }}</dd>
              <dt class="col-5">Rating</dt>
              <dd class="col-7">
                <template v-if="ratingAverage !== null">
                  <span class="text-warning">★</span> {{ ratingAverage.toFixed(1) }} / 5 ({{ ratingCount }})
                </template>
                <template v-else>No ratings yet</template>
              </dd>
            </dl>
          </div>

          <router-link :to="`/map?grant=${grant.id}`" class="btn btn-outline-brand rounded-pill w-100">
            <NavigateIcon /> See on map &amp; get directions
          </router-link>
        </div>

        <!-- Planting days -->
        <div class="col-lg-8">
          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3">Upcoming planting days</h2>
            <p v-if="!currentUser" class="small text-muted">
              <router-link to="/FireLogin">Log in</router-link> to book a place.
            </p>
            <div v-if="eventError" class="alert alert-danger py-2" role="alert">{{ eventError }}</div>

            <p v-if="upcomingEvents.length === 0" class="text-muted mb-0">
              No planting days planned yet for this project.
            </p>
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="d-flex flex-wrap align-items-center gap-2 py-3 border-bottom"
            >
              <div class="flex-grow-1">
                <router-link :to="`/events/${event.id}`" class="fw-semibold text-brand">{{ event.title }}</router-link>
                <div class="small text-muted">📅 {{ formatDateTime(event.start) }} · 📍 {{ event.place }}</div>
                <div class="small">{{ event.bookedCount }} / {{ event.capacity }} places booked</div>
              </div>
              <span v-if="isBooked(event)" class="badge bg-primary">Booked</span>
              <span v-else-if="isFull(event)" class="badge bg-secondary">Full</span>
              <button
                v-if="currentUser && (isBooked(event) || !isFull(event))"
                type="button"
                class="btn btn-sm rounded-pill px-3"
                :class="isBooked(event) ? 'btn-outline-danger' : 'btn-brand'"
                :disabled="workingId === event.id"
                :aria-label="`${isBooked(event) ? 'Cancel booking for' : 'Book'} ${event.title}`"
                @click="toggleBooking(event)"
              >
                {{ workingId === event.id ? '…' : isBooked(event) ? 'Cancel' : 'Book' }}
              </button>
            </div>
          </div>

          <div class="card p-4">
            <h2 class="h5 fw-bold mb-3">Past planting days</h2>
            <p v-if="pastEvents.length === 0" class="text-muted mb-0">No past planting days yet.</p>
            <div v-for="event in pastEvents" :key="event.id" class="py-2 border-bottom">
              <router-link :to="`/events/${event.id}`" class="fw-semibold text-brand">{{ event.title }}</router-link>
              <div class="small text-muted">
                📅 {{ formatDateTime(event.start) }} · {{ event.bookedCount }} volunteers took part
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.grant-hero {
  background-size: cover;
  background-position: center;
}
.grant-hero-overlay {
  background: linear-gradient(90deg, rgba(22, 59, 39, 0.9), rgba(22, 59, 39, 0.45));
}
</style>
