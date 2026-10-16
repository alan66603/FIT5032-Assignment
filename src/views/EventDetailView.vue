<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { currentUser } from '@/auth'
import { grants } from '@/grantsStore'
import { events, eventsLoaded, myBookedEventIds, bookEvent, cancelBooking } from '@/eventsStore'
import NavigateIcon from '@/components/NavigateIcon.vue'

// One planting day: details, the grant it belongs to, booking and directions.
// The id comes from the URL, e.g. /events/abc123.

const route = useRoute()
const event = computed(() => events.value.find((e) => e.id === route.params.id))
const grant = computed(() => (event.value ? grants.value.find((g) => g.id === event.value.grantId) : null))

// Show the event's name in the browser tab (WCAG 2.4.2).
watchEffect(() => {
  if (event.value) document.title = `${event.value.title} · GreenRoots Melbourne`
})

const isPast = computed(() => event.value.start <= new Date())
const isFull = computed(() => event.value.bookedCount >= event.value.capacity)
const isBooked = computed(() => myBookedEventIds.value.has(event.value.id))
const placesLeft = computed(() => event.value.capacity - event.value.bookedCount)

const formatDate = (date) =>
  date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatTime = (date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })

// --- Book / cancel (same checks as everywhere else, in eventsStore.js) ---
const isWorking = ref(false)
const errorMessage = ref(null)
const successMessage = ref(null)

const toggleBooking = async () => {
  errorMessage.value = null
  successMessage.value = null
  isWorking.value = true
  try {
    if (isBooked.value) {
      await cancelBooking(event.value)
      successMessage.value = 'Your booking has been cancelled.'
    } else {
      await bookEvent(event.value)
      successMessage.value = "You're booked in! It's now on your dashboard."
    }
  } catch (error) {
    console.error('Error updating booking:', error)
    errorMessage.value = error.message
  } finally {
    isWorking.value = false
  }
}
</script>

<template>
  <div v-if="!eventsLoaded" class="container py-5 text-center text-muted" role="status">Loading event…</div>

  <div v-else-if="!event" class="container py-5 text-center">
    <h1 class="h3 fw-bold">Event not found</h1>
    <p class="text-muted">It may have been removed.</p>
    <router-link to="/events" class="btn btn-brand rounded-pill px-4">See all planting days</router-link>
  </div>

  <template v-else>
    <!-- Banner: the grant's photo, if the event belongs to one -->
    <section class="event-hero" :style="grant ? { backgroundImage: `url(${grant.image})` } : {}">
      <div class="event-hero-overlay">
        <div class="container py-5">
          <router-link to="/events" class="text-white small">← All planting days</router-link>
          <h1 class="display-6 fw-bold text-white mt-2 mb-2">{{ event.title }}</h1>
          <p class="text-white mb-0">📅 {{ formatDate(event.start) }} · {{ formatTime(event.start) }} – {{ formatTime(event.end) }}</p>
        </div>
      </div>
    </section>

    <div class="container py-5">
      <div class="row g-4">
        <!-- Details -->
        <div class="col-lg-7">
          <div class="card p-4 h-100">
            <h2 class="h5 fw-bold mb-3">About this planting day</h2>
            <p v-if="event.description">{{ event.description }}</p>
            <dl class="row mb-0">
              <dt class="col-sm-3">When</dt>
              <dd class="col-sm-9">
                {{ formatDate(event.start) }}, {{ formatTime(event.start) }} – {{ formatTime(event.end) }}
              </dd>
              <dt class="col-sm-3">Where</dt>
              <dd class="col-sm-9">📍 {{ event.place }}</dd>
              <template v-if="grant">
                <dt class="col-sm-3">Project</dt>
                <dd class="col-sm-9">
                  <router-link :to="`/grants/${grant.id}`" class="text-brand fw-semibold">{{ grant.project }}</router-link>
                  <span class="text-muted"> · {{ grant.suburb }}</span>
                </dd>
              </template>
            </dl>
          </div>
        </div>

        <!-- Booking -->
        <div class="col-lg-5">
          <div class="card p-4 mb-4">
            <h2 class="h5 fw-bold mb-3">Places</h2>
            <p class="fs-4 fw-bold text-brand mb-1">{{ event.bookedCount }} / {{ event.capacity }} booked</p>
            <div
              class="progress mb-3"
              style="height: 10px"
              role="progressbar"
              :aria-valuenow="event.bookedCount"
              aria-valuemin="0"
              :aria-valuemax="event.capacity"
              :aria-label="`${event.bookedCount} of ${event.capacity} places booked`"
            >
              <div class="progress-bar bg-success" :style="{ width: (event.bookedCount / event.capacity) * 100 + '%' }"></div>
            </div>

            <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success py-2" role="status">{{ successMessage }}</div>

            <p v-if="isPast" class="text-muted mb-0">This planting day has finished.</p>
            <router-link v-else-if="!currentUser" to="/FireLogin" class="btn btn-brand rounded-pill w-100">
              Log in to book
            </router-link>
            <button
              v-else-if="isBooked"
              type="button"
              class="btn btn-outline-danger rounded-pill w-100"
              :disabled="isWorking"
              @click="toggleBooking"
            >
              {{ isWorking ? 'Cancelling…' : 'Cancel my booking' }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-brand rounded-pill w-100"
              :disabled="isWorking || isFull"
              @click="toggleBooking"
            >
              {{ isFull ? 'Fully booked' : isWorking ? 'Booking…' : `Book a place (${placesLeft} left)` }}
            </button>
          </div>

          <router-link
            v-if="grant"
            :to="`/map?grant=${grant.id}`"
            class="btn btn-outline-brand rounded-pill w-100"
          >
            <NavigateIcon /> Get directions
          </router-link>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.event-hero {
  background-color: var(--gr-green);
  background-size: cover;
  background-position: center;
}
.event-hero-overlay {
  background: linear-gradient(90deg, rgba(22, 59, 39, 0.92), rgba(22, 59, 39, 0.5));
}
</style>
