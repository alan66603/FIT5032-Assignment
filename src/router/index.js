import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import LoginView from "@/views/LoginView.vue";
import AboutView from "@/views/AboutView.vue";
import AccessDeniedView from "@/views/AccessDeniedView.vue";
import { isAuthenticated } from "@/auth";
import GrantsView from "@/views/GrantsView.vue";
import FirebaseSigninView from "@/views/FirebaseSigninView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },
  {
    path: "/about",
    name: "About",
    component: AboutView,
    meta: { requiresAuth: true },
  },
  {
    path: "/access-denied",
    name: "Access Denied",
    component: AccessDeniedView,
  },
  {
    path: "/grants",
    name: "Grants",
    component: GrantsView,
  },
  {
    path: "/FireLogin",
    name: "FireLogin",
    component: FirebaseSigninView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: "Access Denied", query: { from: to.fullPath } };
  }
});

export default router;
