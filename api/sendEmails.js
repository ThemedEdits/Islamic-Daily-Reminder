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
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5
});

// 🔹 Islamic Events (Expanded)
const EVENTS = {
  // ──────────────── MUHARRAM ────────────────
  "1-1": "Islamic New Year (1st Muharram) – Beginning of the Hijri year, a time for reflection and renewal.",
  "2-1": "Arrival of the Hijri New Year – Reflecting upon migration, patience, and faith.",
  "9-1": "Tasu'a – The day before Ashura, observed with fasting by many.",
  "10-1": "Day of Ashura – Martyrdom of Imam Hussain (RA); fasting recommended by Prophet ﷺ.",
  "11-1": "Aftermath of Karbala – Remembering sacrifice, patience, and steadfastness.",
  "20-1": "Chehlum Preparation Period – Reflection on Karbala and moral courage.",

  // ──────────────── SAFAR ────────────────
  "1-2": "Start of Safar – Month of patience; false superstitions rejected in Islam.",
  "20-2": "Chehlum (Arbaeen) – Completion of 40 days after Ashura, remembrance of Karbala.",
  "28-2": "Urs of Imam Hasan (RA) – According to some narrations.",

  // ──────────────── RABI-UL-AWWAL ────────────────
  "1-3": "Beginning of Rabi-ul-Awwal – Month of mercy and blessings.",
  "8-3": "Blessed events of Seerah – Early life events of Prophet Muhammad ﷺ.",
  "12-3": "Eid Milad-un-Nabi ﷺ – Birth of Prophet Muhammad ﷺ, celebration of mercy to mankind.",
  "17-3": "Urs of Imam Zain-ul-Abideen (RA) – According to historical reports.",

  // ──────────────── RABI-UL-THANI ────────────────
  "1-4": "Beginning of Rabi-us-Sani – Reflection on patience and knowledge.",
  "11-4": "Urs of Sheikh Abdul Qadir Jilani (RA) – Great Islamic scholar and saint.",

  // ──────────────── JUMADA-UL-AWWAL ────────────────
  "1-5": "Start of Jumada-ul-Awwal – Month of remembrance.",
  "13-5": "Martyrdom of Bibi Fatima (RA) – According to some narrations.",

  // ──────────────── JUMADA-UL-THANI ────────────────
  "1-6": "Start of Jumada-us-Sani – Continued reflection on faith.",
  "20-6": "Urs of Imam Abu Hanifa (RA) – Founder of Hanafi fiqh.",

  // ──────────────── RAJAB ────────────────
  "1-7": "Beginning of Rajab – One of the sacred months.",
  "13-7": "Birth of Hazrat Ali (RA) – Symbol of bravery, justice, and wisdom.",
  "22-7": "Urs of Imam Jafar Sadiq (RA).",
  "27-7": "Shab-e-Meraj – The Night Journey and Ascension of Prophet Muhammad ﷺ.",

  // ──────────────── SHABAN ────────────────
  "1-8": "Start of Shaban – Month of preparation before Ramadan.",
  "15-8": "Shab-e-Barat – Night of forgiveness and mercy (Laylatul Bara'ah).",

  // ──────────────── RAMADAN ────────────────
  "1-9": "Start of Ramadan – Month of fasting, Quran, and spiritual purification.",
  "10-9": "First Ashra of Ramadan – Mercy of Allah.",
  "15-9": "Mid-Ramadan – Reflection and consistency in worship.",
  "20-9": "Second Ashra ends – Forgiveness period.",
  "21-9": "Beginning of Last Ashra – Seeking Laylatul Qadr.",
  "27-9": "Laylatul Qadr – The Night of Power, better than a thousand months.",
  "29-9": "Potential Last Fast – Moon sighting awaited.",
  "30-9": "Completion of Ramadan – Gratitude and reflection.",

  // ──────────────── SHAWWAL ────────────────
  "1-10": "Eid-ul-Fitr – Celebration marking the end of Ramadan.",
  "2-10": "Fasting of Shawwal begins – Six fasts recommended.",
  "6-10": "Completion of Six Fasts of Shawwal – Equal to fasting whole year (hadith).",

  // ──────────────── DHUL-QADAH ────────────────
  "1-11": "Start of Dhul-Qadah – One of the sacred months.",
  "11-11": "Birth of Imam Raza (RA) – According to some narrations.",

  // ──────────────── DHUL-HIJJAH ────────────────
  "1-12": "Beginning of Dhul-Hijjah – Sacred month of Hajj.",
  "8-12": "Day of Tarwiyah – Preparation for Hajj.",
  "9-12": "Day of Arafah – Greatest day for forgiveness; fasting highly recommended.",
  "10-12": "Eid-ul-Adha – Festival of sacrifice and obedience.",
  "11-12": "Ayyam-ut-Tashreeq – Days of remembrance and gratitude.",
  "12-12": "Ayyam-ut-Tashreeq – Continued remembrance of Allah.",
  "13-12": "Last Day of Tashreeq – Completion of Hajj rituals."
};


// 🔹 Hijri Months for different languages (from dashboard.js)
const hijriMonths = {
    en: [
        "", "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ],
    ur: [
        "", "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ],
    ar: [
        "", "مُحَرَّم", "صَفَر", "رَبِيع ٱلْأَوَّل", "رَبِيع ٱلْآخِر",
        "جُمَادَىٰ ٱلْأُولَىٰ", "جُمَادَىٰ ٱلْآخِرَة", "رَجَب", "شَعْبَان",
        "رَمَضَان", "شَوَّال", "ذُو ٱلْقَعْدَة", "ذُو ٱلْحِجَّة"
    ]
};

// 🔹 Get Hijri Month Length (from dashboard.js)
function getHijriMonthLength(monthNumber, method = "global") {
    if (method === "global") {
        return monthNumber % 2 === 1 ? 30 : 29;
    }

    // South Asia (moon sighting approximation) - from dashboard.js
    if (monthNumber === 12) return 30; // Dhu al-Hijjah often 30
    if (monthNumber === 9) return 30;  // Ramadan often 30
    return 29;
}

// 🔹 Get Month Name based on language (from dashboard.js)
function getMonthName(monthNumber, lang) {
    if (hijriMonths[lang] && hijriMonths[lang][monthNumber]) {
        return hijriMonths[lang][monthNumber];
    }
    // Fallback to English
    return hijriMonths.en[monthNumber];
}

// 🔹 Get Hijri Date with region support (based on dashboard.js logic)
async function getHijriToday(method = "global") {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();

    // Fetch from Aladhan API
    const res = await fetch(
        `https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`
    );
    const json = await res.json();

    if (!json.data) {
        throw new Error("Failed to fetch Hijri date");
    }

    let hijriDay = parseInt(json.data.hijri.day);
    let hijriMonth = parseInt(json.data.hijri.month.number);
    let hijriYear = parseInt(json.data.hijri.year);

    // Apply region-specific adjustments (like in dashboard.js)
    if (method === "pakistan" || method === "south-asia") {
        // South Asia often starts months 1 day later
        const now = new Date();
        const hours = now.getUTCHours();
        
        // If it's before sunset (around 6 PM UTC), use previous day
        if (hours < 18) {
            hijriDay = hijriDay - 1;
            
            // Handle month/year boundaries
            if (hijriDay < 1) {
                hijriMonth = hijriMonth - 1;
                if (hijriMonth < 1) {
                    hijriMonth = 12;
                    hijriYear = hijriYear - 1;
                }
                hijriDay = getHijriMonthLength(hijriMonth, method);
            }
        }
    }
    
    // For Turkey method (sometimes different calculation)
    if (method === "turkey") {
        // Turkey may use different calculation
        // You can add specific adjustments here if needed
    }

    // Get month name based on English for now (language will be applied in email)
    const monthName = hijriMonths.en[hijriMonth] || json.data.hijri.month.en;

    return {
        hijri: `${hijriDay} ${monthName} ${hijriYear} AH`,
        hijriDay: hijriDay.toString(),
        hijriMonth: hijriMonth.toString(),
        hijriMonthEn: monthName,
        hijriMonthAr: json.data.hijri.month.ar,
        gregorian: json.data.gregorian.date,
        hijriYear: hijriYear.toString(),
        method: method
    };
}

// ✉️ Email Sender with Professional Template
async function sendEmail(to, hijriData, event, unsubscribeUrl, lang) {
    const logoUrl = "https://islamic-daily-reminder.vercel.app/images/emailicon.jpg";
    const fallbackLogo = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%232d6a4f'/><circle cx='65' cy='35' r='20' fill='%2340916c'/></svg>";

    // Determine font family based on language
    let fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
    
    if (lang === "ar") {
        fontFamily = "'Al Majeed Quranic Font', 'Amiri', 'Scheherazade', 'Traditional Arabic', serif";
    } else if (lang === "ur") {
        fontFamily = "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Arial Unicode MS', serif";
    }

    // Get month name in user's language
    const monthNumber = parseInt(hijriData.hijriMonth);
    const monthName = getMonthName(monthNumber, lang);

    // Format date for display
    const hijriDisplay = `${hijriData.hijriDay} ${monthName} ${hijriData.hijriYear} AH`;

    // Generate subject based on language and event
    let subject;
    if (lang === "ur") {
        subject = event ?
            `اسلامی موقع: ${event.split(' - ')[0]} — ${hijriDisplay}` :
            `اسلامی یومیہ یاددہانی — ${hijriDisplay}`;
    } else if (lang === "ar") {
        subject = event ?
            `مناسبة إسلامية: ${event.split(' - ')[0]} — ${hijriDisplay}` :
            ` التذكير الإسلامي اليومي — ${hijriDisplay}`;
    } else {
        subject = event ?
            `Islamic Event: ${event.split(' - ')[0]} — ${hijriDisplay}` :
            `${hijriDisplay} — Islamic Daily Reminder`;
    }

    // Generate email content based on language
    let emailTitle;
    let emailSubtitle;
    let hijriLabel;
    let gregorianLabel;
    let reminderTitle;
    let reminderContent;
    let quoteContent;
    let unsubscribeText;
    let footerText;
    let requestText;

    if (lang === "ur") {
        emailTitle = "اسلامی یومیہ یاددہانی";
        emailSubtitle = "روزانہ کی روحانی رہنمائی";
        hijriLabel = "ہجری";
        gregorianLabel = "ميلادي";
        reminderTitle = "آج کی یاددہانی";
        reminderContent = event || "آج کوئی خاص اسلامی موقع نہیں۔ روزانہ کی نیکیاں جاری رکھیں اور ہر کام میں اللہ کو یاد کریں۔ 🤍";
        quoteContent = "اللہ آپ کو سلامتی، ہدایت اور برکت عطا فرمائے۔ 🌙";
        unsubscribeText = "ان سبسکرائب کریں";
        footerText = "اسلامی یومیہ یاددہانی";
        requestText = "یہ ای میل آپ کی درخواست پر بھیجی گئی ہے۔";
    } else if (lang === "ar") {
        emailTitle = "التذكير الإسلامي اليومي";
        emailSubtitle = "الإرشاد الروحي اليومي";
        hijriLabel = "هجري";
        gregorianLabel = "ميلادي";
        reminderTitle = "تذكير اليوم";
        reminderContent = event || "لا يوجد حدث إسلامي خاص اليوم. واصل أعمالك الصالحة اليومية واذكر الله في كل ما تفعل. 🤍";
        quoteContent = "نسأل الله أن يمنحك السكينة والهداية والبركة 🌙";
        unsubscribeText = "إلغاء الاشتراك";
        footerText = "التذكير الإسلامي اليومي";
        requestText = "تم إرسال هذه الرسالة بناءً على طلبك.";
    } else {
        emailTitle = "Islamic Daily Reminder";
        emailSubtitle = "Daily Spiritual Guidance";
        hijriLabel = "Hijri";
        gregorianLabel = "Gregorian";
        reminderTitle = "Today's Reminder";
        reminderContent = event || "No major Islamic event today. Continue your daily good deeds and remember Allah in all that you do. 🤍";
        quoteContent = "May Allah grant you peace, guidance, and barakah 🌙";
        unsubscribeText = "Unsubscribe";
        footerText = "Islamic Daily Reminder";
        requestText = "This email was sent at your request.";
    }

    const mailOptions = {
        from: {
            name: "Islamic Daily Reminder",
            address: process.env.GMAIL_USER
        },
        to,
        subject: subject,
        html: `
<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ur" || lang === "ar" ? "rtl" : "ltr"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${emailTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            background-color: #f8fafc;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            direction: ${lang === "ur" || lang === "ar" ? "rtl" : "ltr"};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 15px 0 5px 0;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
        }
        
        .content {
            padding: 35px 30px;
        }
        
        .date-badges {
            margin: 20px 0 30px;
            text-align: center;
        }

        .badge {
            display: inline-block;
            margin: 6px;
            padding: 10px 18px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .badge span {
            display: inline-block;
            vertical-align: middle;
        }

        .badge span:first-child {
            margin-right: 6px;
            opacity: 0.85;
        }
        
        .event-section {
            margin: 35px 0;
        }
        
        .event-title {
            display: block;
            margin-bottom: 14px;
            font-size: 18px;
            font-weight: 600;
            color: #2d6a4f;
            text-align: left;
            border-left: 4px solid #2d6a4f;
            padding-left: 12px;
        }

        .event-content {
            background: #f9fafb;
            padding: 22px;
            font-size: 15px;
            line-height: 1.75;
            color: #374151;
            border-radius: 12px;
        }
        
        .quote-section {
            margin: 35px 0;
            padding: 25px;
            background: rgba(45, 106, 79, 0.05);
            border-radius: 12px;
            text-align: center;
            font-style: italic;
            color: #2d6a4f;
            border-left: ${lang === "ur" || lang === "ar" ? "none" : "3px solid #2d6a4f"};
            border-right: ${lang === "ur" || lang === "ar" ? "3px solid #2d6a4f" : "none"};
        }
        
        .footer {
            background: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .unsubscribe-btn {
            display: inline-block;
            background: #ef4444;
            color: white;
            padding: 12px 25px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .unsubscribe-btn:hover {
            background: #dc2626;
            transform: translateY(-2px);
        }
        
        .social-icons {
            text-align: center;
            margin: 18px 0 8px;
        }

        .social-icon {
            display: inline-block;
            width: 42px;
            height: 42px;
            margin: 0 6px;
            background: #2d6a4f;
            color: #ffffff;
            border-radius: 50%;
            text-decoration: none;
            font-size: 18px;
            line-height: 42px;
            text-align: center;
        }

        .social-icon:hover {
            background: #40916c;
            transform: translateY(-2px);
        }
        
        .copyright {
            color: #6b7280;
            font-size: 12px;
            margin-top: 20px;
        }
        
        .logo-img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.3);
            object-fit: cover;
        }

        /* Responsive */
        @media (max-width: 600px) {
            .content {
                padding: 25px 20px;
            }
            
            .header {
                padding: 25px 15px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .badge {
                padding: 10px 15px;
                font-size: 13px;
            }
            
            .event-content {
                padding: 20px;
            }
        }

        /* RTL adjustments */
        ${lang === "ur" || lang === "ar" ? `
        .event-title {
            text-align: right;
            border-left: none;
            border-right: 4px solid #2d6a4f;
            padding-left: 0;
            padding-right: 12px;
        }
        
        .badge span:first-child {
            margin-right: 0;
            margin-left: 6px;
        }
        ` : ''}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="${logoUrl}" alt="${emailTitle}" class="logo-img" onerror="this.src='${fallbackLogo}'">
            <h1>${emailTitle}</h1>
            <p>${emailSubtitle}</p>
        </div>
        
        <div class="content">
            <div class="date-badges">
                <div class="badge">
                    <span>📅</span>
                    <span>${hijriLabel}: ${hijriDisplay}</span>
                </div>
                <div class="badge">
                    <span>📅</span>
                    <span>${gregorianLabel}: ${hijriData.gregorian}</span>
                </div>
            </div>
            
            <div class="event-section">
                <div class="event-title">
                    <span>${reminderTitle}</span>
                </div>
                <div class="event-content">
                    ${reminderContent}
                </div>
            </div>
            
            <div class="quote-section">
                ${quoteContent}
            </div>
        </div>
        
        <div class="footer">
            <a href="${unsubscribeUrl}" class="unsubscribe-btn">
                ${unsubscribeText}
            </a>
            
            <div class="social-icons">
                <a href="https://islamic-daily-reminder.vercel.app" class="social-icon">🌐</a>
                <a href="https://islamic-daily-reminder.vercel.app/dashboard.html" class="social-icon">⚙️</a>
            </div>
            
            <div class="copyright">
                <p>© ${new Date().getFullYear()} ${footerText}</p>
                <p>${requestText}</p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
        text: `${emailTitle}\n\n${hijriLabel}: ${hijriDisplay}\n${gregorianLabel}: ${hijriData.gregorian}\n\n${reminderTitle}:\n${reminderContent}\n\n${unsubscribeText}: ${unsubscribeUrl}`,
        headers: {
            'X-Mailer': 'Islamic Daily Reminder',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Precedence': 'bulk',
            'Importance': 'Normal'
        }
    };

    try {
        console.log(`📧 Attempting to send email to: ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to: ${to}`);
        console.log(`📨 Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        
        // Check if it's a logo URL issue
        if (error.message.includes('logoUrl') || error.message.includes('undefined')) {
            console.log('⚠️  Logo URL issue detected, trying with fallback...');
            mailOptions.html = mailOptions.html.replace(logoUrl, fallbackLogo);
            try {
                const retryInfo = await transporter.sendMail(mailOptions);
                console.log(`✅ Email sent with fallback logo to: ${to}`);
                return true;
            } catch (retryError) {
                console.error(`❌ Retry also failed for ${to}:`, retryError.message);
                throw retryError;
            }
        }
        throw error;
    }
}

// 🔥 MAIN HANDLER with region support
export default async function handler(req, res) {
    console.log("🚀 /api/sendEmails endpoint called");
    console.log("📅 Current time:", new Date().toISOString());
    
    // Add start time for processing time calculation
    const startTime = Date.now();

    try {
        // Get all active subscriptions with their region preferences
        console.log("🔍 Querying Firestore for active subscriptions...");
        const snap = await db.collection("subscriptions")
            .where("active", "==", true)
            .get();

        console.log(`📋 Found ${snap.size} active subscriptions`);

        if (snap.size === 0) {
            console.log("⚠️  No active subscriptions found");
            return res.status(200).json({
                success: true,
                message: "No active subscriptions found",
                total: 0,
                sent: 0,
                failed: 0
            });
        }

        // Log all subscribers with their preferences
        console.log("📝 Subscriber details:");
        snap.forEach((doc, index) => {
            const data = doc.data();
            console.log(`   ${index + 1}. ${data.email} (${data.language || 'en'}, method: ${data.hijriMethod || 'global'})`);
        });

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        console.log("\n📧 Starting to send emails...");

        // Send emails with region-specific dates
        for (const doc of snap.docs) {
            const { email, active, language = "en", hijriMethod = "global" } = doc.data();

            console.log(`\n📨 Processing: ${email} (${language}, method: ${hijriMethod})`);

            if (!active) {
                console.log(`   ⏭️  Skipping - not active`);
                results.failed++;
                continue;
            }

            try {
                // Get Hijri date with user's selected method
                const hijriData = await getHijriToday(hijriMethod);
                
                // Check for events based on the region-corrected date
                const eventKey = `${hijriData.hijriDay}-${hijriData.hijriMonth}`;
                const event = EVENTS[eventKey] || null;

                console.log(`   📊 Date: ${hijriData.hijri} (using ${hijriMethod} method)`);
                console.log(`   🎯 Event found: ${event ? 'Yes' : 'No'}`);

                const unsubscribeUrl = `https://islamic-daily-reminder.vercel.app/api/unsubscribe?email=${encodeURIComponent(email)}`;
                console.log(`   🔗 Unsubscribe URL: ${unsubscribeUrl}`);

                await sendEmail(
                    email,
                    hijriData,
                    event,
                    unsubscribeUrl,
                    language
                );

                results.success++;
                console.log(`   ✅ Sent successfully`);

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                results.failed++;
                results.errors.push({
                    email,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                console.error(`   ❌ Failed: ${error.message}`);
                continue;
            }
        }

        const processingTime = Date.now() - startTime;
        
        console.log(`\n📊 Email sending completed:`);
        console.log(`   ✅ Successfully sent: ${results.success}`);
        console.log(`   ❌ Failed: ${results.failed}`);
        console.log(`   ⏱️  Processing time: ${processingTime}ms`);

        res.status(200).json({
            success: true,
            total: snap.size,
            sent: results.success,
            failed: results.failed,
            errors: results.errors.length > 0 ? results.errors : undefined,
            summary: {
                timestamp: new Date().toISOString(),
                processingTime: `${processingTime}ms`,
                message: `Sent ${results.success} emails with region-specific dates`,
                regionSupport: "Enabled - Users receive dates according to their selected Hijri method"
            }
        });

    } catch (err) {
        console.error("❌ CRITICAL ERROR in handler:", err);
        console.error("Stack trace:", err.stack);

        res.status(500).json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString(),
            details: process.env.NODE_ENV === 'development' ? {
                stack: err.stack,
                name: err.name
            } : undefined
        });
    }
}