import { ref } from 'vue'

/**
 * Email addresses an admin ticked in the Manage users table. The Email page
 * picks them up as the bulk email recipients, then clears this list.
 * Kept in memory only - nothing is saved.
 */
export const bulkRecipients = ref([])
