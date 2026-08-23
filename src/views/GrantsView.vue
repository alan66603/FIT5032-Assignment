<script setup>
import { ref, computed } from 'vue';
import { grants } from '@/data/grants';

const searchTerm = ref('')

const filterGrants = computed(() => {
    return grants.filter((grant) => 
    grant.project.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
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
                    <td>{{ grant.status }}</td>
                    <td>{{ grant.date }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>