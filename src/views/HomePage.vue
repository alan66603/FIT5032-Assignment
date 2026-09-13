<script setup>
import { computed } from 'vue'
import { grants } from '@/data/grants'
import { currentUser, userRole, DASHBOARD_PATHS } from '@/auth'

// Headline numbers derived from the grant list, same computed() pattern as
// the filtering on the Grants page.
const stats = computed(() => ({
  total: grants.length,
  funding: grants.reduce((sum, grant) => sum + grant.amount, 0),
  approved: grants.filter((grant) => grant.status === 'Approved').length,
  suburbs: new Set(grants.map((grant) => grant.suburb)).size,
}))

const dashboardPath = computed(() => DASHBOARD_PATHS[userRole.value] ?? '/')

const helpCards = [
  {
    icon: '🌱',
    title: 'Volunteer',
    text: 'Join planting days, verge gardens and creek clean-ups in your own suburb.',
    linkText: 'Register as a volunteer',
    to: '/FireRegister',
  },
  {
    icon: '🏢',
    title: 'Corporate Partner',
    text: 'Sponsor a project and bring your team along for a hands-on greening day.',
    linkText: 'Register your organisation',
    to: '/FireRegister',
  },
  {
    icon: '💰',
    title: 'Community Grants',
    text: 'Browse funded projects across Melbourne and rate the ones you care about.',
    linkText: 'View grants',
    to: '/grants',
  },
]
</script>

<template>
  <!-- Hero -->
  <section class="container py-5">
    <div class="row align-items-center">
      <div class="col-lg-8">
        <p class="text-uppercase small fw-semibold text-success mb-2">GreenRoots Melbourne</p>
        <h1 class="display-5 fw-bold mb-3">Greening Melbourne,<br />one street at a time.</h1>
        <p class="lead text-muted mb-4">
          Community-led tree planting, pocket forests and rain gardens across Melbourne's
          inner suburbs — funded by grants, built by volunteers and corporate partners.
        </p>

        <template v-if="currentUser">
          <p class="mb-3">
            Welcome back, <strong>{{ currentUser.email }}</strong>
          </p>
          <router-link class="btn btn-dark rounded-pill px-4" :to="dashboardPath">
            Go to Dashboard
          </router-link>
        </template>
        <template v-else>
          <router-link class="btn btn-dark rounded-pill px-4 me-2" to="/grants">Browse Grants</router-link>
          <router-link class="btn btn-outline-dark rounded-pill px-4" to="/FireRegister">
            Join as a Volunteer
          </router-link>
        </template>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="bg-light border-top border-bottom py-4">
    <div class="container">
      <div class="row text-center">
        <div class="col-6 col-md-3 py-2">
          <div class="fs-2 fw-bold">{{ stats.total }}</div>
          <div class="small text-muted">grants</div>
        </div>
        <div class="col-6 col-md-3 py-2">
          <div class="fs-2 fw-bold">${{ stats.funding.toLocaleString() }}</div>
          <div class="small text-muted">total funding</div>
        </div>
        <div class="col-6 col-md-3 py-2">
          <div class="fs-2 fw-bold">{{ stats.approved }}</div>
          <div class="small text-muted">approved</div>
        </div>
        <div class="col-6 col-md-3 py-2">
          <div class="fs-2 fw-bold">{{ stats.suburbs }}</div>
          <div class="small text-muted">suburbs</div>
        </div>
      </div>
    </div>
  </section>

  <!-- How can you help -->
  <section class="container py-5">
    <h2 class="fw-bold mb-4">How can you help?</h2>
    <div class="row g-4">
      <div v-for="card in helpCards" :key="card.title" class="col-md-4">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="fs-1 mb-2">{{ card.icon }}</div>
            <h3 class="h5 fw-bold">{{ card.title }}</h3>
            <p class="text-muted flex-grow-1">{{ card.text }}</p>
            <router-link :to="card.to" class="fw-semibold text-dark">{{ card.linkText }} →</router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
