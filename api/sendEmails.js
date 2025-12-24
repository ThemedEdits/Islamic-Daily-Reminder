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
    // Improve email deliverability
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5
});

// 🔹 Islamic Events (Expanded)
const EVENTS = {
    "1-1": "Islamic New Year - A time for reflection and renewal",
    "10-1": "Day of Ashura - Recommended fasting day",
    "12-3": "Eid Milad-un-Nabi ﷺ - Blessed birth of Prophet Muhammad (PBUH)",
    "1-9": "Start of Ramadan - Month of fasting and spiritual growth",
    "27-9": "Laylatul Qadr - The Night of Power, better than 1000 months",
    "1-10": "Eid-ul-Fitr - Celebration after Ramadan",
    "10-12": "Eid-ul-Adha - Festival of Sacrifice"
};

// 🔹 Hijri Date with more details
async function getHijriDate() {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();

    const res = await fetch(
        `https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`
    );
    const json = await res.json();

    if (!json.data) {
        throw new Error("Failed to fetch Hijri date");
    }

    return {
        hijri: json.data.hijri.date,
        hijriDay: json.data.hijri.day,
        hijriMonth: json.data.hijri.month.number,
        hijriMonthEn: json.data.hijri.month.en,
        hijriMonthAr: json.data.hijri.month.ar,
        gregorian: json.data.gregorian.date,
        hijriYear: json.data.hijri.year
    };
}

// 📱 Email Content Generator
function getEmailContent(lang, hijri, gregorian, event, hijriMonthEn, hijriMonthAr) {
    const logoUrl = "https://islamic-daily-reminder.vercel.app/images/emailicon.jpg";
    const currentYear = new Date().getFullYear();
    
    if (lang === "ur") {
        return {
            subject: event
                ? `🌙 اسلامی موقع: ${event.split(' - ')[0]} — ${hijri}`
                : `🌙 اسلامی یومیہ یاددہانی — ${hijri}`,

            body: `
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="اسلامی یومیہ یاددہانی" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #2d6a4f; object-fit: cover;">
        </div>
        
        <div class="date-card" style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(64, 145, 108, 0.05)); padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #2d6a4f;">
          <p style="margin: 0 0 10px 0;"><strong>📅 ہجری تاریخ:</strong> ${hijri}</p>
          <p style="margin: 0 0 10px 0;"><strong>📅 عیسوی تاریخ:</strong> ${gregorian}</p>
        </div>
        
        <div class="reminder-card" style="background: rgba(255, 158, 0, 0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255, 158, 0, 0.2); margin: 25px 0;">
          <h3 style="color: #d97706; margin-top: 0; margin-bottom: 15px; text-align: center;">📢 آج کی یاددہانی</h3>
          <p style="font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          ${event || "آج کوئی خاص اسلامی موقع نہیں۔ روزانہ کی نیکیاں جاری رکھیں اور ہر کام میں اللہ کو یاد کریں۔ 🤍"}
          </p>
        </div>
        
        <div class="dua" style="text-align: center; padding: 20px; background: rgba(45, 106, 79, 0.05); border-radius: 12px; margin: 25px 0; font-style: italic;">
          <p style="margin: 0; color: #2d6a4f; font-size: 15px;">
          اللہ آپ کو سلامتی، ہدایت اور برکت عطا فرمائے۔ 🌙
          </p>
        </div>
      `,
            footer: `
        <p style="text-align: center; margin: 5px 0;">
          <small>© ${currentYear} اسلامی یومیہ یاددہانی</small>
        </p>
        <p style="text-align: center; margin: 5px 0; color: #666;">
          <small>یہ ای میل آپ کی درخواست پر بھیجی گئی ہے۔ براہ کرم جواب نہ دیں۔</small>
        </p>
      `
        };
    }

    if (lang === "ar") {
        return {
            subject: event
                ? `🌙 مناسبة إسلامية: ${event.split(' - ')[0]} — ${hijri}`
                : `🌙 التذكير الإسلامي اليومي — ${hijri}`,

            body: `
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="التذكير الإسلامي اليومي" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #2d6a4f; object-fit: cover;">
        </div>
        
        <div class="date-card" style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(64, 145, 108, 0.05)); padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 4px solid #2d6a4f;">
          <p style="margin: 0 0 10px 0;"><strong>📅 التاريخ الهجري:</strong> ${hijri}</p>
          <p style="margin: 0 0 10px 0;"><strong>📅 التاريخ الميلادي:</strong> ${gregorian}</p>
        </div>
        
        <div class="reminder-card" style="background: rgba(255, 158, 0, 0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255, 158, 0, 0.2); margin: 25px 0;">
          <h3 style="color: #d97706; margin-top: 0; margin-bottom: 15px; text-align: center;">📢 تذكير اليوم</h3>
          <p style="font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          ${event || "لا يوجد حدث إسلامي خاص اليوم. واصل أعمالك الصالحة اليومية واذكر الله في كل ما تفعل. 🤍"}
          </p>
        </div>
        
        <div class="dua" style="text-align: center; padding: 20px; background: rgba(45, 106, 79, 0.05); border-radius: 12px; margin: 25px 0; font-style: italic;">
          <p style="margin: 0; color: #2d6a4f; font-size: 15px;">
          نسأل الله أن يمنحك السكينة والهداية والبركة 🌙
          </p>
        </div>
      `,
            footer: `
        <p style="text-align: center; margin: 5px 0;">
          <small>© ${currentYear} التذكير الإسلامي اليومي</small>
        </p>
        <p style="text-align: center; margin: 5px 0; color: #666;">
          <small>تم إرسال هذه الرسالة بناءً على طلبك. الرجاء عدم الرد.</small>
        </p>
      `
        };
    }

    // Default English
    return {
        subject: event
            ? `🌙 Islamic Event: ${event.split(' - ')[0]} — ${hijri}`
            : `🌙 Islamic Daily Reminder — ${hijri}`,

        body: `
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="${logoUrl}" alt="Islamic Daily Reminder" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #2d6a4f; object-fit: cover;">
        </div>
        
        <div class="date-card" style="background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(64, 145, 108, 0.05)); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2d6a4f;">
          <p style="margin: 0 0 10px 0;"><strong>📅 Hijri Date:</strong> ${hijri}</p>
          <p style="margin: 0 0 10px 0;"><strong>📅 Gregorian Date:</strong> ${gregorian}</p>
        </div>
        
        <div class="reminder-card" style="background: rgba(255, 158, 0, 0.05); padding: 25px; border-radius: 12px; border: 1px solid rgba(255, 158, 0, 0.2); margin: 25px 0;">
          <h3 style="color: #d97706; margin-top: 0; margin-bottom: 15px; text-align: center;">📢 Today's Reminder</h3>
          <p style="font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          ${event || "No major Islamic event today. Continue your daily good deeds and remember Allah in all that you do. 🤍"}
          </p>
        </div>
        
        <div class="dua" style="text-align: center; padding: 20px; background: rgba(45, 106, 79, 0.05); border-radius: 12px; margin: 25px 0; font-style: italic;">
          <p style="margin: 0; color: #2d6a4f; font-size: 15px;">
          May Allah grant you peace, guidance, and barakah 🌙
          </p>
        </div>
      `,
        footer: `
        <p style="text-align: center; margin: 5px 0;">
          <small>© ${currentYear} Islamic Daily Reminder</small>
        </p>
        <p style="text-align: center; margin: 5px 0; color: #666;">
          <small>This email was sent at your request. Please do not reply.</small>
        </p>
      `
    };
}

// ✉️ Email Sender with Professional Template
async function sendEmail(to, hijri, gregorian, event, unsubscribeUrl, lang) {
    const hijriData = await getHijriDate();
    const content = getEmailContent(lang, hijri, gregorian, event, hijriData.hijriMonthEn, hijriData.hijriMonthAr);
    const logoUrl = "https://islamic-daily-reminder.vercel.app/images/emailicon.jpg";

    // Determine font family based on language
    let fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let googleFonts = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap";
    
    if (lang === "ar") {
        fontFamily = "'Noto Sans Arabic', 'Amiri', 'Scheherazade New', serif";
        googleFonts = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600&family=Amiri:wght@400;700&display=swap";
    } else if (lang === "ur") {
        fontFamily = "'Noto Nastaliq Urdu', 'Amiri', 'Jameel Noori Nastaleeq', serif";
        googleFonts = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@400;500&display=swap";
    }

    const mailOptions = {
        from: {
            name: "Islamic Daily Reminder 🌙",
            address: process.env.GMAIL_USER
        },
        to,
        subject: content.subject,
        html: `
<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ur" || lang === "ar" ? "rtl" : "ltr"}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link href="${googleFonts}" rel="stylesheet">
    <title>Islamic Daily Reminder</title>
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
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        
        .badge {
            background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(45, 106, 79, 0.2);
        }
        
        .event-section {
            margin: 35px 0;
        }
        
        .event-title {
            color: #d97706;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .event-content {
            background: rgba(255, 158, 0, 0.05);
            padding: 25px;
            border-radius: 12px;
            border-left: ${lang === "ur" || lang === "ar" ? "none" : "4px solid #ff9e00"};
            border-right: ${lang === "ur" || lang === "ar" ? "4px solid #ff9e00" : "none"};
            font-size: 16px;
            line-height: 1.8;
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
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
        }
        
        .social-icon {
            width: 40px;
            height: 40px;
            background: #2d6a4f;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 18px;
            transition: all 0.3s ease;
        }
        
        .social-icon:hover {
            background: #40916c;
            transform: translateY(-3px);
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
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="${logoUrl}" alt="Islamic Daily Reminder" class="logo-img">
            <h1>${lang === "ur" ? "اسلامی یومیہ یاددہانی" : lang === "ar" ? "التذكير الإسلامي اليومي" : "Islamic Daily Reminder"}</h1>
            <p>${lang === "ur" ? "روزانہ کی روحانی رہنمائی" : lang === "ar" ? "الإرشاد الروحي اليومي" : "Daily Spiritual Guidance"}</p>
        </div>
        
        <div class="content">
            <div class="date-badges">
                <div class="badge">
                    <span>📅</span>
                    <span>${lang === "ur" ? "ہجری" : lang === "ar" ? "هجري" : "Hijri"}: ${hijri}</span>
                </div>
                <div class="badge">
                    <span>📅</span>
                    <span>${lang === "ar" ? "ميلادي" : "Gregorian"}: ${gregorian}</span>
                </div>
            </div>
            
            <div class="event-section">
                <div class="event-title">
                    <span>${lang === "ur" ? "📢" : lang === "ar" ? "📢" : "📢"}</span>
                    <span>${lang === "ur" ? "آج کی یاددہانی" : lang === "ar" ? "تذكير اليوم" : "Today's Reminder"}</span>
                </div>
                <div class="event-content">
                    ${event || (lang === "ur" ? "آج کوئی خاص اسلامی موقع نہیں۔ روزانہ کی نیکیاں جاری رکھیں اور ہر کام میں اللہ کو یاد کریں۔ 🤍" : 
                               lang === "ar" ? "لا يوجد حدث إسلامي خاص اليوم. واصل أعمالك الصالحة اليومية واذكر الله في كل ما تفعل. 🤍" : 
                               "No major Islamic event today. Continue your daily good deeds and remember Allah in all that you do. 🤍")}
                </div>
            </div>
            
            <div class="quote-section">
                ${lang === "ur" ? "اللہ آپ کو سلامتی، ہدایت اور برکت عطا فرمائے۔ 🌙" : 
                  lang === "ar" ? "نسأل الله أن يمنحك السكينة والهداية والبركة 🌙" : 
                  "May Allah grant you peace, guidance, and barakah 🌙"}
            </div>
        </div>
        
        <div class="footer">
            <a href="${unsubscribeUrl}" class="unsubscribe-btn">
                ${lang === "ur" ? "ان سبسکرائب کریں" : lang === "ar" ? "إلغاء الاشتراك" : "Unsubscribe"}
            </a>
            
            <div class="social-icons">
                <a href="https://islamic-daily-reminder.vercel.app" class="social-icon">🌐</a>
                <a href="https://islamic-daily-reminder.vercel.app/dashboard.html" class="social-icon">⚙️</a>
            </div>
            
            <div class="copyright">
                <p>© ${new Date().getFullYear()} ${lang === "ur" ? "اسلامی یومیہ یاددہانی" : lang === "ar" ? "التذكير الإسلامي اليومي" : "Islamic Daily Reminder"}</p>
                <p>${lang === "ur" ? "یہ ای میل آپ کی درخواست پر بھیجی گئی ہے۔" : 
                    lang === "ar" ? "تم إرسال هذه الرسالة بناءً على طلبك." : 
                    "This email was sent at your request."}</p>
            </div>
        </div>
    </div>
</body>
</html>
        `,
        
        // Add text version for email clients that don't support HTML
        text: `${lang === "ur" ? "اسلامی یومیہ یاددہانی" : lang === "ar" ? "التذكير الإسلامي اليومي" : "Islamic Daily Reminder"}\n\n` +
              `${lang === "ur" ? "ہجری تاریخ:" : lang === "ar" ? "التاريخ الهجري:" : "Hijri Date:"} ${hijri}\n` +
              `${lang === "ar" ? "التاريخ الميلادي:" : "Gregorian Date:"} ${gregorian}\n\n` +
              `${lang === "ur" ? "آج کی یاددہانی:" : lang === "ar" ? "تذكير اليوم:" : "Today's Reminder:"}\n` +
              `${event || (lang === "ur" ? "آج کوئی خاص اسلامی موقع نہیں۔ اللہ آپ کے دن میں برکت عطا فرمائے۔" : 
                          lang === "ar" ? "لا يوجد حدث إسلامي خاص اليوم. بارك الله في يومك." : 
                          "No major Islamic event today. May Allah bless your day.")}\n\n` +
              `${lang === "ur" ? "ان سبسکرائب کریں:" : lang === "ar" ? "إلغاء الاشتراك:" : "Unsubscribe:"} ${unsubscribeUrl}`,
        
        // Email headers for better deliverability
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
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${to} (${lang})`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
        throw error;
    }
}

// 🔥 MAIN HANDLER
export default async function handler(req, res) {
    try {
        const hijriData = await getHijriDate();
        const eventKey = `${hijriData.hijriDay}-${hijriData.hijriMonth}`;
        const event = EVENTS[eventKey] || null;

        // Get all active subscriptions
        const snap = await db.collection("subscriptions")
            .where("active", "==", true)
            .get();

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Send emails sequentially to avoid rate limits
        for (const doc of snap.docs) {
            const { email, active, language } = doc.data();
            
            // Double-check active status
            if (!active) {
                results.failed++;
                continue;
            }

            try {
                const unsubscribeUrl = `https://islamic-daily-reminder.vercel.app/api/unsubscribe?email=${encodeURIComponent(email)}`;
                
                await sendEmail(
                    email,
                    hijriData.hijri,
                    hijriData.gregorian,
                    event,
                    unsubscribeUrl,
                    language || "en"
                );
                
                results.success++;
                
                // Add delay to avoid hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    email,
                    error: error.message
                });
                console.error(`Error sending to ${email}:`, error);
            }
        }

        console.log(`📧 Email sending complete: ${results.success} sent, ${results.failed} failed`);
        
        res.status(200).json({ 
            success: true, 
            total: snap.size,
            sent: results.success,
            failed: results.failed,
            errors: results.errors.length > 0 ? results.errors : undefined
        });
        
    } catch (err) {
        console.error("❌ Main handler error:", err);
        res.status(500).json({ 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}