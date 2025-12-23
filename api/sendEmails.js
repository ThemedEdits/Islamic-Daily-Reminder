import admin from "firebase-admin";
import nodemailer from "nodemailer";

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

// 📧 Nodemailer Transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

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

// ✉️ Email Sender
async function sendEmail(to, hijri, gregorian, event, unsubscribeUrl) {
    const mailOptions = {
        from: `"Islamic Daily Reminder 🌙" <${process.env.GMAIL_USER}>`,
        to,
        subject: event
            ? `🌙 ${event} — ${hijri}`
            : `🌙 Islamic Daily Reminder — ${hijri}`,

        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #f5f7fa;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .card {
      max-width: 520px;
      margin: auto;
      background: #ffffff;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    h1 {
      color: #1b5e20;
      margin-bottom: 10px;
    }
    .date {
      color: #555;
      margin-bottom: 15px;
    }
    .event {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 6px;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 25px;
    }
    a {
      color: #1b5e20;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🕌 Islamic Daily Reminder</h1>

    <div class="date">
      <strong>Hijri:</strong> ${hijri}<br/>
      <strong>Gregorian:</strong> ${gregorian}
    </div>

    <div class="event">
      <strong>Today's Reminder:</strong><br/>
      ${event || "No major Islamic event today. May Allah bless your day 🤍"}
    </div>

    <p>May Allah grant you peace, guidance, and barakah. 🌙</p>

    <div class="footer">
      You are receiving this email because you subscribed.<br/>
      <a href="${unsubscribeUrl}">Unsubscribe</a>
    </div>
  </div>
</body>
</html>
    `,
    };

    await transporter.sendMail(mailOptions);
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

            const unsubscribeUrl =
                `https://islamic-daily-reminder.vercel.app/api/unsubscribe?email=${encodeURIComponent(email)}`;

            await sendEmail(
                email,
                hijriData.hijri,
                hijriData.gregorian,
                event,
                unsubscribeUrl
            );

            sent++;
        }


        res.status(200).json({ success: true, sent });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
