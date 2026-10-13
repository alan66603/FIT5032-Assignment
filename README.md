# GreenRoots Melbourne

FIT5032 assignment — a Vue 3 web app for a community greening charity in
Melbourne. Volunteers and corporate partners can browse and rate community
greening grants; administrators get a dedicated dashboard.

**Live site:** https://fit5032-assignment-4sz.pages.dev (Cloudflare Pages,
deployed automatically from the `main` branch on GitHub).

Built with Vue 3 (Composition API, `<script setup>`), Vue Router, Bootstrap 5,
and Firebase (Authentication + Cloud Firestore).

## Project setup

```sh
npm install
```

### 1. Firebase configuration

Firebase config is read from environment variables and is **not** committed.

```sh
cp .env.example .env
```

Fill in the `VITE_FIREBASE_*` values from
Firebase Console → Project settings → General → Your apps → SDK setup and configuration.

### 2. Firebase Console

- **Authentication** → Sign-in method → enable **Email/Password**.
- **Firestore Database** → create a database, then open the **Rules** tab and
  paste the contents of [`firestore.rules`](firestore.rules) → Publish.

### 3. Cloud Functions (email)

Requires the Firebase **Blaze** plan. Email is sent through the
[Nodemailer](https://nodemailer.com) using a Gmail account and a Google App Password.

```sh
cd functions && npm install && cd ..
cp functions/.env.example functions/.env    # fill in GMAIL_USER and GMAIL_APP_PASSWORD
firebase deploy --only functions
```

After deploying, copy the function URL from Firebase Console → Functions into
`SEND_EMAIL_URL` in `src/views/SendEmailView.vue` if it differs.

### 4. Run

```sh
npm run dev      # development server with hot reload
npm run build    # production build
npm run lint     # ESLint + oxlint
```

## User roles

| Role        | How it is assigned                                   | Landing page           |
|-------------|------------------------------------------------------|------------------------|
| `volunteer` | Self-selected at registration                        | `/dashboard/volunteer` |
| `corporate` | Self-selected at registration                        | `/dashboard/corporate` |
| `admin`     | Set manually in Firestore (`users/{uid}.role`)       | `/dashboard/admin`     |

Admin cannot be self-selected: the registration form only offers Volunteer and
Corporate, and the Firestore rules reject any `users` document created with
another role. To promote an account, edit its `role` field in the Firestore
console.

## Firestore data model

```
users/{uid}                { email, role }
ratings/{grantId}_{uid}    { grantId, uid, score, updatedAt }
```

The rating document ID combines grant and user so each user holds exactly one
rating per grant; rating again overwrites rather than adds.

## Business requirements

| BR  | Requirement                    | Where                                                                                     |
|-----|--------------------------------|-------------------------------------------------------------------------------------------|
| C.1 | Authentication                 | `src/auth.js` (`onAuthStateChanged`), `FirebaseSigninView.vue`, `FirebaseRegisterView.vue`, `NavBar.vue` |
| C.2 | Role-based authentication      | `src/router/index.js` (`meta.requiresAuth` on `/profile`, `meta.allowedRoles` on dashboards), `src/views/dashboards/` |
| C.3 | Rating (aggregate)             | `src/components/StarRating.vue`, `src/views/GrantsView.vue` (`onSnapshot` + `computed`)   |
| C.4 | Security                       | Client-side validation in login/register forms; no `v-html`; `firestore.rules`            |

## Project structure

```
src/
├── auth.js               # shared auth state: currentUser, userRole, waitForAuthReady()
├── main.js               # Vue app bootstrap
├── firebase/init.js      # initializeApp() from .env; exports auth and db
├── router/index.js       # routes and navigation guard
├── components/
│   ├── NavBar.vue
│   └── StarRating.vue
├── data/grants.js        # static grant list
└── views/
    ├── GrantsView.vue
    ├── FirebaseSigninView.vue
    ├── FirebaseRegisterView.vue
    ├── ProfileView.vue       # any signed-in user (requiresAuth)
    ├── AccessDeniedView.vue
    └── dashboards/       # one view per role
```
