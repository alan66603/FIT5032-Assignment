<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import { FilterMatchMode } from '@primevue/core/api'
import { auth } from '@/firebase/init'
import { currentUser } from '@/auth'
import { bulkRecipients } from '@/emailDraft'
import { downloadCsv, downloadPdf, todayStamp } from '@/exportUtils'

// Our admin Cloud Functions (listUsers, createUser, updateUser).
// Copy this base URL from Firebase Console > Functions after `firebase deploy`.
const FUNCTIONS_URL = 'https://us-central1-fit5032-ass1-16223.cloudfunctions.net'

const roles = ['volunteer', 'corporate', 'admin']

// Tell the Admin dashboard the real user list so it can show the user count.
const emit = defineEmits(['users-loaded'])

const users = ref([])
const isLoading = ref(true)
const pageError = ref(null)
const successMessage = ref(null)

// DataTable filters: search every column, or search by email / role on their own.
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  role: { value: null, matchMode: FilterMatchMode.EQUALS },
})

// POST to one of our admin Cloud Functions. The ID token lets the function
// check that we are signed in and that our role is admin.
const callAdminFunction = async (name, body = {}) => {
  const token = await auth.currentUser.getIdToken()
  const response = await axios.post(`${FUNCTIONS_URL}/${name}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

const loadUsers = async () => {
  isLoading.value = true
  pageError.value = null
  try {
    const data = await callAdminFunction('listUsers')
    // Turn the date strings into Date objects so the table sorts them by time.
    users.value = data.users.map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastSignIn: user.lastSignIn ? new Date(user.lastSignIn) : null,
    }))
    emit('users-loaded', users.value)
  } catch (error) {
    console.error('Error loading users:', error)
    pageError.value = error.response?.data?.error ?? 'Could not load users.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadUsers)

// --- Bulk email: tick users in the table, then email them all (BR F.1) ---
const router = useRouter()
const selectedUsers = ref([])

const emailSelected = () => {
  bulkRecipients.value = selectedUsers.value.map((user) => user.email)
  router.push('/email')
}

const formatDateTime = (date) => (date ? date.toLocaleString('en-AU') : '—')

// --- Export (BR E.4): the rows shown, after search, filters and sorting ---
const userTable = ref(null)
const USER_COLUMNS = [
  { header: 'Email', value: (user) => user.email },
  { header: 'Role', value: (user) => user.role ?? '' },
  { header: 'Status', value: (user) => (user.disabled ? 'Disabled' : 'Active') },
  { header: 'Created', value: (user) => formatDateTime(user.createdAt) },
  { header: 'Last sign-in', value: (user) => formatDateTime(user.lastSignIn) },
]
const rowsToExport = () => userTable.value?.processedData ?? users.value

const exportCsv = () => downloadCsv(`users-${todayStamp()}.csv`, rowsToExport(), USER_COLUMNS)
const exportPdf = () => downloadPdf(`users-${todayStamp()}.pdf`, 'GreenRoots users', rowsToExport(), USER_COLUMNS)
const isSelf = (user) => user.uid === currentUser.value?.uid

// --- Add / edit dialog ---
const dialogVisible = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const formError = ref(null)
const form = ref({ uid: null, email: '', password: '', role: 'volunteer', disabled: false })

const dialogTitle = computed(() => (isEditing.value ? 'Edit user' : 'Add user'))
const editingSelf = computed(() => isEditing.value && form.value.uid === currentUser.value?.uid)

const openAddDialog = () => {
  isEditing.value = false
  formError.value = null
  form.value = { uid: null, email: '', password: '', role: 'volunteer', disabled: false }
  dialogVisible.value = true
}

const openEditDialog = (user) => {
  isEditing.value = true
  formError.value = null
  form.value = {
    uid: user.uid,
    email: user.email,
    password: '', // left blank = keep the current password
    role: user.role ?? 'volunteer',
    disabled: user.disabled,
  }
  dialogVisible.value = true
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const saveUser = async () => {
  formError.value = null
  successMessage.value = null

  const email = form.value.email.trim()
  if (!emailPattern.test(email)) {
    formError.value = 'Please enter a valid email address.'
    return
  }
  // A new account needs a password; when editing, a blank password means "don't change it".
  if (!isEditing.value || form.value.password) {
    if (form.value.password.length < 6) {
      formError.value = 'Password must be at least 6 characters.'
      return
    }
  }

  isSaving.value = true
  try {
    if (isEditing.value) {
      await callAdminFunction('updateUser', {
        uid: form.value.uid,
        email,
        role: form.value.role,
        disabled: form.value.disabled,
        password: form.value.password || undefined,
      })
      successMessage.value = `Updated ${email}.`
    } else {
      await callAdminFunction('createUser', {
        email,
        password: form.value.password,
        role: form.value.role,
      })
      successMessage.value = `Created ${email}.`
    }
    dialogVisible.value = false
    await loadUsers()
  } catch (error) {
    console.error('Error saving user:', error)
    formError.value = error.response?.data?.error ?? 'Could not save the user. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <!-- Manage Users section of the Admin dashboard -->
  <div class="card p-4">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div>
        <h2 class="h5 fw-bold mb-1">Manage users</h2>
        <p class="small text-muted mb-0">Add accounts, change roles, reset passwords or disable accounts.</p>
      </div>
      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-outline-brand rounded-pill px-4"
          :disabled="selectedUsers.length === 0"
          @click="emailSelected"
        >
          ✉️ Email selected ({{ selectedUsers.length }})
        </button>
        <button type="button" class="btn btn-brand rounded-pill px-4" @click="openAddDialog">+ Add user</button>
      </div>
    </div>

    <div v-if="pageError" class="alert alert-danger" role="alert">{{ pageError }}</div>
    <div v-if="successMessage" class="alert alert-success" role="status">{{ successMessage }}</div>

    <!-- PrimeVue DataTable: sort, global search, search by column, 10 rows per page -->
    <div>
      <DataTable
        ref="userTable"
        v-model:filters="filters"
        v-model:selection="selectedUsers"
        :value="users"
        :loading="isLoading"
        dataKey="uid"
        paginator
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
        filterDisplay="row"
        :globalFilterFields="['email', 'role']"
        sortField="createdAt"
        :sortOrder="-1"
        removableSort
        stripedRows
      >
        <template #header>
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <InputText v-model="filters.global.value" placeholder="🔍 Search users" aria-label="Search users" />
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-brand btn-sm rounded-pill px-3" @click="exportCsv">
                ⬇ Export CSV
              </button>
              <button type="button" class="btn btn-outline-brand btn-sm rounded-pill px-3" @click="exportPdf">
                ⬇ Export PDF
              </button>
            </div>
          </div>
        </template>

        <template #empty>
          <p class="text-center text-muted py-4 mb-0">No users found.</p>
        </template>

        <!-- Tick boxes for choosing bulk email recipients -->
        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column field="email" header="Email" sortable :showFilterMenu="false" style="min-width: 16rem">
          <template #body="{ data }">
            {{ data.email }}
            <span v-if="isSelf(data)" class="badge text-bg-light border ms-1">You</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              @input="filterCallback()"
              placeholder="Search email"
              aria-label="Filter by email"
              size="small"
            />
          </template>
        </Column>

        <Column field="role" header="Role" sortable :showFilterMenu="false">
          <template #body="{ data }">
            <span class="badge bg-brand text-capitalize">{{ data.role ?? 'none' }}</span>
          </template>
          <template #filter="{ filterModel, filterCallback }">
            <Select
              v-model="filterModel.value"
              @change="filterCallback()"
              :options="roles"
              placeholder="All"
              showClear
              aria-label="Filter by role"
              size="small"
            />
          </template>
        </Column>

        <Column field="disabled" header="Status" sortable>
          <template #body="{ data }">
            <span class="badge rounded-pill" :class="data.disabled ? 'bg-secondary' : 'bg-success'">
              {{ data.disabled ? 'Disabled' : 'Active' }}
            </span>
          </template>
        </Column>

        <Column field="createdAt" header="Created" sortable>
          <template #body="{ data }">{{ formatDateTime(data.createdAt) }}</template>
        </Column>

        <Column field="lastSignIn" header="Last sign-in" sortable>
          <template #body="{ data }">{{ formatDateTime(data.lastSignIn) }}</template>
        </Column>

        <Column header="Actions">
          <template #body="{ data }">
            <button
              type="button"
              class="btn btn-outline-brand btn-sm rounded-pill px-3"
              :aria-label="`Edit ${data.email}`"
              @click="openEditDialog(data)"
            >
              Edit
            </button>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Add / edit user -->
    <Dialog v-model:visible="dialogVisible" :header="dialogTitle" modal :style="{ width: '28rem' }">
      <form @submit.prevent="saveUser" novalidate>
        <div class="mb-3">
          <label for="user-email" class="form-label">Email</label>
          <input id="user-email" v-model="form.email" type="email" class="form-control" />
        </div>

        <div class="mb-3">
          <label for="user-password" class="form-label">
            {{ isEditing ? 'New password (leave blank to keep the current one)' : 'Password' }}
          </label>
          <input
            id="user-password"
            v-model="form.password"
            type="password"
            class="form-control"
            autocomplete="new-password"
          />
        </div>

        <div class="mb-3">
          <label for="user-role" class="form-label">Role</label>
          <select id="user-role" v-model="form.role" class="form-select" :disabled="editingSelf">
            <option v-for="role in roles" :key="role" :value="role" class="text-capitalize">{{ role }}</option>
          </select>
        </div>

        <div v-if="isEditing" class="form-check mb-3">
          <input
            id="user-disabled"
            v-model="form.disabled"
            type="checkbox"
            class="form-check-input"
            :disabled="editingSelf"
          />
          <label for="user-disabled" class="form-check-label">Disable this account (the user cannot sign in)</label>
        </div>
        <p v-if="editingSelf" class="small text-muted">You cannot change your own role or disable your own account.</p>

        <div v-if="formError" class="alert alert-danger py-2" role="alert">{{ formError }}</div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-light rounded-pill px-3" @click="dialogVisible = false">Cancel</button>
          <button type="submit" class="btn btn-brand rounded-pill px-4" :disabled="isSaving">
            {{ isSaving ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
