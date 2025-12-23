import admin from "firebase-admin";

// 🔐 Firebase Admin Init
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

// 🔐 EmailJS
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;

// 🔹 Islamic Events
const EVENTS = {
  "1-1": "Islamic New Year",
  "10-1": "Day of Ashura",
  "12-3": "Eid Milad-un-Nabi ﷺ",
  "1-9": "Start of Ramadan",
  "27-9": "Laylatul Qadr",
  "1-10": "Eid-ul-Fitr",
  "10-12": "Eid-ul-Adha",
};

// 🔹 Hijri Date
async function getHijriDate() {
  const today = new Date();
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const y = today.getFullYear();

  const res = await fetch(
    `https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`
  );
  const json = await res.json();

  return {
    hijri: json.data.hijri.date,
    hijriDay: json.data.hijri.day,
    hijriMonth: json.data.hijri.month.number,
    gregorian: json.data.gregorian.date,
  };
}

// 🔹 EmailJS Sender
async function sendEmail(to, hijri, gregorian, event) {
  return fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        hijri,
        gregorian,
        event: event || "No Islamic event today",
      },
    }),
  });
}

// 🔥 MAIN HANDLER
export default async function handler(req, res) {
  try {
    const hijriData = await getHijriDate();
    const eventKey = `${hijriData.hijriDay}-${hijriData.hijriMonth}`;
    const event = EVENTS[eventKey] || null;

    const snap = await db.collection("subscriptions").get();

    let sent = 0;
    for (const doc of snap.docs) {
      const { email, active } = doc.data();
      if (!active) continue;

      await sendEmail(
        email,
        hijriData.hijri,
        hijriData.gregorian,
        event
      );
      sent++;
    }

    res.status(200).json({ success: true, sent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
