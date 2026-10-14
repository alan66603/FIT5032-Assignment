<script setup>
import NavBar from './components/NavBar.vue';
import AppFooter from './components/AppFooter.vue';

</script>

<template>
  <!-- Flex column + flex-grow-1 keeps the footer at the bottom on short pages -->
  <div class="d-flex flex-column min-vh-100">
    <!-- First thing a keyboard user reaches: jump past the navbar (WCAG 2.4.1) -->
    <a href="#main-content" class="visually-hidden-focusable skip-link">Skip to main content</a>
    <NavBar />
    <main id="main-content" class="flex-grow-1" tabindex="-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
