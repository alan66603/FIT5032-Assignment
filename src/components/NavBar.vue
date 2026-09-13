<script setup>
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { currentUser, userRole, DASHBOARD_PATHS } from '@/auth';

const router = useRouter()
const auth = getAuth()

const handleLogout = async () => {
    try {
        await signOut(auth)
        console.log('Firebase Sign out Successful!')
        router.push('/')
    } catch (error) {
        console.error('Error signing out:', error)
    }
}
</script>

<template>
    <nav class="navbar navbar-expand-lg bg-white border-bottom py-3">
        <div class="container">
            <router-link class="navbar-brand fw-bold brand-text" to="/">GREENROOTS</router-link>

            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mainNav"
                aria-controls="mainNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="mainNav">
                <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-3">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/grants">Grants</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/about">About</router-link>
                    </li>
                    <li class="nav-item" v-if="currentUser && DASHBOARD_PATHS[userRole]">
                        <router-link class="nav-link" :to="DASHBOARD_PATHS[userRole]">Dashboard</router-link>
                    </li>
                    <li class="nav-item" v-if="!currentUser">
                        <router-link class="btn btn-dark rounded-pill px-4" to="/FireLogin">Log In</router-link>
                    </li>
                    <li class="nav-item" v-else>
                        <button type="button" class="btn btn-outline-dark btn-sm" @click="handleLogout">Log Out</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.brand-text {
    letter-spacing: 0.08em;
}
</style>