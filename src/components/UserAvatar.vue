<script setup>
import { avatarUrl } from '@/auth'
import defaultAvatar from '@/assets/default-avatar.svg'

// The signed-in user's profile picture (made by the makeAvatarThumbnail
// Cloud Function), or the grey default picture if they haven't uploaded one.
defineProps({
  size: { type: Number, default: 64 },
})
</script>

<template>
  <img
    :src="avatarUrl || defaultAvatar"
    :alt="avatarUrl ? 'Your profile picture' : 'No profile picture yet'"
    :width="size"
    :height="size"
    class="rounded-circle border border-2 border-white avatar"
  />
</template>

<style scoped>
.avatar {
  object-fit: cover;
  flex-shrink: 0;
}
</style>
