<script setup>
import NavBar from './components/NavBar.vue';
import AppFooter from './components/AppFooter.vue';

</script>

<template>
  <!-- Flex column + flex-grow-1 keeps the footer at the bottom on short pages -->
  <div class="d-flex flex-column min-vh-100">
    <NavBar />
    <main class="flex-grow-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
