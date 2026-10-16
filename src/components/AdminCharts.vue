<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, onSnapshot } from 'firebase/firestore'
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { db } from '@/firebase/init'
import { grants } from '@/grantsStore'
import { events } from '@/eventsStore'

// BR F.1: interactive charts for the admin, built from Firestore data with Chart.js.
// Hover for exact numbers, click a legend item to hide it, and click a bar
// to open that event or grant.

// Chart.js only includes the pieces we register.
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  // Accounts from the Manage users section ({ role } is what we use here).
  users: { type: Array, default: () => [] },
})

const router = useRouter()

const GREEN = '#2e7d32'
const LEAF = '#7cb342'
const YELLOW = '#ffc107'
const GREY = '#adb5bd'
const BLUE = '#0d6efd'

// Show a pointer cursor over bars that can be clicked.
const pointerOnHover = (event, elements) => {
  event.native.target.style.cursor = elements.length ? 'pointer' : 'default'
}

// --- 1. Users by role (Firestore users/{uid}.role) ---
const roleCounts = computed(() => {
  const counts = { volunteer: 0, corporate: 0, admin: 0 }
  for (const user of props.users) {
    if (user.role in counts) counts[user.role] += 1
  }
  return counts
})

const usersChartData = computed(() => ({
  labels: ['Volunteers', 'Corporate partners', 'Admins'],
  datasets: [
    {
      data: [roleCounts.value.volunteer, roleCounts.value.corporate, roleCounts.value.admin],
      backgroundColor: [GREEN, BLUE, YELLOW],
    },
  ],
}))
const usersSummary = computed(
  () =>
    `${roleCounts.value.volunteer} volunteers, ${roleCounts.value.corporate} corporate partners, ${roleCounts.value.admin} admins`,
)

// --- 2. Grants by status (includes status changes saved in Firestore) ---
const statusCounts = computed(() => {
  const counts = { Approved: 0, 'In Review': 0, Declined: 0 }
  for (const grant of grants.value) counts[grant.status] += 1
  return counts
})

const statusChartData = computed(() => ({
  labels: Object.keys(statusCounts.value),
  datasets: [{ data: Object.values(statusCounts.value), backgroundColor: [GREEN, YELLOW, GREY] }],
}))
const statusSummary = computed(() =>
  Object.entries(statusCounts.value)
    .map(([status, count]) => `${count} ${status}`)
    .join(', '),
)

// Tooltip for the doughnuts: "Volunteers: 4 (57%)".
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (context) => {
          const total = context.dataset.data.reduce((sum, value) => sum + value, 0)
          const percent = total ? Math.round((context.parsed / total) * 100) : 0
          return `${context.label}: ${context.parsed} (${percent}%)`
        },
      },
    },
  },
}

// --- 3. Bookings for upcoming planting days (Firestore events) ---
const upcomingEvents = computed(() =>
  events.value.filter((event) => event.start > new Date()).sort((a, b) => a.start - b.start),
)

const shortDate = (date) => date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

const bookingsChartData = computed(() => ({
  labels: upcomingEvents.value.map((event) => `${shortDate(event.start)} · ${event.title}`),
  datasets: [
    { label: 'Booked', data: upcomingEvents.value.map((event) => event.bookedCount), backgroundColor: GREEN },
    {
      label: 'Places left',
      data: upcomingEvents.value.map((event) => event.capacity - event.bookedCount),
      backgroundColor: '#c8e6c9',
    },
  ],
}))
const bookingsSummary = computed(() => {
  const booked = upcomingEvents.value.reduce((sum, event) => sum + event.bookedCount, 0)
  const capacity = upcomingEvents.value.reduce((sum, event) => sum + event.capacity, 0)
  return `${upcomingEvents.value.length} upcoming planting days, ${booked} of ${capacity} places booked`
})

const bookingsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // horizontal bars, so long event names fit
  scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true } },
  plugins: { legend: { position: 'bottom' } },
  onHover: pointerOnHover,
  // Click a bar to open that event's own page.
  onClick: (event, elements) => {
    if (elements.length) router.push(`/events/${upcomingEvents.value[elements[0].index].id}`)
  },
}

// --- 4. Top rated grants (Firestore ratings) ---
const ratings = ref([])
let unsubscribeRatings = null

onMounted(() => {
  unsubscribeRatings = onSnapshot(collection(db, 'ratings'), (snapshot) => {
    ratings.value = snapshot.docs.map((ratingDoc) => ratingDoc.data())
  })
})
onUnmounted(() => {
  if (unsubscribeRatings) unsubscribeRatings()
})

const topRated = computed(() => {
  const totals = {}
  for (const rating of ratings.value) {
    if (!totals[rating.grantId]) totals[rating.grantId] = { sum: 0, count: 0 }
    totals[rating.grantId].sum += rating.score
    totals[rating.grantId].count += 1
  }
  return Object.entries(totals)
    .map(([grantId, { sum, count }]) => ({
      grant: grants.value.find((grant) => grant.id === Number(grantId)),
      average: sum / count,
      count,
    }))
    .filter((item) => item.grant)
    .sort((a, b) => b.average - a.average)
    .slice(0, 8)
})

const ratingsChartData = computed(() => ({
  labels: topRated.value.map((item) => item.grant.project),
  datasets: [
    {
      label: 'Average rating',
      data: topRated.value.map((item) => Number(item.average.toFixed(2))),
      backgroundColor: LEAF,
    },
  ],
}))
const ratingsSummary = computed(() =>
  topRated.value.length
    ? `Highest rated: ${topRated.value[0].grant.project} (${topRated.value[0].average.toFixed(1)} out of 5)`
    : 'No ratings yet',
)

const ratingsOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: { x: { min: 0, max: 5, ticks: { stepSize: 1 } } },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const item = topRated.value[context.dataIndex]
          return `${item.average.toFixed(1)} / 5 from ${item.count} rating${item.count === 1 ? '' : 's'}`
        },
      },
    },
  },
  onHover: pointerOnHover,
  // Click a bar to open that grant's page.
  onClick: (event, elements) => {
    if (elements.length) router.push(`/grants/${topRated.value[elements[0].index].grant.id}`)
  },
}
</script>

<template>
  <div class="row g-4">
    <div class="col-md-6 col-xl-3">
      <div class="card p-4 h-100">
        <h2 class="h6 fw-bold mb-3">Users by role</h2>
        <div class="chart-box-small">
          <Doughnut :data="usersChartData" :options="doughnutOptions" :aria-label="`Users by role: ${usersSummary}`" />
        </div>
        <p class="small text-muted mt-2 mb-0">{{ usersSummary }}</p>
      </div>
    </div>

    <div class="col-md-6 col-xl-3">
      <div class="card p-4 h-100">
        <h2 class="h6 fw-bold mb-3">Grants by status</h2>
        <div class="chart-box-small">
          <Doughnut :data="statusChartData" :options="doughnutOptions" :aria-label="`Grants by status: ${statusSummary}`" />
        </div>
        <p class="small text-muted mt-2 mb-0">{{ statusSummary }}</p>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card p-4 h-100">
        <h2 class="h6 fw-bold mb-1">Bookings for upcoming planting days</h2>
        <p class="small text-muted mb-3">Click a bar to open that event.</p>
        <div class="chart-box">
          <Bar :data="bookingsChartData" :options="bookingsOptions" :aria-label="bookingsSummary" />
        </div>
        <p class="small text-muted mt-2 mb-0">{{ bookingsSummary }}</p>
      </div>
    </div>

    <div class="col-12">
      <div class="card p-4">
        <h2 class="h6 fw-bold mb-1">Top rated grants</h2>
        <p class="small text-muted mb-3">Average community rating. Click a bar to open the grant.</p>
        <div class="chart-box">
          <Bar :data="ratingsChartData" :options="ratingsOptions" :aria-label="`Top rated grants. ${ratingsSummary}`" />
        </div>
        <p class="small text-muted mt-2 mb-0">{{ ratingsSummary }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Chart.js fills its parent, so give each chart a fixed height. */
.chart-box-small {
  position: relative;
  height: 220px;
}
.chart-box {
  position: relative;
  height: 320px;
}
</style>
