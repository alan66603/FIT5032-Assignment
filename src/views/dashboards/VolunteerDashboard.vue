<script setup>
import { currentUser, userRole } from '@/auth'

// ---- Demo data (not stored in Firestore yet) ----
const stats = [
  { icon: '⏱️', value: 42, label: 'hours volunteered' },
  { icon: '📅', value: 9, label: 'events attended' },
  { icon: '🌱', value: 156, label: 'trees planted' },
]

// Yearly goal for the progress bar
const hoursGoal = 60
const hoursDone = 42

const upcomingEvents = [
  { day: '25', month: 'Oct', title: 'Kensington Verge Planting', place: 'Macaulay Rd, Kensington', time: '9:00am – 12:00pm' },
  { day: '02', month: 'Nov', title: 'Moonee Ponds Creek Clean-up', place: 'Debney Park, Flemington', time: '8:30am – 11:30am' },
  { day: '16', month: 'Nov', title: 'Laneway Forest Mulching Day', place: 'Easey St, Collingwood', time: '10:00am – 1:00pm' },
]

const recentActivity = [
  { text: 'Planted 18 seedlings at Laneway Pocket Forest', date: '12/10/2026' },
  { text: 'Rated "Union Street Community Garden" 5 stars', date: '08/10/2026' },
  { text: 'Attended Footscray Schoolyard Shade Trees day', date: '27/09/2026' },
]
</script>

<template>
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Volunteer Dashboard</p>
      <h1 class="h2 fw-bold mb-1">Welcome back 👋</h1>
      <p class="mb-0">
        {{ currentUser?.email }}
        <span class="badge bg-light text-brand text-capitalize ms-2">{{ userRole }}</span>
      </p>
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
      <!-- Upcoming events -->
      <div class="col-lg-7">
        <div class="card p-4 h-100">
          <h2 class="h5 fw-bold mb-3">Upcoming planting days</h2>
          <div
            v-for="event in upcomingEvents"
            :key="event.title"
            class="d-flex align-items-center py-3 border-bottom"
          >
            <div class="date-box me-3">
              <div class="fw-bold fs-5">{{ event.day }}</div>
              <div class="small text-uppercase">{{ event.month }}</div>
            </div>
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ event.title }}</div>
              <div class="small text-muted">📍 {{ event.place }} · {{ event.time }}</div>
            </div>
            <span class="badge rounded-pill bg-brand-soft text-brand">Going</span>
          </div>
        </div>
      </div>

      <!-- Goal + activity -->
      <div class="col-lg-5">
        <div class="card p-4 mb-4">
          <h2 class="h5 fw-bold mb-3">2026 hours goal</h2>
          <div class="progress mb-2" style="height: 12px">
            <div
              class="progress-bar bg-success"
              :style="{ width: (hoursDone / hoursGoal) * 100 + '%' }"
            ></div>
          </div>
          <p class="small text-muted mb-0">{{ hoursDone }} of {{ hoursGoal }} hours — almost there!</p>
        </div>

        <div class="card p-4">
          <h2 class="h5 fw-bold mb-3">Recent activity</h2>
          <ul class="list-unstyled mb-0">
            <li v-for="item in recentActivity" :key="item.text" class="mb-3">
              <div class="small">{{ item.text }}</div>
              <div class="small text-muted">{{ item.date }}</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
