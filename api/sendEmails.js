import fetch from "node-fetch";

// 🔐 Firebase REST config (NO ADMIN SDK NEEDED)
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

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
  "10-12": "Eid-ul-Adha"
};

// 🔹 Get Hijri Date (Umm-al-Qura)
async function getHijriDate() {
  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `https://api.aladhan.com/v1/gToH/${today}`
  );
  const data = await res.json();

  return {
    hijri: data.data.hijri.date,
    hijriDay: data.data.hijri.day,
    hijriMonth: data.data.hijri.month.number,
    gregorian: data.data.gregorian.date
  };
}

// 🔹 Fetch Subscriptions from Firestore (REST)
async function getSubscriptions() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/subscriptions?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.documents) return [];

  return data.documents.map(doc => ({
    email: doc.fields.email.stringValue
  }));
}

// 🔹 Send Email via EmailJS
async function sendEmail(to, hijri, gregorian, event) {
  return fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        hijri,
        gregorian,
        event: event || "No Islamic event today"
      }
    })
  });
}

// 🔥 MAIN CRON HANDLER
export default async function handler(req, res) {
  try {
    const hijriData = await getHijriDate();
    const key = `${hijriData.hijriDay}-${hijriData.hijriMonth}`;
    const event = EVENTS[key] || null;

    const subs = await getSubscriptions();

    for (const sub of subs) {
      await sendEmail(
        sub.email,
        hijriData.hijri,
        hijriData.gregorian,
        event
      );
    }

    return res.status(200).json({
      success: true,
      sent: subs.length
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
