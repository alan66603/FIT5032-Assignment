<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import Dialog from 'primevue/dialog'
import { currentUser, userRole } from '@/auth'
import { events, myBookedEventIds, bookEvent, cancelBooking, createEvent } from '@/eventsStore'
import { grants } from '@/grantsStore'

// BR F.1: booking planting days with calendar constraints (FullCalendar + Firestore).

const isAdmin = computed(() => userRole.value === 'admin')

const isPast = (event) => event.start <= new Date()
const isFull = (event) => event.bookedCount >= event.capacity
const isBooked = (event) => myBookedEventIds.value.has(event.id)
const spotsLeft = (event) => event.capacity - event.bookedCount

// The grant project an event belongs to (events store its grantId).
const grantFor = (event) => grants.value.find((grant) => grant.id === event.grantId)

const formatDateTime = (date) =>
  date.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const formatTime = (date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })

// Colour each event on the calendar: blue = booked by me, grey = full or past, green = places left.
const eventColour = (event) => {
  if (isBooked(event)) return '#0d6efd'
  if (isPast(event) || isFull(event)) return '#6c757d'
  return '#2e7d32'
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
  height: 'auto',
  events: events.value.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: eventColour(event),
    borderColor: eventColour(event),
  })),
  eventClick: (info) => openEvent(info.event.id),
  // Admins click an empty day to add an event on that day.
  dateClick: (info) => {
    if (isAdmin.value) openNewEvent(info.dateStr.slice(0, 10))
  },
}))

// Upcoming events as a plain list too (easier with a keyboard or screen reader).
const upcomingEvents = computed(() =>
  events.value.filter((event) => !isPast(event)).sort((a, b) => a.start - b.start),
)

// --- Event details + booking ---
const selectedId = ref(null)
const selectedEvent = computed(() => events.value.find((event) => event.id === selectedId.value) ?? null)
const detailsVisible = ref(false)
const isWorking = ref(false)
const bookingError = ref(null)
const bookingMessage = ref(null)

const openEvent = (eventId) => {
  selectedId.value = eventId
  bookingError.value = null
  bookingMessage.value = null
  detailsVisible.value = true
}

// Coming from a dashboard link (/events?event=abc123): open that event's
// details as soon as the events have loaded from Firestore.
const route = useRoute()
watch(
  [events, () => route.query.event],
  ([eventList, eventId]) => {
    if (eventId && selectedId.value !== eventId && eventList.some((event) => event.id === eventId)) {
      openEvent(eventId)
    }
  },
  { immediate: true },
)

const book = async () => {
  bookingError.value = null
  bookingMessage.value = null
  isWorking.value = true
  try {
    await bookEvent(selectedEvent.value)
    bookingMessage.value = "You're booked in! It's now on your dashboard."
  } catch (error) {
    console.error('Error booking event:', error)
    bookingError.value = error.message
  } finally {
    isWorking.value = false
  }
}

const cancel = async () => {
  bookingError.value = null
  bookingMessage.value = null
  isWorking.value = true
  try {
    await cancelBooking(selectedEvent.value)
    bookingMessage.value = 'Your booking has been cancelled.'
  } catch (error) {
    console.error('Error cancelling booking:', error)
    bookingError.value = error.message
  } finally {
    isWorking.value = false
  }
}

// --- Admin: add an event ---
const newEventVisible = ref(false)
const isSaving = ref(false)
const newEventError = ref(null)
const emptyForm = (date = '') => ({
  grantId: null,
  title: '',
  place: '',
  description: '',
  date,
  startTime: '09:00',
  endTime: '12:00',
  capacity: 20,
})
const newEvent = ref(emptyForm())

const openNewEvent = (date = '') => {
  newEvent.value = emptyForm(date)
  newEventError.value = null
  newEventVisible.value = true
}

// Choosing a grant fills in its suburb as the place, if the place is still empty.
const onGrantChosen = () => {
  const grant = grants.value.find((g) => g.id === newEvent.value.grantId)
  if (grant && !newEvent.value.place.trim()) newEvent.value.place = grant.suburb
}

const saveNewEvent = async () => {
  newEventError.value = null
  const form = newEvent.value
  if (!form.grantId) {
    newEventError.value = 'Please choose which grant this planting day is for.'
    return
  }
  // "2026-10-25" + "09:00" -> a Date in the browser's local time (Melbourne).
  const start = new Date(`${form.date}T${form.startTime}`)
  const end = new Date(`${form.date}T${form.endTime}`)

  if (!form.title.trim() || !form.place.trim() || !form.date) {
    newEventError.value = 'Please fill in the title, place and date.'
    return
  }
  if (end <= start) {
    newEventError.value = 'The end time must be after the start time.'
    return
  }
  if (start <= new Date()) {
    newEventError.value = 'The event must be in the future.'
    return
  }
  if (!Number.isInteger(form.capacity) || form.capacity < 1) {
    newEventError.value = 'Capacity must be a whole number of at least 1.'
    return
  }

  isSaving.value = true
  try {
    await createEvent({
      grantId: form.grantId,
      title: form.title.trim(),
      place: form.place.trim(),
      description: form.description.trim(),
      start,
      end,
      capacity: form.capacity,
    })
    newEventVisible.value = false
  } catch (error) {
    console.error('Error creating event:', error)
    newEventError.value = 'Could not save the event. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Get involved</p>
      <h1 class="display-6 fw-bold mb-2">Planting Days</h1>
      <p class="lead mb-0">Book a place at an upcoming planting, mulching or clean-up day.</p>
    </div>
  </section>

  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <p class="small text-muted mb-0">
        <span class="legend-dot" style="background: #2e7d32"></span> Places left
        <span class="legend-dot ms-3" style="background: #0d6efd"></span> Booked by you
        <span class="legend-dot ms-3" style="background: #6c757d"></span> Full or finished
      </p>
      <button v-if="isAdmin" type="button" class="btn btn-brand rounded-pill px-4" @click="openNewEvent()">
        + Add event
      </button>
    </div>
    <p v-if="!currentUser" class="small text-muted">
      <router-link to="/FireLogin">Log in</router-link> to book a place.
    </p>
    <p v-if="isAdmin" class="small text-muted">Admins: click an empty day on the calendar to add an event on that day.</p>

    <div class="card p-3 mb-5 calendar">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- Same events as a list -->
    <h2 class="h4 fw-bold mb-3">Upcoming planting days</h2>
    <p v-if="upcomingEvents.length === 0" class="text-muted">No upcoming events yet. Check back soon!</p>
    <div class="row g-3">
      <div v-for="event in upcomingEvents" :key="event.id" class="col-md-6 col-lg-4">
        <div class="card p-3 h-100">
          <h3 class="h6 fw-bold mb-1">{{ event.title }}</h3>
          <p v-if="grantFor(event)" class="small mb-1">
            🌳 <router-link :to="`/grants/${event.grantId}`" class="text-brand">{{ grantFor(event).project }}</router-link>
          </p>
          <p class="small text-muted mb-2">
            📅 {{ formatDateTime(event.start) }} – {{ formatTime(event.end) }}<br />
            📍 {{ event.place }}
          </p>
          <div class="d-flex justify-content-between align-items-center mt-auto">
            <span v-if="isBooked(event)" class="badge bg-primary">Booked</span>
            <span v-else-if="isFull(event)" class="badge bg-secondary">Full</span>
            <span v-else class="badge bg-success">{{ spotsLeft(event) }} places left</span>
            <button
              type="button"
              class="btn btn-outline-brand btn-sm rounded-pill px-3"
              :aria-label="`Details for ${event.title}`"
              @click="openEvent(event.id)"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Event details -->
  <Dialog v-model:visible="detailsVisible" :header="selectedEvent?.title" modal :style="{ width: '30rem' }">
    <template v-if="selectedEvent">
      <p v-if="grantFor(selectedEvent)" class="mb-2">
        🌳 Part of
        <router-link :to="`/grants/${selectedEvent.grantId}`" class="text-brand fw-semibold">
          {{ grantFor(selectedEvent).project }}
        </router-link>
      </p>
      <p class="mb-1">📅 {{ formatDateTime(selectedEvent.start) }} – {{ formatTime(selectedEvent.end) }}</p>
      <p class="mb-2">📍 {{ selectedEvent.place }}</p>
      <p v-if="selectedEvent.description" class="text-muted">{{ selectedEvent.description }}</p>
      <p class="fw-semibold">
        {{ selectedEvent.bookedCount }} / {{ selectedEvent.capacity }} places booked
      </p>

      <div v-if="bookingError" class="alert alert-danger py-2" role="alert">{{ bookingError }}</div>
      <div v-if="bookingMessage" class="alert alert-success py-2" role="status">{{ bookingMessage }}</div>

      <div class="d-flex justify-content-end gap-2">
        <router-link v-if="!currentUser" to="/FireLogin" class="btn btn-brand rounded-pill px-4">
          Log in to book
        </router-link>
        <template v-else-if="isPast(selectedEvent)">
          <span class="text-muted small align-self-center">This event has finished.</span>
        </template>
        <button
          v-else-if="isBooked(selectedEvent)"
          type="button"
          class="btn btn-outline-danger rounded-pill px-4"
          :disabled="isWorking"
          @click="cancel"
        >
          {{ isWorking ? 'Cancelling…' : 'Cancel my booking' }}
        </button>
        <button
          v-else
          type="button"
          class="btn btn-brand rounded-pill px-4"
          :disabled="isWorking || isFull(selectedEvent)"
          @click="book"
        >
          {{ isFull(selectedEvent) ? 'Full' : isWorking ? 'Booking…' : 'Book a place' }}
        </button>
      </div>
    </template>
  </Dialog>

  <!-- Admin: add event -->
  <Dialog v-model:visible="newEventVisible" header="Add a planting day" modal :style="{ width: '32rem' }">
    <form @submit.prevent="saveNewEvent" novalidate>
      <div class="mb-3">
        <label for="event-grant" class="form-label">Grant project</label>
        <select id="event-grant" v-model="newEvent.grantId" class="form-select" @change="onGrantChosen">
          <option :value="null" disabled>Choose a grant…</option>
          <option v-for="grant in grants" :key="grant.id" :value="grant.id">
            {{ grant.project }} ({{ grant.suburb }})
          </option>
        </select>
      </div>
      <div class="mb-3">
        <label for="event-title" class="form-label">Title</label>
        <input id="event-title" v-model="newEvent.title" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label for="event-place" class="form-label">Place</label>
        <input id="event-place" v-model="newEvent.place" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label for="event-description" class="form-label">Description (optional)</label>
        <textarea id="event-description" v-model="newEvent.description" class="form-control" rows="2"></textarea>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label for="event-date" class="form-label">Date</label>
          <input id="event-date" v-model="newEvent.date" type="date" class="form-control" />
        </div>
        <div class="col-3">
          <label for="event-start" class="form-label">Start</label>
          <input id="event-start" v-model="newEvent.startTime" type="time" class="form-control" />
        </div>
        <div class="col-3">
          <label for="event-end" class="form-label">End</label>
          <input id="event-end" v-model="newEvent.endTime" type="time" class="form-control" />
        </div>
      </div>
      <div class="mb-3">
        <label for="event-capacity" class="form-label">Places available</label>
        <input id="event-capacity" v-model.number="newEvent.capacity" type="number" min="1" class="form-control" />
      </div>

      <div v-if="newEventError" class="alert alert-danger py-2" role="alert">{{ newEventError }}</div>

      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-light rounded-pill px-3" @click="newEventVisible = false">Cancel</button>
        <button type="submit" class="btn btn-brand rounded-pill px-4" :disabled="isSaving">
          {{ isSaving ? 'Saving…' : 'Add event' }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
/* FullCalendar draws its own HTML, so :deep() is needed to style it.
   Use the site's green for the buttons and today's date. */
.calendar :deep(.fc) {
  --fc-button-bg-color: var(--gr-green);
  --fc-button-border-color: var(--gr-green);
  --fc-button-hover-bg-color: var(--gr-green-dark);
  --fc-button-hover-border-color: var(--gr-green-dark);
  --fc-button-active-bg-color: var(--gr-green-dark);
  --fc-button-active-border-color: var(--gr-green-dark);
  --fc-today-bg-color: var(--gr-green-soft);
}

/* Day numbers and weekday names are links inside FullCalendar; the site's
   link style underlined them, so show them as plain text. */
.calendar :deep(.fc a) {
  color: inherit;
  text-decoration: none;
}

.legend-dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  vertical-align: middle;
}
</style>
