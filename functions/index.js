// Cloud Functions for GreenRoots Melbourne.
// Same structure as the Week 9 lab: onRequest + cors + firebase-admin.
// This file runs on Node.js, so tell ESLint about the Node.js globals.
/* global require, exports, process */
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");

admin.initializeApp();

// Nodemailer (Week 9 lecture, Helpful Links) logs in to our Gmail account and
// sends through Gmail's own SMTP server. GMAIL_USER and GMAIL_APP_PASSWORD are
// read from functions/.env, so the password is never in the browser or on GitHub.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// sendEmail: send one email, with an optional attachment.
exports.sendEmail = onRequest((req, res) => {
  cors(req, res, async () => {
    // 1. Only signed-in users may send. The Vue page puts the user's
    //    Firebase ID token in the Authorization header.
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    let user;
    try {
      user = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error("Invalid ID token:", error.message);
      res.status(401).send({ error: "Please sign in first." });
      return;
    }

    try {
      // 2. Check the form data.
      const { to, subject, message, attachment } = req.body;
      if (!to || !subject || !message) {
        res.status(400).send({ error: "Recipient, subject and message are required." });
        return;
      }

      // Admins may email anyone; other users may only email themselves.
      const userDoc = await admin.firestore().collection("users").doc(user.uid).get();
      const role = userDoc.exists ? userDoc.data().role : null;
      if (role !== "admin" && to !== user.email) {
        res.status(403).send({ error: "You can only send emails to your own address." });
        return;
      }

      // 3. Build the email and send it.
      const email = {
        from: `"GreenRoots Melbourne" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        text: message,
      };
      if (attachment) {
        // The Vue page sends the file as base64 text, so tell Nodemailer how to decode it.
        email.attachments = [
          { filename: attachment.filename, content: attachment.content, encoding: "base64" },
        ];
      }

      await transporter.sendMail(email);

      res.status(200).send({ message: "Email sent" });
    } catch (error) {
      console.error("Error sending email:", error.message);
      res.status(500).send({ error: "Error sending email" });
    }
  });
});
