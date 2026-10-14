<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { grants } from '@/grantsStore'
import NavigateIcon from '@/components/NavigateIcon.vue'

// BR E.2 Geo Location, using MapBox:
//   1. every grant shown as a marker on the map
//   2. search places of interest (MapBox Search Box API)
//   3. directions from a start point to a grant, with trip distance and time (MapBox Directions API)

// The public "pk." token lives in .env (and in Cloudflare's environment variables).
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = MAPBOX_TOKEN

const MELBOURNE = [144.9631, -37.8136] // [longitude, latitude] - MapBox puts longitude first

const route = useRoute()
const mapContainer = ref(null)
// The map is a plain variable, not a ref: Vue's reactivity would wrap the
// MapBox object in a proxy, which breaks it.
let map = null
let searchMarker = null

const statusColours = { Approved: '#198754', 'In Review': '#ffc107', Declined: '#6c757d' }

// Build the popup with DOM nodes and textContent (never HTML strings), so
// text can't be turned into code.
function makePopup(grant) {
  const box = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = grant.project
  const details = document.createElement('div')
  details.textContent = `${grant.suburb} · ${grant.status} · $${grant.amount.toLocaleString()}`
  box.append(title, details)
  return new mapboxgl.Popup({ offset: 24 }).setDOMContent(box)
}

onMounted(() => {
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: MELBOURNE,
    zoom: 11,
  })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // Feature 1: a coloured marker for every grant.
  const markers = {}
  for (const grant of grants.value) {
    markers[grant.id] = new mapboxgl.Marker({ color: statusColours[grant.status] })
      .setLngLat([grant.lng, grant.lat])
      .setPopup(makePopup(grant))
      .addTo(map)
    // MapBox labels every marker just "Map marker"; give screen-reader and
    // keyboard users the grant's name instead.
    markers[grant.id].getElement().setAttribute('aria-label', `${grant.project} (${grant.status})`)
  }

  // Coming from a grant's page (/map?grant=3): zoom to that grant, open its
  // popup and choose it as the directions destination.
  const linkedGrant = grants.value.find((grant) => grant.id === Number(route.query.grant))
  if (linkedGrant) {
    destinationId.value = linkedGrant.id
    map.flyTo({ center: [linkedGrant.lng, linkedGrant.lat], zoom: 14 })
    markers[linkedGrant.id].togglePopup()
  }
})

onUnmounted(() => {
  if (map) map.remove()
})

// --- Feature 2: search places of interest ---
const searchText = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const searchError = ref(null)
const selectedPlace = ref(null) // { name, address, lng, lat }

const searchPlaces = async () => {
  searchError.value = null
  searchResults.value = []
  if (!searchText.value.trim()) {
    searchError.value = 'Type a place to search for, e.g. "Flinders Street Station" or "cafe".'
    return
  }

  isSearching.value = true
  try {
    const response = await axios.get('https://api.mapbox.com/search/searchbox/v1/forward', {
      params: {
        q: searchText.value.trim(),
        country: 'au',
        proximity: MELBOURNE.join(','), // prefer results near Melbourne
        limit: 5,
        access_token: MAPBOX_TOKEN,
      },
    })
    searchResults.value = response.data.features.map((feature) => ({
      name: feature.properties.name,
      address: feature.properties.full_address ?? feature.properties.place_formatted ?? '',
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }))
    if (searchResults.value.length === 0) searchError.value = 'No places found. Try another search.'
  } catch (error) {
    console.error('Error searching places:', error)
    searchError.value = 'Search failed. Please try again.'
  } finally {
    isSearching.value = false
  }
}

const showPlace = (place) => {
  selectedPlace.value = place
  searchResults.value = []
  if (searchMarker) searchMarker.remove()
  const popup = new mapboxgl.Popup({ offset: 24 }).setText(place.name)
  searchMarker = new mapboxgl.Marker({ color: '#0d6efd' }).setLngLat([place.lng, place.lat]).setPopup(popup).addTo(map)
  map.flyTo({ center: [place.lng, place.lat], zoom: 14 })
}

// --- Feature 3: directions and trip information ---
const startOption = ref('current') // 'current' = my location, 'place' = the searched place
const destinationId = ref(grants.value[0].id)
const travelMode = ref('driving') // MapBox profiles: driving, walking, cycling
const trip = ref(null) // { distanceKm, minutes }
const isRouting = ref(false)
const routeError = ref(null)

const travelModes = [
  { value: 'driving', label: '🚗 Drive' },
  { value: 'walking', label: '🚶 Walk' },
  { value: 'cycling', label: '🚲 Cycle' },
]

// Clicking Drive / Walk / Cycle picks the mode and gets the route at once.
const getDirectionsBy = (mode) => {
  travelMode.value = mode
  getDirections()
}

// The browser's Geolocation API, wrapped in a Promise so we can await it.
const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.longitude, position.coords.latitude]),
      () => reject(new Error('Could not get your location. Please allow location access, or use a searched place.')),
    )
  })

// Draw the route line, replacing any previous one.
function drawRoute(geometry) {
  const data = { type: 'Feature', geometry }
  if (map.getSource('route')) {
    map.getSource('route').setData(data)
    return
  }
  map.addSource('route', { type: 'geojson', data })
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#2e7d32', 'line-width': 6, 'line-opacity': 0.8 },
  })
}

const getDirections = async () => {
  routeError.value = null
  trip.value = null

  const destination = grants.value.find((grant) => grant.id === Number(destinationId.value))

  isRouting.value = true
  try {
    let start
    if (startOption.value === 'place') {
      if (!selectedPlace.value) throw new Error('Search for a place first, then choose it as the start.')
      start = [selectedPlace.value.lng, selectedPlace.value.lat]
    } else {
      start = await getCurrentPosition()
    }

    const coordinates = `${start[0]},${start[1]};${destination.lng},${destination.lat}`
    const response = await axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/${travelMode.value}/${coordinates}`,
      { params: { geometries: 'geojson', overview: 'full', access_token: MAPBOX_TOKEN } },
    )

    const route = response.data.routes[0]
    if (!route) throw new Error('No route found between these two places.')

    drawRoute(route.geometry)
    trip.value = {
      distanceKm: (route.distance / 1000).toFixed(1), // metres -> km
      minutes: Math.round(route.duration / 60), // seconds -> minutes
      destination: destination.project,
    }

    // Zoom the map so the whole route is visible.
    const bounds = new mapboxgl.LngLatBounds()
    route.geometry.coordinates.forEach((point) => bounds.extend(point))
    map.fitBounds(bounds, { padding: 60 })
  } catch (error) {
    console.error('Error getting directions:', error)
    routeError.value = error.response ? 'Could not get directions. Please try again.' : error.message
  } finally {
    isRouting.value = false
  }
}
</script>

<template>
  <section class="page-banner">
    <div class="container">
      <p class="eyebrow mb-2">Find a project near you</p>
      <h1 class="display-6 fw-bold mb-2">Grants Map</h1>
      <p class="lead mb-0">See where our projects are, search places, and get directions.</p>
    </div>
  </section>

  <div class="container py-5">
    <div class="row g-4">
      <!-- Controls -->
      <div class="col-lg-4">
        <!-- Search places -->
        <div class="card p-4 mb-4">
          <h2 class="h5 fw-bold mb-3">🔍 Search places</h2>
          <form @submit.prevent="searchPlaces" novalidate>
            <label for="place-search" class="form-label">Place or type of place</label>
            <div class="input-group">
              <input
                id="place-search"
                v-model="searchText"
                type="text"
                class="form-control"
                placeholder="e.g. Flinders Street Station"
              />
              <button type="submit" class="btn btn-brand" :disabled="isSearching">
                {{ isSearching ? '…' : 'Search' }}
              </button>
            </div>
          </form>

          <div v-if="searchError" class="alert alert-warning py-2 mt-3 mb-0 small" role="alert">{{ searchError }}</div>

          <div v-if="searchResults.length" class="list-group mt-3" aria-live="polite">
            <button
              v-for="place in searchResults"
              :key="`${place.lng},${place.lat}`"
              type="button"
              class="list-group-item list-group-item-action"
              @click="showPlace(place)"
            >
              <div class="fw-semibold">{{ place.name }}</div>
              <div class="small text-muted">{{ place.address }}</div>
            </button>
          </div>

          <p v-if="selectedPlace" class="small mt-3 mb-0">
            Selected: <strong>{{ selectedPlace.name }}</strong>
          </p>
        </div>

        <!-- Directions -->
        <div class="card p-4">
          <h2 class="h5 fw-bold mb-3"><NavigateIcon /> Directions to a grant</h2>
          <form @submit.prevent="getDirections" novalidate>
            <fieldset class="mb-3">
              <legend class="form-label fs-6">Start from</legend>
              <div class="form-check">
                <input id="start-current" v-model="startOption" class="form-check-input" type="radio" value="current" />
                <label for="start-current" class="form-check-label">My current location</label>
              </div>
              <div class="form-check">
                <input
                  id="start-place"
                  v-model="startOption"
                  class="form-check-input"
                  type="radio"
                  value="place"
                  :disabled="!selectedPlace"
                />
                <label for="start-place" class="form-check-label">
                  The searched place{{ selectedPlace ? ` (${selectedPlace.name})` : ' (search one first)' }}
                </label>
              </div>
            </fieldset>

            <div class="mb-3">
              <label for="destination" class="form-label">Go to</label>
              <select id="destination" v-model="destinationId" class="form-select">
                <option v-for="grant in grants" :key="grant.id" :value="grant.id">
                  {{ grant.project }} ({{ grant.suburb }})
                </option>
              </select>
            </div>

            <!-- Each travel mode button gets the route straight away. -->
            <fieldset>
              <legend class="form-label fs-6">Get directions by</legend>
              <div class="btn-group w-100" role="group" aria-label="Get directions by">
                <button
                  v-for="mode in travelModes"
                  :key="mode.value"
                  type="button"
                  class="btn"
                  :class="trip && travelMode === mode.value ? 'btn-brand' : 'btn-outline-brand'"
                  :aria-pressed="trip && travelMode === mode.value ? 'true' : 'false'"
                  :disabled="isRouting"
                  @click="getDirectionsBy(mode.value)"
                >
                  {{ mode.label }}
                </button>
              </div>
              <p v-if="isRouting" class="small text-muted mt-2 mb-0" role="status">Finding route…</p>
            </fieldset>
          </form>

          <div v-if="routeError" class="alert alert-danger py-2 mt-3 mb-0 small" role="alert">{{ routeError }}</div>

          <!-- Trip information -->
          <div v-if="trip" class="mt-3" aria-live="polite">
            <h3 class="h6 fw-bold">Trip to {{ trip.destination }}</h3>
            <div class="d-flex gap-3">
              <div class="trip-stat flex-fill">
                <div class="fs-4 fw-bold text-brand">{{ trip.distanceKm }} km</div>
                <div class="small text-muted">distance</div>
              </div>
              <div class="trip-stat flex-fill">
                <div class="fs-4 fw-bold text-brand">{{ trip.minutes }} min</div>
                <div class="small text-muted">travel time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="col-lg-8">
        <div
          ref="mapContainer"
          class="map rounded-4 border"
          role="region"
          aria-label="Map of grant projects in Melbourne"
        ></div>
        <!-- Legend: coloured dots with dark text, so the words pass the contrast check -->
        <p class="small mt-2 mb-0">
          <span class="legend-dot" style="background: #198754"></span> Approved
          <span class="legend-dot ms-3" style="background: #ffc107"></span> In Review
          <span class="legend-dot ms-3" style="background: #6c757d"></span> Declined
          <span class="legend-dot ms-3" style="background: #0d6efd"></span> Your searched place
          <span class="text-muted ms-2">· Click or press Enter on a marker for details.</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map {
  width: 100%;
  height: 600px;
}

.legend-dot {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  vertical-align: middle;
}

.trip-stat {
  background: #f1f8f2;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
}
</style>
