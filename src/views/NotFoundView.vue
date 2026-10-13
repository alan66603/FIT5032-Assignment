<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="container py-5 text-center" style="max-width: 520px">
    <div class="card p-5">
      <div class="display-4 mb-3">🌱</div>
      <h1 class="h3 fw-bold">Page not found</h1>
      <p class="text-muted">
        We couldn't find <code>{{ route.fullPath }}</code>. It may have moved, or the link may be wrong.
      </p>
      <div>
        <router-link to="/" class="btn btn-brand rounded-pill px-4 me-2">Back to Home</router-link>
        <router-link to="/grants" class="btn btn-outline-brand rounded-pill px-4">Browse grants</router-link>
      </div>
    </div>
  </div>
</template>
