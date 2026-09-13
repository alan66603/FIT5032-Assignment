import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import AboutView from "@/views/AboutView.vue";
import AccessDeniedView from "@/views/AccessDeniedView.vue";
import { currentUser, userRole, waitForAuthReady } from "@/auth";
import GrantsView from "@/views/GrantsView.vue";
import FirebaseSigninView from "@/views/FirebaseSigninView.vue";
import FirebaseRegisterView from "@/views/FirebaseRegisterView.vue";
import VolunteerDashboard from "@/views/dashboards/VolunteerDashboard.vue";
import CorporateDashboard from "@/views/dashboards/CorporateDashboard.vue";
import AdminDashboard from "@/views/dashboards/AdminDashboard.vue";
import ProfileView from "@/views/ProfileView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/about",
    name: "About",
    component: AboutView,
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
  {
    path: "/FireRegister",
    name: "FireRegister",
    component: FirebaseRegisterView,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard/volunteer",
    name: "VolunteerDashboard",
    component: VolunteerDashboard,
    meta: { requiresAuth: true, allowedRoles: ["volunteer"] },
  },
  {
    path: "/dashboard/corporate",
    name: "CorporateDashboard",
    component: CorporateDashboard,
    meta: { requiresAuth: true, allowedRoles: ["corporate"] },
  },
  {
    path: "/dashboard/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, allowedRoles: ["admin"] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  // Wait for Firebase to restore the session so a page refresh on a
  // protected route isn't misread as logged out.
  await waitForAuthReady();

  if (to.meta.requiresAuth && !currentUser.value) {
    return { name: "Access Denied", query: { from: to.fullPath } };
  }

  // Role-level protection: the route lists which roles may enter.
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userRole.value)) {
    return { name: "Access Denied", query: { from: to.fullPath, reason: "role" } };
  }
});

export default router;
