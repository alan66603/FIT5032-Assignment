<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/init'
import { currentUser, userRole } from '@/auth'

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

// Copy this URL from Firebase Console > Functions after `firebase deploy`.
const SEND_EMAIL_URL = 'https://us-central1-fit5032-ass1-16223.cloudfunctions.net/sendEmail'

const to = ref(currentUser.value?.email ?? '')
const subject = ref('')
const message = ref('')
const file = ref(null)

const isSending = ref(false)
const errorMessage = ref(null)
const successMessage = ref(null)

const onFileChange = (event) => {
  file.value = event.target.files[0] ?? null
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

  if (!to.value || !subject.value || !hasText(message.value)) {
    errorMessage.value = 'Please fill in the recipient, subject and message.'
    return
  }
  if (file.value && file.value.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Attachment must be 5 MB or smaller.'
    return
  }

  isSending.value = true
  try {
    let attachment = null
    if (file.value) {
      attachment = { filename: file.value.name, content: await readFileAsBase64(file.value) }
    }

    // The ID token proves to the Cloud Function who is sending.
    const token = await auth.currentUser.getIdToken()
    await axios.post(
      SEND_EMAIL_URL,
      { to: to.value, subject: subject.value, message: message.value, attachment },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    successMessage.value = `Email sent to ${to.value}.`
    subject.value = ''
    message.value = ''
  } catch (error) {
    console.error('Error sending email:', error)
    errorMessage.value = error.response?.data?.error ?? 'Error sending email. Please try again.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="container py-5" style="max-width: 640px">
    <div class="card p-4 p-md-5">
      <h1 class="h3 fw-bold mb-1">📧 Send Email</h1>
      <p class="text-muted mb-4">Emails are sent through our Cloud Function with Nodemailer.</p>

      <form @submit.prevent="sendEmail" novalidate>
        <div class="mb-3">
          <label for="email-to" class="form-label">To</label>
          <!-- Only admins can change the recipient; others email themselves. -->
          <input id="email-to" v-model="to" type="email" class="form-control" :readonly="userRole !== 'admin'" />
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
          <input
            id="email-attachment"
            type="file"
            class="form-control"
            accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
            @change="onFileChange"
          />
        </div>

        <div v-if="errorMessage" class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success py-2" role="status">{{ successMessage }}</div>

        <button type="submit" class="btn btn-brand rounded-pill px-4" :disabled="isSending">
          {{ isSending ? 'Sending…' : 'Send' }}
        </button>
      </form>
    </div>
  </div>
</template>
