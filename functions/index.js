// Cloud Functions for GreenRoots Melbourne.
// Same structure as the Week 9 lab: onRequest + cors + firebase-admin.
// This file runs on Node.js, so tell ESLint about the Node.js globals.
/* global require, exports, process */
const { onRequest } = require("firebase-functions/v2/https");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");
const sharp = require("sharp");

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
        // The message comes from the TinyMCE editor as HTML, so send it as an
        // HTML email, plus a plain-text copy (tags removed) for simple mail apps.
        html: message,
        text: message.replace(/<[^>]*>/g, ""),
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

// makeAvatarThumbnail (BR E.1): runs automatically whenever a file is uploaded
// to Firebase Storage. When it is a profile picture, it shrinks it to a
// 200x200 thumbnail with sharp and saves it next to the original.
// Based on the "generate thumbnail" sample in firebase/functions-samples
// (linked in the Week 9 lecture Helpful Links).
exports.makeAvatarThumbnail = onObjectFinalized(async (event) => {
  const filePath = event.data.name; // e.g. "avatars/<uid>/original"
  const contentType = event.data.contentType;

  // Only handle new profile pictures. Our own thumb.jpg does not end with
  // "/original", so saving it below does not trigger this function again.
  if (!filePath.startsWith("avatars/") || !filePath.endsWith("/original")) {
    return;
  }
  if (!contentType || !contentType.startsWith("image/")) {
    console.log("Not an image, skipping:", filePath);
    return;
  }

  const uid = filePath.split("/")[1];
  const bucket = admin.storage().bucket(event.data.bucket);

  try {
    // 1. Download the original picture.
    const [original] = await bucket.file(filePath).download();

    // 2. Crop it to a 200x200 square and convert it to JPEG.
    const thumbnail = await sharp(original).resize(200, 200).jpeg().toBuffer();

    // 3. Save the thumbnail next to the original.
    await bucket.file(`avatars/${uid}/thumb.jpg`).save(thumbnail, {
      contentType: "image/jpeg",
    });

    // 4. Tell the Profile page a new thumbnail is ready.
    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set({ avatarUpdatedAt: Date.now() }, { merge: true });

    console.log("Thumbnail created for", uid);
  } catch (error) {
    console.error("Error making thumbnail:", error.message);
  }
});

// ---------------------------------------------------------------------------
// Admin user management: like the Users page of the Firebase Authentication
// console, but inside our app. Only admins may call these functions.
// The browser SDK cannot create or edit other people's accounts, so this has
// to run on the server with the Admin SDK.
// ---------------------------------------------------------------------------

const ROLES = ["volunteer", "corporate", "admin"];

// Check the caller's ID token and make sure they are an admin.
// Returns the caller's decoded token, or sends an error response and returns null.
async function checkAdmin(req, res) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  let caller;
  try {
    caller = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Invalid ID token:", error.message);
    res.status(401).send({ error: "Please sign in first." });
    return null;
  }

  const callerDoc = await admin.firestore().collection("users").doc(caller.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    res.status(403).send({ error: "Only admins can manage users." });
    return null;
  }
  return caller;
}

// listUsers: every account in Firebase Authentication, with its role from Firestore.
exports.listUsers = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const caller = await checkAdmin(req, res);
      if (!caller) return;

      const result = await admin.auth().listUsers(1000);
      const roleDocs = await admin.firestore().collection("users").get();
      const roles = {};
      roleDocs.forEach((doc) => {
        roles[doc.id] = doc.data().role;
      });

      const users = result.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        role: roles[user.uid] ?? null,
        disabled: user.disabled,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime ?? null,
      }));
      res.status(200).send({ users });
    } catch (error) {
      console.error("Error listing users:", error.message);
      res.status(500).send({ error: "Error listing users" });
    }
  });
});

// createUser: make a new account with an email, password and role.
exports.createUser = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const caller = await checkAdmin(req, res);
      if (!caller) return;

      const { email, password, role } = req.body;
      if (!email || !password || !ROLES.includes(role)) {
        res.status(400).send({ error: "Email, password and a valid role are required." });
        return;
      }
      if (password.length < 6) {
        res.status(400).send({ error: "Password must be at least 6 characters." });
        return;
      }

      const user = await admin.auth().createUser({ email, password });
      await admin.firestore().collection("users").doc(user.uid).set({ email, role });

      res.status(200).send({ uid: user.uid });
    } catch (error) {
      console.error("Error creating user:", error.message);
      // Firebase explains problems such as "email already exists" in error.message.
      res.status(400).send({ error: error.message });
    }
  });
});

// updateUser: change another account's email, password, role or disabled flag.
exports.updateUser = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const caller = await checkAdmin(req, res);
      if (!caller) return;

      const { uid, email, password, role, disabled } = req.body;
      if (!uid) {
        res.status(400).send({ error: "Missing user ID." });
        return;
      }
      if (role !== undefined && !ROLES.includes(role)) {
        res.status(400).send({ error: "Invalid role." });
        return;
      }
      if (password && password.length < 6) {
        res.status(400).send({ error: "Password must be at least 6 characters." });
        return;
      }
      // Stop admins from locking themselves out.
      if (uid === caller.uid && (disabled === true || (role && role !== "admin"))) {
        res.status(400).send({ error: "You cannot disable your own account or remove your own admin role." });
        return;
      }

      // Only send the fields that were filled in.
      const authChanges = {};
      if (email) authChanges.email = email;
      if (password) authChanges.password = password;
      if (disabled !== undefined) authChanges.disabled = disabled;
      await admin.auth().updateUser(uid, authChanges);

      const profileChanges = {};
      if (email) profileChanges.email = email;
      if (role) profileChanges.role = role;
      await admin.firestore().collection("users").doc(uid).set(profileChanges, { merge: true });

      res.status(200).send({ message: "User updated" });
    } catch (error) {
      console.error("Error updating user:", error.message);
      res.status(400).send({ error: error.message });
    }
  });
});
