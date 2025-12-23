import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send("Invalid unsubscribe link.");
  }

  const snap = await db
    .collection("subscriptions")
    .where("email", "==", email)
    .get();

  snap.forEach(doc => {
    doc.ref.update({ active: false });
  });

  res.send(`
    <h2>You have been unsubscribed</h2>
    <p>You will no longer receive Islamic Daily Reminder emails.</p>
  `);
}
