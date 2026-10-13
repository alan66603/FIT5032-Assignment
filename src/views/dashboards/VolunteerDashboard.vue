<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/init'
import { currentUser, userRole } from '@/auth'
import UserAvatar from '@/components/UserAvatar.vue'
import { events, myEvents, myBookings } from '@/eventsStore'
import { grants } from '@/data/grants'
import MyBookings from '@/components/MyBookings.vue'

// Everything on this dashboard comes from the volunteer's real bookings and ratings.

const myRatings = ref([])

onMounted(async () => {
  try {
    const myRatingsQuery = query(collection(db, 'ratings'), where('uid', '==', currentUser.value.uid))
    const snapshot = await getDocs(myRatingsQuery)
    myRatings.value = snapshot.docs.map((ratingDoc) => ratingDoc.data())
  } catch (error) {
    console.error('Error loading ratings:', error)
  }
})

const stats = computed(() => [
  { icon: '📅', value: myEvents.value.filter((event) => event.start > new Date()).length, label: 'upcoming bookings' },
  { icon: '🌱', value: myEvents.value.filter((event) => event.end <= new Date()).length, label: 'planting days attended' },
  { icon: '⭐', value: myRatings.value.length, label: 'grants rated' },
])

// Recent activity: my ratings and bookings together, newest first.
const recentActivity = computed(() => {
  const items = []
  for (const rating of myRatings.value) {
    const grant = grants.find((g) => g.id === rating.grantId)
    if (grant && rating.updatedAt) {
      items.push({ text: `Rated "${grant.project}" ${rating.score} ★`, date: rating.updatedAt.toDate() })
    }
  }
  for (const booking of myBookings.value) {
    const event = events.value.find((e) => e.id === booking.eventId)
    // bookedAt is briefly null right after booking, until the server sets the time.
    if (event && booking.bookedAt) {
      items.push({ text: `Booked "${event.title}"`, date: booking.bookedAt.toDate() })
    }
  }
  return items.sort((a, b) => b.date - a.date).slice(0, 5)
})
</script>

<template>
  <section class="page-banner">
    <div class="container d-flex align-items-center gap-4">
      <UserAvatar :size="88" />
      <div>
        <p class="eyebrow mb-2">Volunteer Dashboard</p>
        <h1 class="h2 fw-bold mb-1">Welcome back 👋</h1>
        <p class="mb-0">
          {{ currentUser?.email }}
          <span class="badge bg-light text-brand text-capitalize ms-2">{{ userRole }}</span>
        </p>
      </div>
    </div>
  </section>

  <div class="container py-5">
    <!-- Stats -->
    <div class="row g-4 mb-4">
      <div v-for="stat in stats" :key="stat.label" class="col-md-4">
        <div class="card p-4 h-100 d-flex flex-row align-items-center">
          <div class="icon-circle me-3">{{ stat.icon }}</div>
          <div>
            <div class="fs-3 fw-bold text-brand">{{ stat.value }}</div>
            <div class="small text-muted">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- My upcoming bookings -->
      <div class="col-lg-7">
        <MyBookings />
      </div>

      <!-- Recent activity -->
      <div class="col-lg-5">
        <div class="card p-4 h-100">
          <h2 class="h5 fw-bold mb-3">Recent activity</h2>
          <p v-if="recentActivity.length === 0" class="text-muted mb-0">
            Nothing yet. <router-link to="/grants" class="text-brand">Rate a grant</router-link> or
            <router-link to="/events" class="text-brand">book a planting day</router-link>.
          </p>
          <ul v-else class="list-unstyled mb-0">
            <li v-for="item in recentActivity" :key="item.text + item.date" class="mb-3">
              <div class="small">{{ item.text }}</div>
              <div class="small text-muted">{{ item.date.toLocaleDateString('en-AU') }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
