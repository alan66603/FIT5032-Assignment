<script setup>
// Navigation icon (arrow in a circle) used on every "Directions" control.
// It uses currentColor, so it takes the colour of the text around it.
defineProps({
  size: { type: [Number, String], default: '1.1em' },
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="navigate-icon">
    <circle cx="12" cy="12" r="10.6" fill="none" stroke="currentColor" stroke-width="1.8" />
    <polygon points="5.4,11 17,7 13.1,18.6 11.3,12.8" fill="currentColor" />
  </svg>
</template>

<style scoped>
.navigate-icon {
  vertical-align: -0.15em;
  flex-shrink: 0;
}
</style>
