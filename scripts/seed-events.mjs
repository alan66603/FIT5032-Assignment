// Seed demo planting days into Firestore.
//
// Run once from the project folder, signed in as an ADMIN account
// (the Firestore rules only let admins create events):
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-password' node scripts/seed-events.mjs
//
// It removes leftover "test" events that nobody booked, then adds 14 events
// across 7 grants: 5 already finished and 9 upcoming (one full, one with a
// single place left, and two that overlap on 25 Oct to demo the clash check).
// bookedCount on the demo events stands for other volunteers who booked earlier.

/* global process */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, collection, getDocs, deleteDoc, addDoc, Timestamp } from 'firebase/firestore'

// Read the VITE_FIREBASE_* values from .env (Vite isn't running here).
const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) env[match[1]] = match[2].trim()
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

// Melbourne time: AEST (+10:00) until daylight saving starts on 4 Oct 2026, then AEDT (+11:00).
const at = (date, time) => {
  const offset = date >= '2026-10-04' ? '+11:00' : '+10:00'
  return Timestamp.fromDate(new Date(`${date}T${time}:00${offset}`))
}

// grantId matches src/data/grants.js
const demoEvents = [
  // ---- already finished ----
  { grantId: 1, title: 'Laneway Forest Planting Day', place: 'Easey St, Collingwood', date: '2026-08-15', from: '09:00', to: '12:00', capacity: 25, bookedCount: 22,
    description: 'Planting 600 native seedlings into the new laneway pocket forest.' },
  { grantId: 3, title: 'Schoolyard Tree Planting', place: 'Footscray Primary School', date: '2026-08-29', from: '09:30', to: '12:30', capacity: 30, bookedCount: 27,
    description: 'Students, families and volunteers plant 40 advanced shade trees.' },
  { grantId: 12, title: 'Frog Pond Reed Planting', place: 'Merri Creek Trail, Northcote', date: '2026-09-12', from: '10:00', to: '13:00', capacity: 20, bookedCount: 16,
    description: 'Planting reeds and rushes around the three new frog ponds.' },
  { grantId: 7, title: 'Spring Seedling Swap & Bed Building', place: 'Union St, Fitzroy', date: '2026-09-26', from: '09:00', to: '11:30', capacity: 15, bookedCount: 15,
    description: 'Building raised vegetable beds and swapping spring seedlings.' },
  { grantId: 16, title: 'Dune Grass Planting', place: 'St Kilda Foreshore', date: '2026-10-04', from: '08:30', to: '11:00', capacity: 20, bookedCount: 18,
    description: 'Planting coastal grasses to hold the dunes together.' },

  // ---- upcoming ----
  { grantId: 1, title: 'Laneway Forest Mulching Day', place: 'Easey St, Collingwood', date: '2026-10-18', from: '09:00', to: '12:00', capacity: 20, bookedCount: 7,
    description: 'Spreading mulch and watering the young forest before summer.' },
  { grantId: 19, title: 'Nest Box Building Workshop', place: 'Maribyrnong River Trail', date: '2026-10-24', from: '10:00', to: '12:00', capacity: 12, bookedCount: 12,
    description: 'Build and install nest boxes for small native birds. (Fully booked)' },
  { grantId: 3, title: 'Shade Tree Watering Morning', place: 'Footscray Primary School', date: '2026-10-25', from: '09:00', to: '11:00', capacity: 15, bookedCount: 4,
    description: 'Deep-watering the schoolyard trees planted in August.' },
  { grantId: 22, title: 'Street Tree Planting – Anderson St', place: 'Anderson St, Yarraville', date: '2026-10-25', from: '10:00', to: '13:00', capacity: 25, bookedCount: 9,
    description: 'Filling empty tree pits in the village shopping strip. Overlaps the Footscray watering morning.' },
  { grantId: 12, title: 'Frog Pond Weeding', place: 'Merri Creek Trail, Northcote', date: '2026-11-01', from: '09:30', to: '12:00', capacity: 15, bookedCount: 14,
    description: 'Hand-weeding around the ponds so the reeds can spread. Only one place left!' },
  { grantId: 7, title: 'Compost Hub Workshop', place: 'Union St, Fitzroy', date: '2026-11-07', from: '10:00', to: '12:00', capacity: 20, bookedCount: 6,
    description: 'Learn to run the shared compost hub with our horticulturist.' },
  { grantId: 16, title: 'Foreshore Clean-up & Planting', place: 'St Kilda Foreshore', date: '2026-11-15', from: '08:30', to: '11:30', capacity: 30, bookedCount: 11,
    description: 'Picking up litter, then planting more dune grasses.' },
  { grantId: 19, title: 'Riverbank Shrub Planting', place: 'Maribyrnong River Trail', date: '2026-11-22', from: '09:00', to: '12:00', capacity: 25, bookedCount: 3,
    description: 'Planting dense native shrubs where small birds can shelter.' },
  { grantId: 22, title: 'End-of-Year Tree Care Day', place: 'Yarraville Village', date: '2026-12-06', from: '09:00', to: '12:00', capacity: 20, bookedCount: 0,
    description: 'Checking stakes, mulching and watering the new street trees.' },
]

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (an admin account). See the comment at the top of this file.')
  process.exit(1)
}

try {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  console.log('Signed in as', user.email)

  // 1. Remove leftover "test" events that nobody has booked.
  const existing = await getDocs(collection(db, 'events'))
  for (const eventDoc of existing.docs) {
    const data = eventDoc.data()
    if (data.title.trim().toLowerCase() === 'test' && data.bookedCount === 0) {
      await deleteDoc(eventDoc.ref)
      console.log('Removed test event', eventDoc.id)
    }
  }

  // 2. Add the demo events.
  for (const event of demoEvents) {
    await addDoc(collection(db, 'events'), {
      grantId: event.grantId,
      title: event.title,
      description: event.description,
      place: event.place,
      start: at(event.date, event.from),
      end: at(event.date, event.to),
      capacity: event.capacity,
      bookedCount: event.bookedCount,
      createdBy: user.uid,
    })
    console.log('Added', event.date, event.title)
  }

  console.log(`Done: ${demoEvents.length} events added.`)
  await signOut(auth)
  process.exit(0)
} catch (error) {
  console.error('Seeding failed:', error.code ?? '', error.message)
  process.exit(1)
}
