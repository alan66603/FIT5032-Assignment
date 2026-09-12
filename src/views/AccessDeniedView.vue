<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="container py-5">
    <h1>Access Denied</h1>
    <p v-if="route.query.reason === 'role'">Your account's role does not have permission to view this page.</p>
    <p v-else>Log in to check out this page.</p>
  </div>
</template>
