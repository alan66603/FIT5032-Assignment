<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import MultiSelect from 'primevue/multiselect'
import { collection, getDocs } from 'firebase/firestore'
import { auth, db } from '@/firebase/init'
import { currentUser, userRole } from '@/auth'
import { bulkRecipients } from '@/emailDraft'
import { grants } from '@/grantsStore'
import { pdfAsBase64, GRANT_COLUMNS, todayStamp } from '@/exportUtils'

// TinyMCE rich text editor, self-hosted from npm (no API key needed).
// These imports bundle the editor, its theme, icons, skin and the plugins we use.
import 'tinymce'
import 'tinymce/icons/default'
import 'tinymce/themes/silver'
import 'tinymce/models/dom'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/autolink'
import 'tinymce/skins/ui/oxide/skin.js'
import 'tinymce/skins/ui/oxide/content.js'
import 'tinymce/skins/content/default/content.js'
import Editor from '@tinymce/tinymce-vue'

const editorSettings = {
  height: 300,
  menubar: false,
  plugins: 'lists link autolink',
  toolbar: 'undo redo | bold italic underline | forecolor | bullist numlist | link | removeformat',
  // Use the skin and content styles bundled above instead of loading files from a URL.
  skin_url: 'default',
  content_css: 'default',
  iframe_aria_text: 'Message',
  promotion: false,
  branding: false,
}

// The editor gives us HTML, e.g. "<p><strong>Hi</strong></p>". Strip the tags to
// check whether the user actually typed something.
const hasText = (html) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0

// Our Cloud Functions. Copy the base URL from Firebase Console > Functions after `firebase deploy`.
const FUNCTIONS_URL = 'https://us-central1-fit5032-ass1-16223.cloudfunctions.net'

const isAdmin = computed(() => userRole.value === 'admin')

const subject = ref('')
const message = ref('')
const file = ref(null)

const isSending = ref(false)
const errorMessage = ref(null)
const successMessage = ref(null)

// --- Admins: bulk email to chosen users (BR F.1) ---
// Start with anyone ticked in the Manage users table, then clear that list.
const recipients = ref([...bulkRecipients.value])
bulkRecipients.value = []

const allUsers = ref([])
const recipientOptions = computed(() =>
  allUsers.value.map((user) => ({ label: `${user.email} (${user.role ?? 'no role'})`, value: user.email })),
)

// POST to one of our Cloud Functions with the ID token, so it knows who is calling.
const callFunction = async (name, body) => {
  const token = await auth.currentUser.getIdToken()
  const response = await axios.post(`${FUNCTIONS_URL}/${name}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

onMounted(async () => {
  if (!isAdmin.value) return
  try {
    const data = await callFunction('listUsers', {})
    allUsers.value = data.users
  } catch (error) {
    console.error('Error loading users:', error)
    errorMessage.value = 'Could not load the user list.'
  }
})

// Quick picks: every user with a role, or everyone.
const selectRole = (role) => {
  recipients.value = allUsers.value.filter((user) => user.role === role).map((user) => user.email)
}
const selectEveryone = () => {
  recipients.value = allUsers.value.map((user) => user.email)
}

const onFileChange = (event) => {
  file.value = event.target.files[0] ?? null
}

// --- Attach a grants report (BR E.4 export + BR D.2 email) ---
// Builds the same PDF as "Export PDF" on the Grants page, with each grant's
// average rating from Firestore, and attaches it to this email.
const reportAttachment = ref(null) // { filename, content (base64) }
const isBuildingReport = ref(false)

const attachGrantsReport = async () => {
  errorMessage.value = null
  isBuildingReport.value = true
  try {
    const snapshot = await getDocs(collection(db, 'ratings'))
    const totals = {}
    snapshot.forEach((ratingDoc) => {
      const { grantId, score } = ratingDoc.data()
      if (!totals[grantId]) totals[grantId] = { sum: 0, count: 0 }
      totals[grantId].sum += score
      totals[grantId].count += 1
    })
    const rows = grants.value.map((grant) => ({
      ...grant,
      averageRating: totals[grant.id] ? totals[grant.id].sum / totals[grant.id].count : 0,
      ratingCount: totals[grant.id]?.count ?? 0,
    }))

    reportAttachment.value = {
      filename: `grants-report-${todayStamp()}.pdf`,
      content: pdfAsBase64('Community Greening Grants report', rows, GRANT_COLUMNS),
    }
    if (!subject.value) subject.value = 'GreenRoots grants report'
    if (!hasText(message.value)) message.value = '<p>Here is the latest GreenRoots grants report, attached as a PDF.</p>'
  } catch (error) {
    console.error('Error building report:', error)
    errorMessage.value = 'Could not build the report. Please try again.'
  } finally {
    isBuildingReport.value = false
  }
}

// Turn the chosen file into base64 text so it can be sent inside JSON.
const readFileAsBase64 = (chosenFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    // reader.result looks like "data:application/pdf;base64,JVBERi0..." - keep the part after the comma.
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(chosenFile)
  })
}

const sendEmail = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (isAdmin.value && recipients.value.length === 0) {
    errorMessage.value = 'Please choose at least one recipient.'
    return
  }
  if (!subject.value || !hasText(message.value)) {
    errorMessage.value = 'Please fill in the subject and message.'
    return
  }
  if (file.value && file.value.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Attachment must be 5 MB or smaller.'
    return
  }

  isSending.value = true
  try {
    // Either the generated report or a file the user chose.
    let attachment = reportAttachment.value
    if (!attachment && file.value) {
      attachment = { filename: file.value.name, content: await readFileAsBase64(file.value) }
    }

    if (isAdmin.value) {
      // Admins: one email to every chosen recipient (BCC), through sendBulkEmail.
      const data = await callFunction('sendBulkEmail', {
        recipients: recipients.value,
        subject: subject.value,
        message: message.value,
        attachment,
      })
      successMessage.value = `Email sent to ${data.sent} ${data.sent === 1 ? 'person' : 'people'}.`
      recipients.value = []
    } else {
      // Everyone else: email yourself, through sendEmail (BR D.2).
      await callFunction('sendEmail', {
        to: currentUser.value.email,
        subject: subject.value,
        message: message.value,
        attachment,
      })
      successMessage.value = `Email sent to ${currentUser.value.email}.`
    }
    subject.value = ''
    message.value = ''
    reportAttachment.value = null
  } catch (error) {
    console.error('Error sending email:', error)
    errorMessage.value = error.response?.data?.error ?? 'Error sending email. Please try again.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 720px">
    <div class="card p-4 p-md-5">
      <h1 class="h3 fw-bold mb-1">📧 Send Email</h1>
      <p class="text-muted mb-4">
        {{
          isAdmin
            ? 'Email one or many users at once. Recipients are hidden from each other (BCC).'
            : 'Send yourself an email, with an attachment if you like.'
        }}
      </p>

      <form @submit.prevent="sendEmail" novalidate>
        <!-- Admins choose any number of recipients -->
        <div v-if="isAdmin" class="mb-3">
          <label id="recipients-label" class="form-label">To</label>
          <MultiSelect
            v-model="recipients"
            :options="recipientOptions"
            optionLabel="label"
            optionValue="value"
            filter
            display="chip"
            placeholder="Choose recipients"
            :maxSelectedLabels="6"
            class="w-100"
            ariaLabelledby="recipients-label"
          />
          <div class="d-flex flex-wrap gap-2 mt-2">
            <button type="button" class="btn btn-sm btn-outline-brand rounded-pill" @click="selectRole('volunteer')">
              All volunteers
            </button>
            <button type="button" class="btn btn-sm btn-outline-brand rounded-pill" @click="selectRole('corporate')">
              All corporate
            </button>
            <button type="button" class="btn btn-sm btn-outline-brand rounded-pill" @click="selectEveryone">
              Everyone
            </button>
            <button type="button" class="btn btn-sm btn-light rounded-pill" @click="recipients = []">Clear</button>
          </div>
          <div class="form-text">{{ recipients.length }} recipient{{ recipients.length === 1 ? '' : 's' }} selected</div>
        </div>

        <!-- Everyone else emails themselves -->
        <div v-else class="mb-3">
          <label for="email-to" class="form-label">To</label>
          <input id="email-to" :value="currentUser?.email" type="email" class="form-control" readonly />
        </div>

        <div class="mb-3">
          <label for="email-subject" class="form-label">Subject</label>
          <input id="email-subject" v-model="subject" type="text" class="form-control" />
        </div>

        <div class="mb-3">
          <label for="email-message" class="form-label">Message</label>
          <!-- TinyMCE: bold, italic, colours, lists and links. v-model holds the HTML. -->
          <Editor id="email-message" v-model="message" license-key="gpl" :init="editorSettings" />
        </div>

        <div class="mb-3">
          <label for="email-attachment" class="form-label">Attachment (optional, max 5 MB)</label>

          <!-- A generated grants report replaces the file picker until it is removed -->
          <div v-if="reportAttachment" class="d-flex align-items-center gap-2 p-2 border rounded bg-light">
            <span>📄 {{ reportAttachment.filename }}</span>
            <button
              type="button"
              class="btn btn-sm btn-link text-danger ms-auto"
              aria-label="Remove the attached report"
              @click="reportAttachment = null"
            >
              Remove
            </button>
          </div>
          <template v-else>
            <input
              id="email-attachment"
              type="file"
              class="form-control"
              accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
              @change="onFileChange"
            />
            <button
              type="button"
              class="btn btn-sm btn-outline-brand rounded-pill mt-2"
              :disabled="isBuildingReport"
              @click="attachGrantsReport"
            >
              {{ isBuildingReport ? 'Building report…' : '📎 Attach the grants report (PDF)' }}
            </button>
          </template>
        </div>

        <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success py-2" role="status">{{ successMessage }}</div>

        <button type="submit" class="btn btn-brand rounded-pill px-4" :disabled="isSending">
          {{ isSending ? 'Sending…' : isAdmin ? `Send to ${recipients.length}` : 'Send' }}
        </button>
      </form>
    </div>
  </div>
</template>
