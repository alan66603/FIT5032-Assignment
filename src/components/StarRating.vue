<script setup>
// Clickable 1–5 star input. `value` is the current user's score (0 = not
// rated yet); emits `rate` with the clicked score. `disabled` makes it
// display-only for logged-out visitors.
defineProps({
  value: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['rate'])
</script>

<template>
  <span class="star-rating" :class="{ disabled }">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="star"
      :class="{ filled: star <= value }"
      :disabled="disabled"
      :aria-label="`Rate ${star} star${star > 1 ? 's' : ''}`"
      @click="emit('rate', star)"
    >
      ★
    </button>
  </span>
</template>

<style scoped>
.star {
  background: none;
  border: none;
  padding: 0 1px;
  font-size: 1.25rem;
  line-height: 1;
  color: #ccc;
  cursor: pointer;
}
.star.filled {
  color: #f5b301;
}
.star:disabled {
  cursor: default;
}
.star-rating:not(.disabled) .star:hover,
.star-rating:not(.disabled) .star:has(~ .star:hover) {
  color: #f5b301;
}
</style>
