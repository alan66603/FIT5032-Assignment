<script setup>
import { computed } from 'vue'
import { currentUser, userRole } from '@/auth'
import { grants } from '@/data/grants'

// Grant numbers come from grants.js; user numbers are demo values.
const stats = computed(() => [
  { icon: '👤', value: 128, label: 'registered users' },
  { icon: '📄', value: grants.length, label: 'grants' },
  { icon: '⏳', value: grants.filter((grant) => grant.status === 'In Review').length, label: 'awaiting review' },
  { icon: '💵', value: '$' + grants.reduce((sum, grant) => sum + grant.amount, 0).toLocaleString(), label: 'requested' },
])

const pendingGrants = computed(() => grants.filter((grant) => grant.status === 'In Review'))

// ---- Demo data (not stored in Firestore yet) ----
const recentUsers = [
  { email: 'priya.n@example.com', role: 'volunteer', joined: '11/10/2026' },
  { email: 'csr@acmeenergy.com.au', role: 'corporate', joined: '09/10/2026' },
  { email: 'liam.k@example.com', role: 'volunteer', joined: '07/10/2026' },
  { email: 'team@brightbank.com.au', role: 'corporate', joined: '02/10/2026' },
]

const quickLinks = [
  { icon: '📧', text: 'Send an email', to: '/email' },
  { icon: '🌳', text: 'View all grants', to: '/grants' },
  { icon: '👤', text: 'My profile', to: '/profile' },
]
</script>

<template>
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Admin Dashboard</p>
      <h1 class="h2 fw-bold mb-1">Site overview</h1>
      <p class="mb-0">
        {{ currentUser?.email }}
        <span class="badge bg-light text-brand text-capitalize ms-2">{{ userRole }}</span>
      </p>
    </div>
  </section>

  <div class="container py-5">
    <!-- Stats -->
    <div class="row g-4 mb-4">
      <div v-for="stat in stats" :key="stat.label" class="col-6 col-lg-3">
        <div class="card p-4 h-100 d-flex flex-row align-items-center">
          <div class="icon-circle me-3">{{ stat.icon }}</div>
          <div>
            <div class="fs-4 fw-bold text-brand">{{ stat.value }}</div>
            <div class="small text-muted">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Grants awaiting review -->
      <div class="col-lg-7">
        <div class="card p-4 h-100">
          <h2 class="h5 fw-bold mb-3">Grants awaiting review</h2>
          <div
            v-for="grant in pendingGrants"
            :key="grant.id"
            class="d-flex align-items-center py-3 border-bottom"
          >
            <img :src="grant.image" :alt="grant.project" class="thumb me-3" />
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ grant.project }}</div>
              <div class="small text-muted">{{ grant.suburb }} · ${{ grant.amount.toLocaleString() }}</div>
            </div>
            <span class="badge rounded-pill bg-warning text-dark">In Review</span>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="col-lg-5">
        <div class="card p-4 h-100">
          <h2 class="h5 fw-bold mb-3">Quick actions</h2>
          <div class="d-grid gap-2">
            <router-link
              v-for="link in quickLinks"
              :key="link.to"
              :to="link.to"
              class="btn btn-outline-brand text-start rounded-3 py-2"
            >
              {{ link.icon }} {{ link.text }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent sign-ups -->
      <div class="col-12">
        <div class="card overflow-hidden">
          <div class="p-4 pb-2">
            <h2 class="h5 fw-bold mb-0">Recent sign-ups</h2>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in recentUsers" :key="user.email">
                  <td class="ps-4">{{ user.email }}</td>
                  <td>
                    <span class="badge rounded-pill bg-brand-soft text-brand text-capitalize">{{ user.role }}</span>
                  </td>
                  <td>{{ user.joined }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 0.75rem;
}
</style>
