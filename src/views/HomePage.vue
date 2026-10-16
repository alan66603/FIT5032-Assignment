<script setup>
import { computed } from 'vue'
// grants is a computed list that includes status changes made by admins.
import { grants } from '@/grantsStore'
import { upcomingEvents } from '@/eventsStore'
import { currentUser, userRole, DASHBOARD_PATHS } from '@/auth'

// Headline numbers derived from the grant list, same computed() pattern as
// the filtering on the Grants page.
const stats = computed(() => ({
  total: grants.value.length,
  funding: grants.value.reduce((sum, grant) => sum + grant.amount, 0),
  approved: grants.value.filter((grant) => grant.status === 'Approved').length,
  suburbs: new Set(grants.value.map((grant) => grant.suburb)).size,
}))

// Approved grants shown as photo cards in "Featured projects".
const featuredGrants = computed(() => grants.value.filter((grant) => grant.status === 'Approved'))

// The next three planting days from Firestore, and the very next one for the call to action.
const nextEvents = computed(() => upcomingEvents.value.slice(0, 3))
const nextEvent = computed(() => upcomingEvents.value[0] ?? null)
const grantFor = (event) => grants.value.find((grant) => grant.id === event.grantId)

const eventDay = (date) => date.toLocaleDateString('en-AU', { day: '2-digit' })
const eventMonth = (date) => date.toLocaleDateString('en-AU', { month: 'short' })
const eventTime = (date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
const eventLongDate = (date) => date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

const dashboardPath = computed(() => DASHBOARD_PATHS[userRole.value] ?? '/')

const helpCards = [
  {
    image: '/images/volunteer.jpg',
    title: 'Volunteer',
    text: 'Join planting days, verge gardens and creek clean-ups in your own suburb.',
    linkText: 'Register as a volunteer',
    to: '/FireRegister',
  },
  {
    image: '/images/corporate.jpg',
    title: 'Corporate Partner',
    text: 'Sponsor a project and bring your team along for a hands-on greening day.',
    linkText: 'Register your organisation',
    to: '/FireRegister',
  },
  {
    image: '/images/canopy.jpg',
    title: 'Community Grants',
    text: 'Browse funded projects across Melbourne and rate the ones you care about.',
    linkText: 'View grants',
    to: '/grants',
  },
]
</script>

<template>
  <!-- Hero: photo background with a green overlay (see .hero in <style>) -->
  <section class="hero text-white d-flex align-items-center">
    <div class="container py-5">
      <div class="row">
        <div class="col-lg-7">
          <p class="eyebrow mb-2">GreenRoots Melbourne</p>
          <h1 class="display-4 fw-bold mb-3">Greening Melbourne,<br />one street at a time.</h1>
          <p class="lead mb-4 hero-text">
            Community-led tree planting, pocket forests and rain gardens across Melbourne's
            inner suburbs — funded by grants, built by volunteers and corporate partners.
          </p>

          <template v-if="currentUser">
            <p class="mb-3">
              Welcome back, <strong>{{ currentUser.email }}</strong>
            </p>
            <router-link class="btn btn-light btn-lg rounded-pill px-4" :to="dashboardPath">
              Go to Dashboard
            </router-link>
          </template>
          <template v-else>
            <router-link class="btn btn-light btn-lg rounded-pill px-4 me-2 mb-2" to="/grants">
              Browse Grants
            </router-link>
            <router-link class="btn btn-outline-light btn-lg rounded-pill px-4 mb-2" to="/FireRegister">
              Join as a Volunteer
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats: cards pulled up over the bottom of the hero -->
  <section class="container stats-row">
    <div class="row g-3">
      <div class="col-6 col-md-3">
        <div class="card text-center p-3 h-100">
          <div class="fs-2 fw-bold text-brand">{{ stats.total }}</div>
          <div class="small text-muted">grants</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center p-3 h-100">
          <div class="fs-2 fw-bold text-brand">${{ stats.funding.toLocaleString() }}</div>
          <div class="small text-muted">total funding</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center p-3 h-100">
          <div class="fs-2 fw-bold text-brand">{{ stats.approved }}</div>
          <div class="small text-muted">approved</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card text-center p-3 h-100">
          <div class="fs-2 fw-bold text-brand">{{ stats.suburbs }}</div>
          <div class="small text-muted">suburbs</div>
        </div>
      </div>
    </div>
  </section>

  <!-- How can you help -->
  <section class="container py-5">
    <p class="eyebrow mb-1">Get involved</p>
    <h2 class="fw-bold mb-4">How can you help?</h2>
    <div class="row g-4">
      <div v-for="card in helpCards" :key="card.title" class="col-md-4">
        <div class="card card-hover h-100">
          <img :src="card.image" class="card-img-top" :alt="card.title" />
          <div class="card-body d-flex flex-column">
            <h3 class="h5 fw-bold">{{ card.title }}</h3>
            <p class="text-muted flex-grow-1">{{ card.text }}</p>
            <router-link :to="card.to" class="fw-semibold text-brand text-decoration-none">
              {{ card.linkText }} →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Upcoming planting days (real events from Firestore; each opens its own page) -->
  <section class="container pb-5">
    <div class="d-flex justify-content-between align-items-end mb-4">
      <div>
        <p class="eyebrow mb-1">Join us</p>
        <h2 class="fw-bold mb-0">Upcoming planting days</h2>
      </div>
      <router-link to="/events" class="btn btn-outline-brand rounded-pill px-4">All events</router-link>
    </div>
    <p v-if="nextEvents.length === 0" class="text-muted">No planting days scheduled yet. Check back soon!</p>
    <div class="row g-4">
      <div v-for="event in nextEvents" :key="event.id" class="col-md-4">
        <router-link :to="`/events/${event.id}`" class="card card-hover h-100 p-4 text-reset text-decoration-none">
          <div class="d-flex align-items-center mb-3">
            <div class="date-box me-3" aria-hidden="true">
              <div class="fw-bold fs-5">{{ eventDay(event.start) }}</div>
              <div class="small text-uppercase">{{ eventMonth(event.start) }}</div>
            </div>
            <div>
              <h3 class="h6 fw-bold mb-1">{{ event.title }}</h3>
              <div class="small text-muted">{{ eventTime(event.start) }} – {{ eventTime(event.end) }}</div>
            </div>
          </div>
          <p class="small text-muted mb-2">📍 {{ event.place }}</p>
          <p v-if="grantFor(event)" class="small mb-3">🌳 {{ grantFor(event).project }}</p>
          <span class="small fw-semibold text-brand mt-auto">
            {{ event.bookedCount >= event.capacity ? 'Fully booked' : `${event.capacity - event.bookedCount} places left` }} →
          </span>
        </router-link>
      </div>
    </div>
  </section>

  <!-- Featured projects -->
  <section class="bg-brand-soft py-5">
    <div class="container">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <p class="eyebrow mb-1">On the ground</p>
          <h2 class="fw-bold mb-0">Featured projects</h2>
        </div>
        <router-link to="/grants" class="btn btn-outline-brand rounded-pill px-4">See all</router-link>
      </div>
      <div class="row g-4">
        <div v-for="grant in featuredGrants" :key="grant.id" class="col-md-4">
          <!-- The whole card opens the grant's own page -->
          <router-link :to="`/grants/${grant.id}`" class="card card-hover h-100 text-reset text-decoration-none">
            <img :src="grant.image" class="card-img-top" :alt="grant.project" />
            <div class="card-body">
              <span class="badge bg-brand-soft text-brand mb-2">📍 {{ grant.suburb }}</span>
              <h3 class="h5 fw-bold">{{ grant.project }}</h3>
              <p class="small text-muted mb-0">{{ grant.description }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonial (demo quote) -->
  <section class="container py-5 text-center">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <p class="fs-4 fst-italic mb-3">
          “Our laneway used to be bins and concrete. Now the kids walk to school under trees, and
          we know every neighbour by name.”
        </p>
        <p class="fw-semibold mb-0">Priya N.</p>
        <p class="small text-muted">Volunteer, Collingwood</p>
      </div>
    </div>
  </section>

  <!-- Call to action -->
  <section class="container">
    <div class="bg-brand rounded-4 p-5 text-center">
      <h2 class="fw-bold mb-2">Ready to get your hands dirty?</h2>
      <!-- The real next planting day from Firestore -->
      <p v-if="nextEvent" class="mb-4 opacity-75">
        Our next community planting day is {{ nextEvent.title }} on {{ eventLongDate(nextEvent.start) }}
        at {{ nextEvent.place }}.
      </p>
      <p v-else class="mb-4 opacity-75">New planting days are added every month.</p>
      <router-link v-if="nextEvent" class="btn btn-light rounded-pill px-4 me-2 mb-2" :to="`/events/${nextEvent.id}`">
        See this planting day
      </router-link>
      <router-link v-if="!currentUser" class="btn btn-outline-light rounded-pill px-4 mb-2" to="/FireRegister">
        Sign up to volunteer
      </router-link>
    </div>
  </section>
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
  flex-shrink: 0;
}

/* Two backgrounds stacked: a see-through green gradient on top of the photo */
.hero {
  min-height: 70vh;
  background-image:
    linear-gradient(rgba(22, 59, 39, 0.75), rgba(22, 59, 39, 0.55)),
    url('/images/hero.jpg');
  background-size: cover;
  background-position: center;
  padding-bottom: 4rem;
}
.hero-text {
  color: rgba(255, 255, 255, 0.85);
}

/* Negative margin pulls the stat cards up so they overlap the hero */
.stats-row {
  margin-top: -3rem;
  position: relative;
}
</style>
