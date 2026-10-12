<script setup>
import { signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase/init';
import { currentUser, userRole, avatarUrl, DASHBOARD_PATHS } from '@/auth';
import defaultAvatar from '@/assets/default-avatar.svg';

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
    <nav class="navbar navbar-expand-lg bg-white border-bottom py-3 sticky-top">
        <div class="container">
            <router-link class="navbar-brand fw-bold brand-text text-brand" to="/">🌿 GREENROOTS</router-link>

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
                    <li class="nav-item" v-if="userRole === 'admin'">
                        <router-link class="nav-link" to="/dashboard/admin/users">Users</router-link>
                    </li>
                    <li class="nav-item" v-if="currentUser">
                        <router-link class="nav-link" to="/email">Email</router-link>
                    </li>
                    <li class="nav-item" v-if="!currentUser">
                        <router-link class="btn btn-brand rounded-pill px-4" to="/FireLogin">Log In</router-link>
                    </li>
                    <!-- Profile picture in the top-right corner (grey default until the user uploads one).
                         Clicking it opens a small Bootstrap dropdown with Profile and Log Out. -->
                    <li class="nav-item dropdown" v-else>
                        <button
                            type="button"
                            class="nav-link btn btn-link d-flex align-items-center dropdown-toggle"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            aria-label="Account menu"
                        >
                            <img
                                :src="avatarUrl || defaultAvatar"
                                alt=""
                                class="rounded-circle border avatar"
                                width="36"
                                height="36"
                            />
                            <span class="ms-2 d-lg-none">Account</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li class="dropdown-item-text small text-muted">{{ currentUser.email }}</li>
                            <li><hr class="dropdown-divider" /></li>
                            <li><router-link class="dropdown-item" to="/profile">Profile</router-link></li>
                            <li>
                                <button type="button" class="dropdown-item" @click="handleLogout">Log Out</button>
                            </li>
                        </ul>
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

/* Navbar profile picture: crop to fill the circle, highlight on hover. */
.avatar {
    object-fit: cover;
    transition: box-shadow 0.15s ease;
}
.nav-link:hover .avatar,
.nav-link.router-link-exact-active .avatar {
    box-shadow: 0 0 0 2px var(--gr-leaf);
}

/* Vue Router adds this class to the link of the page we are on */
.nav-link {
    font-weight: 500;
}
.nav-link:hover,
.nav-link.router-link-exact-active {
    color: var(--gr-green);
}
.nav-link.router-link-exact-active {
    border-bottom: 2px solid var(--gr-leaf);
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
    background-color: var(--gr-green);
    border-color: var(--gr-green);
}
.navbar-toggler[aria-expanded='true'] .navbar-toggler-icon {
    /* Bootstrap's dark-navbar icon: white lines */
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.9%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
</style>