<script setup>
import { signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase/init';
import { currentUser, userRole, DASHBOARD_PATHS } from '@/auth';

const router = useRouter()

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
                    <li class="nav-item" v-if="currentUser">
                        <router-link class="nav-link" to="/profile">Profile</router-link>
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

/* Hamburger button feedback: hover/press tint, and a filled state while the
   menu is open. Bootstrap toggles aria-expanded for us. */
.navbar-toggler {
    border-color: #dee2e6;
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.navbar-toggler:hover {
    background-color: #e9ecef;
    border-color: #adb5bd;
    transform: scale(1.06);
}
.navbar-toggler:active {
    transform: scale(0.94);
}
.navbar-toggler:focus {
    box-shadow: 0 0 0 0.2rem rgba(33, 37, 41, 0.15);
}
.navbar-toggler[aria-expanded='true'] {
    background-color: #212529;
    border-color: #212529;
}
.navbar-toggler[aria-expanded='true'] .navbar-toggler-icon {
    /* Bootstrap's dark-navbar icon: white lines */
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.9%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
</style>