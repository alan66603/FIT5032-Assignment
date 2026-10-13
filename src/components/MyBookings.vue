<script setup>
import { computed } from 'vue'
import { myEvents } from '@/eventsStore'
import NavigateIcon from '@/components/NavigateIcon.vue'

defineProps({
  title: { type: String, default: 'My upcoming planting days' },
})

// Only events that haven't started yet, soonest first (myEvents is already sorted).
const upcoming = computed(() => myEvents.value.filter((event) => event.start > new Date()))

const day = (date) => date.toLocaleDateString('en-AU', { day: '2-digit' })
const month = (date) => date.toLocaleDateString('en-AU', { month: 'short' })
const time = (date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <div class="card p-4 h-100">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="h5 fw-bold mb-0">{{ title }}</h2>
      <router-link to="/events" class="small text-brand">All events →</router-link>
    </div>

    <p v-if="upcoming.length === 0" class="text-muted mb-0">
      You haven't booked any upcoming events.
      <router-link to="/events" class="text-brand">Find a planting day</router-link>
    </p>

    <div v-for="event in upcoming" :key="event.id" class="d-flex align-items-center py-3 border-bottom">
      <div class="date-box me-3" aria-hidden="true">
        <div class="fw-bold fs-5">{{ day(event.start) }}</div>
        <div class="small text-uppercase">{{ month(event.start) }}</div>
      </div>
      <div class="flex-grow-1">
        <!-- Opens this event's details on the Events page -->
        <router-link :to="`/events?event=${event.id}`" class="fw-semibold text-brand event-link">
          {{ event.title }}
        </router-link>
        <div class="small text-muted">
          📍 {{ event.place }} · {{ time(event.start) }} – {{ time(event.end) }}
        </div>
      </div>
      <div class="d-flex flex-column align-items-end gap-2">
        <span class="badge rounded-pill bg-brand-soft text-brand">Going</span>
        <!-- Map zoomed to the event's grant, chosen as the directions destination -->
        <router-link
          :to="`/map?grant=${event.grantId}`"
          class="text-brand directions-link"
          :aria-label="`Directions to ${event.title}`"
          :title="`Directions to ${event.title}`"
        >
          <NavigateIcon size="1.6em" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Icon-only Directions link: no button box, just the icon. */
.directions-link {
  line-height: 1;
  transition: opacity 0.15s ease;
}
.directions-link:hover {
  opacity: 0.7;
}

.event-link {
  text-decoration: none;
}
.event-link:hover {
  text-decoration: underline;
}

.date-box {
  width: 3.5rem;
  text-align: center;
  padding: 0.4rem 0;
  border-radius: 0.75rem;
  background-color: var(--gr-green-soft);
  color: var(--gr-green);
  line-height: 1.1;
}
</style>
