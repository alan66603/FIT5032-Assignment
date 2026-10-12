<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { auth } from '@/firebase/init'
import { currentUser, userRole } from '@/auth'

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

  if (!to.value || !subject.value || !message.value) {
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
  <div class="container py-5" style="max-width: 600px">
    <h1>Send Email</h1>

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
        <textarea id="email-message" v-model="message" class="form-control" rows="6"></textarea>
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

      <button type="submit" class="btn btn-dark rounded-pill px-4" :disabled="isSending">
        {{ isSending ? 'Sending…' : 'Send' }}
      </button>
    </form>
  </div>
</template>
