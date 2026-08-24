<script setup>
import { ref, reactive, computed } from 'vue';
import { grants } from '@/data/grants';

const searchTerm = ref('')

const filterGrants = computed(() => {
    return grants.filter((grant) => {
        const matchesSearch = grant.project.toLowerCase().includes(searchTerm.value.toLowerCase())
        const matchesStatus = statusFilters[grant.status]
        return matchesSearch && matchesStatus
    })
})

function statusBadgeClass(status) {
  if (status === 'Approved') return 'bg-success'
  if (status === 'In Review') return 'bg-warning text-dark'
  if (status === 'Declined') return 'bg-secondary'
  return 'bg-light text-dark'
}

const statusFilters = reactive({
  Approved: true,
  'In Review': true,
  Declined: true,
})
</script>

<template>
    <div class="container py-5">
        <h1>Community Greening Grants</h1>
        <input
            v-model="searchTerm"
            type="text"
            class="form-control mb-3"
            style="max-width: 400px"
            placeholder="Search by project name"
        />

        <div class="mb-3">
            <div class="form-check form-check-inline" v-for="status in Object.keys(statusFilters)" :key="status">
                <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'status-' + status"
                    v-model="statusFilters[status]"
                />
                <label class="form-check-label" :for="'status-' + status">{{ status }}</label>
            </div>
        </div>

        <p>We have {{ filterGrants.length }} grants.</p>

        <table class="table">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Surburb</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="grant in filterGrants" :key="grant.id">
                    <td>{{ grant.project }}</td>
                    <td>{{ grant.suburb }}</td>
                    <td>${{ grant.amount.toLocaleString() }}</td>
                    <td>
                        <span class="badge" :class="statusBadgeClass(grant.status)">{{ grant.status }}</span>
                    </td>
                    <td>{{ grant.date }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>