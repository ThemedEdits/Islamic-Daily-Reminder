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

// ✉️ Email Sender with Professional Template
async function sendEmail(to, hijri, gregorian, event, unsubscribeUrl, lang) {
  const hijriData = await getHijriDate();

  // Define logo URL - FIXED: Now it's accessible in the template
  const logoUrl = "https://islamic-daily-reminder.vercel.app/images/emailicon.jpg";

  // If logo doesn't exist, use a fallback
  const fallbackLogo = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%232d6a4f'/><circle cx='65' cy='35' r='20' fill='%2340916c'/></svg>";

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

  // Generate subject based on language and event
  let subject;
  if (lang === "ur") {
    subject = event
      ? `اسلامی موقع: ${event.split(' - ')[0]} — ${hijri}`
      : `اسلامی یومیہ یاددہانی — ${hijri}`;
  } else if (lang === "ar") {
    subject = event
      ? `مناسبة إسلامية: ${event.split(' - ')[0]} — ${hijri}`
      : ` التذكير الإسلامي اليومي — ${hijri}`;
  } else {
    subject = event
      ? `Islamic Event: ${event.split(' - ')[0]} — ${hijri}`
      : `${hijri} — Islamic Daily Reminder`;
  }

  // Generate email content based on language
  let emailContent;
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
    <link href="${googleFonts}" rel="stylesheet">
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
            background: rgba(255, 158, 0, 0.05);
            border-radius: 12px;
            border-left: ${lang === "ur" || lang === "ar" ? "none" : "4px solid #ff9e00"};
            border-right: ${lang === "ur" || lang === "ar" ? "4px solid #ff9e00" : "none"};
            background: #f9fafb;
    padding: 22px;
    font-size: 15px;
    line-height: 1.75;
    color: #374151;
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
    line-height: 42px; /* 🔑 KEY FIX */
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

        .content {
    padding: 32px 28px;
}

.event-title {
    font-size: 17px;
    font-weight: 600;
}

.footer {
    padding: 22px 26px;
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
            <img src="${logoUrl}" alt="${emailTitle}" class="logo-img" onerror="this.src='${fallbackLogo}'">
            <h1>${emailTitle}</h1>
            <p>${emailSubtitle}</p>
        </div>
        
        <div class="content">
            <div class="date-badges">
                <div class="badge">
                    <span>📅</span>
                    <span>${hijriLabel}: ${hijri}</span>
                </div>
                <div class="badge">
                    <span>📅</span>
                    <span>${gregorianLabel}: ${gregorian}</span>
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

    // Add text version for email clients that don't support HTML
    text: `${emailTitle}\n\n` +
      `${hijriLabel}: ${hijri}\n` +
      `${gregorianLabel}: ${gregorian}\n\n` +
      `${reminderTitle}:\n` +
      `${event || (lang === "ur" ? "آج کوئی خاص اسلامی موقع نہیں۔ اللہ آپ کے دن میں برکت عطا فرمائے۔" :
        lang === "ar" ? "لا يوجد حدث إسلامي خاص اليوم. بارك الله في يومك." :
          "No major Islamic event today. May Allah bless your day.")}\n\n` +
      `${unsubscribeText}: ${unsubscribeUrl}`,

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
    console.log(`📧 Attempting to send email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error(`📧 Email details:`, { to, subject, lang });

    // Check if it's a logo URL issue
    if (error.message.includes('logoUrl') || error.message.includes('undefined')) {
      console.log('⚠️  Logo URL issue detected, trying with fallback...');
      // Try with fallback logo in a simplified version
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

// 🔥 MAIN HANDLER with detailed logging
export default async function handler(req, res) {
  console.log("🚀 /api/sendEmails endpoint called");
  console.log("📅 Current time:", new Date().toISOString());
  console.log("🔍 Environment check:", {
    hasFirebaseConfig: !!process.env.FIREBASE_PROJECT_ID,
    hasGmailUser: !!process.env.GMAIL_USER,
    hasGmailPass: !!process.env.GMAIL_PASS ? "Yes (hidden)" : "No"
  });

  try {
    // Get today's date
    console.log("📅 Fetching Hijri date...");
    const hijriData = await getHijriDate();
    const eventKey = `${hijriData.hijriDay}-${hijriData.hijriMonth}`;
    const event = EVENTS[eventKey] || null;

    console.log("📊 Date info:", {
      hijri: hijriData.hijri,
      gregorian: hijriData.gregorian,
      eventKey,
      eventFound: !!event
    });

    // Get all active subscriptions
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

    // Log all subscribers
    snap.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ${data.email} (${data.language || 'en'})`);
    });

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    console.log("📧 Starting to send emails...");

    // Send emails sequentially to avoid rate limits
    for (const doc of snap.docs) {
      const { email, active, language = "en" } = doc.data();

      console.log(`\n📨 Processing: ${email} (${language})`);

      if (!active) {
        console.log(`   ⏭️  Skipping - not active`);
        results.failed++;
        continue;
      }

      try {
        const unsubscribeUrl = `https://islamic-daily-reminder.vercel.app/api/unsubscribe?email=${encodeURIComponent(email)}`;
        console.log(`   🔗 Unsubscribe URL: ${unsubscribeUrl}`);

        await sendEmail(
          email,
          hijriData.hijri,
          hijriData.gregorian,
          event,
          unsubscribeUrl,
          language
        );

        results.success++;
        console.log(`   ✅ Sent successfully`);

        // Add small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        results.failed++;
        results.errors.push({
          email,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error(`   ❌ Failed: ${error.message}`);

        // Continue with next email even if one fails
        continue;
      }
    }

    console.log(`\n📊 Email sending completed:`);
    console.log(`   ✅ Successfully sent: ${results.success}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📧 Total attempted: ${snap.size}`);

    // Return response
    res.status(200).json({
      success: true,
      total: snap.size,
      sent: results.success,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
      summary: {
        hijriDate: hijriData.hijri,
        gregorianDate: hijriData.gregorian,
        eventFound: !!event,
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - req.startTime || 'unknown'}ms`
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