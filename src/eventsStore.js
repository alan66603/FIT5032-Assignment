import { ref, computed, watch } from 'vue'
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/init'
import { currentUser } from '@/auth'

/**
 * Volunteer planting days (BR F.1: booking with calendar constraints).
 *
 * Firestore:
 *   events/{eventId}            { title, description, place, start, end, capacity, bookedCount, createdBy }
 *   bookings/{eventId}_{uid}    { eventId, uid, email, bookedAt }
 *
 * The booking ID is eventId_uid, so one person can only book an event once.
 */

/** Every event, kept live with onSnapshot. start/end are turned into JS Dates. */
export const events = ref([])

onSnapshot(collection(db, 'events'), (snapshot) => {
  events.value = snapshot.docs.map((eventDoc) => {
    const data = eventDoc.data()
    return { id: eventDoc.id, ...data, start: data.start.toDate(), end: data.end.toDate() }
  })
})

/** The signed-in user's bookings, kept live. Empty when logged out. */
export const myBookings = ref([])
let unsubscribeBookings = null

watch(
  currentUser,
  (user) => {
    if (unsubscribeBookings) unsubscribeBookings()
    unsubscribeBookings = null
    myBookings.value = []
    if (!user) return

    const myBookingsQuery = query(collection(db, 'bookings'), where('uid', '==', user.uid))
    unsubscribeBookings = onSnapshot(myBookingsQuery, (snapshot) => {
      myBookings.value = snapshot.docs.map((bookingDoc) => ({ id: bookingDoc.id, ...bookingDoc.data() }))
    })
  },
  { immediate: true },
)

/** IDs of the events I have booked, for quick "is this booked?" checks. */
export const myBookedEventIds = computed(() => new Set(myBookings.value.map((booking) => booking.eventId)))

/** My booked events, soonest first. */
export const myEvents = computed(() =>
  events.value
    .filter((event) => myBookedEventIds.value.has(event.id))
    .sort((a, b) => a.start - b.start),
)

// Two time ranges overlap when each one starts before the other ends.
const overlaps = (a, b) => a.start < b.end && b.start < a.end

/**
 * Book a place, checking every calendar constraint first.
 * Throws an Error with a message we can show the user.
 */
export async function bookEvent(event) {
  if (!currentUser.value) throw new Error('Please log in to book an event.')
  if (event.start <= new Date()) throw new Error('This event has already started.')
  if (myBookedEventIds.value.has(event.id)) throw new Error('You have already booked this event.')

  // Time conflict: is any event I already booked at the same time?
  const clash = myEvents.value.find((other) => overlaps(event, other))
  if (clash) throw new Error(`This clashes with "${clash.title}", which you have already booked.`)

  const uid = currentUser.value.uid
  const eventRef = doc(db, 'events', event.id)
  const bookingRef = doc(db, 'bookings', `${event.id}_${uid}`)

  // A transaction reads the latest bookedCount and writes both documents
  // together, so two people can't both take the last place.
  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef)
    if (!eventSnap.exists()) throw new Error('This event no longer exists.')

    const { bookedCount, capacity } = eventSnap.data()
    if (bookedCount >= capacity) throw new Error('Sorry, this event is full.')

    transaction.set(bookingRef, {
      eventId: event.id,
      uid,
      email: currentUser.value.email,
      bookedAt: serverTimestamp(),
    })
    transaction.update(eventRef, { bookedCount: bookedCount + 1 })
  })
}

/** Cancel my booking and give the place back. */
export async function cancelBooking(event) {
  if (event.start <= new Date()) throw new Error('You cannot cancel an event that has already started.')

  const uid = currentUser.value.uid
  const eventRef = doc(db, 'events', event.id)
  const bookingRef = doc(db, 'bookings', `${event.id}_${uid}`)

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef)
    const bookingSnap = await transaction.get(bookingRef)
    if (!bookingSnap.exists()) throw new Error('You have not booked this event.')

    transaction.delete(bookingRef)
    transaction.update(eventRef, { bookedCount: eventSnap.data().bookedCount - 1 })
  })
}

/** Admins only (checked again by the Firestore rules). start/end are JS Dates. */
export async function createEvent({ title, description, place, start, end, capacity }) {
  await addDoc(collection(db, 'events'), {
    title,
    description,
    place,
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
    capacity,
    bookedCount: 0,
    createdBy: currentUser.value.uid,
  })
}
