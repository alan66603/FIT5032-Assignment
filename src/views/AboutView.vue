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

// Demo impact numbers
const impact = [
  { value: '12,400', label: 'trees planted' },
  { value: '1,850', label: 'volunteers' },
  { value: '46', label: 'corporate partners' },
  { value: '9 ha', label: 'land greened' },
]

// Demo team - initials are shown in a coloured circle instead of a photo
const team = [
  { name: 'Hannah Lee', role: 'Executive Director', initials: 'HL' },
  { name: 'Marcus Tran', role: 'Grants Manager', initials: 'MT' },
  { name: 'Aisha Rahman', role: 'Volunteer Coordinator', initials: 'AR' },
  { name: 'Tom Walsh', role: 'Horticulturist', initials: 'TW' },
]
</script>

<template>
  <!-- Banner -->
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Who we are</p>
      <h1 class="display-6 fw-bold mb-2">About GreenRoots Melbourne</h1>
      <p class="lead mb-0">A not-for-profit growing a cooler, greener city — one street at a time.</p>
    </div>
  </section>

  <!-- Intro with photo -->
  <section class="container py-5">
    <div class="row g-5 align-items-center">
      <div class="col-lg-6">
        <h2 class="fw-bold mb-3">Our story</h2>
        <p class="lead text-muted">
          GreenRoots Melbourne turns council and corporate funding into small, street-level
          greening projects across Melbourne's inner north and west.
        </p>
        <p>
          We believe the fastest way to a cooler, greener city is a thousand small projects run by
          the people who live there. We handle the grants, permits and plants; local volunteers and
          workplace teams do the digging. Every project is rated by the community when it is done,
          so the next round of funding goes to what actually works.
        </p>
      </div>
      <div class="col-lg-6">
        <img src="/images/about.jpg" class="img-fluid rounded-4 shadow-sm" alt="Volunteer planting seedlings" />
      </div>
    </div>
  </section>

  <!-- Impact numbers -->
  <section class="bg-brand py-5">
    <div class="container">
      <div class="row text-center g-4">
        <div v-for="item in impact" :key="item.label" class="col-6 col-md-3">
          <div class="display-6 fw-bold">{{ item.value }}</div>
          <div class="small opacity-75">{{ item.label }}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- What we do -->
  <section class="container py-5">
    <p class="eyebrow mb-1">Our work</p>
    <h2 class="fw-bold mb-4">What we do</h2>
    <div class="row g-4">
      <div v-for="service in services" :key="service.title" class="col-md-4">
        <div class="card card-hover h-100 p-4">
          <div class="icon-circle mb-3">{{ service.icon }}</div>
          <h3 class="h5 fw-bold">{{ service.title }}</h3>
          <p class="text-muted mb-0">{{ service.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="bg-brand-soft py-5">
    <div class="container">
      <p class="eyebrow mb-1">The process</p>
      <h2 class="fw-bold mb-4">How it works</h2>
      <div class="row g-4">
        <div v-for="(step, index) in steps" :key="step.title" class="col-6 col-md-3">
          <div class="step-number mb-3">{{ index + 1 }}</div>
          <h3 class="h6 fw-bold">{{ step.title }}</h3>
          <p class="small text-muted mb-0">{{ step.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Team -->
  <section class="container py-5">
    <p class="eyebrow mb-1">The people</p>
    <h2 class="fw-bold mb-4">Meet the team</h2>
    <div class="row g-4">
      <div v-for="person in team" :key="person.name" class="col-6 col-md-3">
        <div class="card h-100 p-4 text-center">
          <div class="avatar mx-auto mb-3">{{ person.initials }}</div>
          <h3 class="h6 fw-bold mb-1">{{ person.name }}</h3>
          <p class="small text-muted mb-0">{{ person.role }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section class="container">
    <div class="card p-5">
      <div class="row align-items-center g-4">
        <div class="col-md-7">
          <h2 class="fw-bold mb-3">Get in touch</h2>
          <p class="mb-1">
            📧 <a href="mailto:hello@greenroots.org.au">hello@greenroots.org.au</a>
          </p>
          <p class="mb-1">📞 (03) 9000 1234</p>
          <p class="text-muted mb-0">📍 Fitzroy, VIC 3065</p>
        </div>
        <div class="col-md-5 text-md-end">
          <router-link class="btn btn-brand rounded-pill px-4 me-2 mb-2" to="/grants">Browse Grants</router-link>
          <router-link class="btn btn-outline-brand rounded-pill px-4 mb-2" to="/FireRegister">Register</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-number {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--gr-green);
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background-color: var(--gr-green-soft);
  color: var(--gr-green);
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
