<script setup>
import { currentUser, userRole } from '@/auth'
</script>

<template>
  <div class="container py-5">
    <h1>Corporate Dashboard</h1>
    <p class="text-muted">
      Signed in as <strong>{{ currentUser?.email }}</strong>
      <span class="badge text-bg-dark ms-2">{{ userRole }}</span>
    </p>
    <p>Corporate-only content is coming...</p>
  </div>
</template>
