<script setup>
import { currentUser, userRole } from '@/auth'
import { grants } from '@/data/grants'

// ---- Demo data (not stored in Firestore yet) ----
const stats = [
  { icon: '💰', value: '$28,500', label: 'total sponsored' },
  { icon: '👥', value: '64', label: 'staff volunteers' },
  { icon: '🌍', value: '3.2 t', label: 'CO₂ offset / year' },
]

// Projects this company sponsors: grant id + how much of the work is done (%)
const sponsorships = [
  { grantId: 1, progress: 80 },
  { grantId: 3, progress: 45 },
  { grantId: 7, progress: 100 },
]

// Look up each grant so we can show its name, image and suburb.
const sponsoredProjects = sponsorships.map((item) => ({
  ...item,
  grant: grants.find((grant) => grant.id === item.grantId),
}))

const teamDays = [
  { date: '30/10/2026', title: 'Team planting day – Footscray', spots: '12 / 20 booked' },
  { date: '21/11/2026', title: 'End-of-year mulching – Collingwood', spots: '5 / 15 booked' },
]
</script>

<template>
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Corporate Dashboard</p>
      <h1 class="h2 fw-bold mb-1">Your greening impact</h1>
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

    <!-- Sponsored projects -->
    <h2 class="h5 fw-bold mb-3">Projects you sponsor</h2>
    <div class="row g-4 mb-4">
      <div v-for="item in sponsoredProjects" :key="item.grantId" class="col-md-4">
        <div class="card card-hover h-100">
          <img :src="item.grant.image" class="card-img-top" :alt="item.grant.project" />
          <div class="card-body">
            <h3 class="h6 fw-bold mb-1">{{ item.grant.project }}</h3>
            <p class="small text-muted mb-3">📍 {{ item.grant.suburb }}</p>
            <div class="progress mb-1" style="height: 8px">
              <div class="progress-bar bg-success" :style="{ width: item.progress + '%' }"></div>
            </div>
            <div class="small text-muted">
              {{ item.progress === 100 ? 'Completed 🎉' : item.progress + '% complete' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team days -->
    <div class="card p-4">
      <h2 class="h5 fw-bold mb-3">Upcoming team days</h2>
      <div
        v-for="day in teamDays"
        :key="day.title"
        class="d-flex flex-wrap justify-content-between align-items-center py-3 border-bottom"
      >
        <div>
          <div class="fw-semibold">{{ day.title }}</div>
          <div class="small text-muted">{{ day.date }}</div>
        </div>
        <span class="badge rounded-pill bg-brand-soft text-brand">{{ day.spots }}</span>
      </div>
    </div>
  </div>
</template>
