<script setup>
import { currentUser, userRole } from '@/auth'
</script>

<template>
  <div class="container py-5">
    <h1>Volunteer Dashboard</h1>
    <p class="text-muted">
      Signed in as <strong>{{ currentUser?.email }}</strong>
      <span class="badge text-bg-dark ms-2">{{ userRole }}</span>
    </p>
    <p>Volunteer-only content is coming...</p>
  </div>
</template>
