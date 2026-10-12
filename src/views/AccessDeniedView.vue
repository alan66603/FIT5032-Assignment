<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="container py-5 text-center" style="max-width: 520px">
    <div class="card p-5">
      <div class="display-4 mb-3">🔒</div>
      <h1 class="h3 fw-bold">Access Denied</h1>
      <p v-if="route.query.reason === 'role'" class="text-muted">
        Your account's role does not have permission to view this page.
      </p>
      <p v-else class="text-muted">Log in to check out this page.</p>
      <div>
        <router-link v-if="route.query.reason !== 'role'" to="/FireLogin" class="btn btn-brand rounded-pill px-4 me-2">
          Log In
        </router-link>
        <router-link to="/" class="btn btn-outline-brand rounded-pill px-4">Back to Home</router-link>
      </div>
    </div>
  </div>
</template>
