<script setup>
const services = [
  {
    icon: '🌳',
    title: 'Street trees & pocket forests',
    text: 'Dense native plantings on laneways, school grounds and rooftops that cool the street and bring back birds and insects.',
  },
  {
    icon: '🌧️',
    title: 'Rain gardens & verge planting',
    text: 'Nature strips and kerbside gardens that soak up stormwater before it reaches our creeks and the Yarra.',
  },
  {
    icon: '🤝',
    title: 'Volunteer & corporate planting days',
    text: 'Hands-on days where residents and workplace teams plant, mulch and water alongside our coordinators.',
  },
]

const steps = [
  { title: 'Apply for a grant', text: 'A resident group or school submits a small greening project.' },
  { title: 'Review & approve', text: 'Our team checks the site, budget and council permissions.' },
  { title: 'Plant with volunteers', text: 'Volunteers and corporate partners deliver the project on the ground.' },
  { title: 'Rate & report back', text: 'The community rates the outcome so funding follows what works.' },
]
</script>

<template>
  <!-- Intro -->
  <section class="container py-5">
    <h1 class="display-6 fw-bold mb-3">About GreenRoots Melbourne</h1>
    <div class="row">
      <div class="col-lg-8">
        <p class="lead text-muted">
          GreenRoots Melbourne is a not-for-profit that turns council and corporate funding into
          small, street-level greening projects across Melbourne's inner north and west.
        </p>
        <p>
          We believe the fastest way to a cooler, greener city is a thousand small projects run by
          the people who live there. We handle the grants, permits and plants; local volunteers and
          workplace teams do the digging. Every project is rated by the community when it is done,
          so the next round of funding goes to what actually works.
        </p>
      </div>
    </div>
  </section>

  <!-- What we do -->
  <section class="bg-light border-top border-bottom py-5">
    <div class="container">
      <h2 class="fw-bold mb-4">What we do</h2>
      <div class="row g-4">
        <div v-for="service in services" :key="service.title" class="col-md-4">
          <div class="fs-1 mb-2">{{ service.icon }}</div>
          <h3 class="h5 fw-bold">{{ service.title }}</h3>
          <p class="text-muted mb-0">{{ service.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="container py-5">
    <h2 class="fw-bold mb-4">How it works</h2>
    <div class="row g-4">
      <div v-for="(step, index) in steps" :key="step.title" class="col-6 col-md-3">
        <div class="d-flex align-items-center mb-2">
          <span
            class="badge rounded-circle bg-dark me-2 d-inline-flex align-items-center justify-content-center step-number"
          >
            {{ index + 1 }}
          </span>
          <h3 class="h6 fw-bold mb-0">{{ step.title }}</h3>
        </div>
        <p class="small text-muted mb-0">{{ step.text }}</p>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section class="bg-light border-top py-5">
    <div class="container">
      <h2 class="fw-bold mb-3">Get in touch</h2>
      <p class="mb-1">
        <a href="mailto:hello@greenroots.org.au" class="text-dark">hello@greenroots.org.au</a>
      </p>
      <p class="text-muted mb-4">Fitzroy, VIC 3065</p>
      <router-link class="btn btn-dark rounded-pill px-4 me-2" to="/grants">Browse Grants</router-link>
      <router-link class="btn btn-outline-dark rounded-pill px-4" to="/FireRegister">Register</router-link>
    </div>
  </section>
</template>

<style scoped>
.step-number {
  width: 1.75rem;
  height: 1.75rem;
}
</style>
