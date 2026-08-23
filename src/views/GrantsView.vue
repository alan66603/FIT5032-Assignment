<script setup>
import { grants } from '@/data/grants';
</script>

<template>
    <div class="container py-5">
        <h1>Community Greening Grants</h1>
        <p>We have {{ grants.length }} grants.</p>

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
                <tr v-for="grant in grants" :key="grant.id">
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