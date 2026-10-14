import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import AboutView from "@/views/AboutView.vue";
import AccessDeniedView from "@/views/AccessDeniedView.vue";
import { currentUser, userRole, waitForAuthReady } from "@/auth";
import GrantsView from "@/views/GrantsView.vue";
import MapView from "@/views/MapView.vue";
import GrantDetailView from "@/views/GrantDetailView.vue";
import EventsView from "@/views/EventsView.vue";
import FirebaseSigninView from "@/views/FirebaseSigninView.vue";
import FirebaseRegisterView from "@/views/FirebaseRegisterView.vue";
import VolunteerDashboard from "@/views/dashboards/VolunteerDashboard.vue";
import CorporateDashboard from "@/views/dashboards/CorporateDashboard.vue";
import AdminDashboard from "@/views/dashboards/AdminDashboard.vue";
import ProfileView from "@/views/ProfileView.vue";
import SendEmailView from "@/views/SendEmailView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import ChooseRoleView from "@/views/ChooseRoleView.vue";

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
    // One grant, e.g. /grants/3 - the id is read with useRoute().params.id
    path: "/grants/:id",
    name: "GrantDetail",
    component: GrantDetailView,
  },
  {
    path: "/map",
    name: "Map",
    component: MapView,
  },
  {
    path: "/events",
    name: "Events",
    component: EventsView,
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
    path: "/email",
    name: "SendEmail",
    component: SendEmailView,
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
  {
    // First Google sign-in: pick volunteer or corporate.
    path: "/choose-role",
    name: "ChooseRole",
    component: ChooseRoleView,
    meta: { requiresAuth: true },
  },
  // Any URL that matches nothing above shows the 404 page. Must stay last.
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView,
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

  // Signed in with Google but no role chosen yet: ask for it first.
  if (to.meta.requiresAuth && currentUser.value && !userRole.value && to.name !== "ChooseRole") {
    return { name: "ChooseRole" };
  }

  // Role-level protection: the route lists which roles may enter.
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userRole.value)) {
    return { name: "Access Denied", query: { from: to.fullPath, reason: "role" } };
  }
});

// Give every page its own browser-tab title (WCAG 2.4.2 Page Titled),
// e.g. "Grants · GreenRoots Melbourne". Screen readers announce it on each page.
const PAGE_TITLES = {
  Home: "Home",
  About: "About us",
  "Access Denied": "Access denied",
  Grants: "Grants",
  GrantDetail: "Grant",
  Map: "Map",
  Events: "Planting days",
  FireLogin: "Sign in",
  FireRegister: "Register",
  Profile: "My profile",
  SendEmail: "Send email",
  VolunteerDashboard: "Volunteer dashboard",
  CorporateDashboard: "Corporate dashboard",
  AdminDashboard: "Admin dashboard",
  ChooseRole: "Choose your role",
  NotFound: "Page not found",
};

router.afterEach((to) => {
  const title = PAGE_TITLES[to.name];
  document.title = title ? `${title} · GreenRoots Melbourne` : "GreenRoots Melbourne";
});

export default router;
