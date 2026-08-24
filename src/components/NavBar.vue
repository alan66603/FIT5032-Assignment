<script setup>
import { isAuthenticated } from '@/auth';

function handleLogout() {
    isAuthenticated.value = false
}
</script>

<template>
    <nav class="navbar navbar-expand-lg bg-white border-bottom py-3">
        <div class="contatiner">
            <router-link class="navbar-brand fw-bold" to="/">GREENROOTS</router-link>

            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mainNav"
            >
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="mainNav">
                <ul class="navbar-nav ms-auto gap-lg-3">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/grants">Grants</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/about">About</router-link>
                    </li>
                    <li class="nav-item" v-if="!isAuthenticated">
                        <router-link class="nav-link" to="/login">Log In</router-link>
                    </li>
                    <li class="nav-item" v-else>
                        <router-link class="btn btn-outline-dark btn-sm" @click="handleLogout">Log Out</router-link>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>