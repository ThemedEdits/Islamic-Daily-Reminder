import { db, auth } from "./firebase.js";
import { getHijriToday } from "./hijri.js";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const emailInput = document.getElementById("subEmail");
const languageSelect = document.getElementById("language");
const status = document.getElementById("status");
const hijriMethodInput = document.getElementById("hijriMethod");


// Islamic events data
const EVENTS = {
    "1-1": "Islamic New Year - A time for reflection and new beginnings",
    "10-1": "Day of Ashura - Fasting recommended on this day",
    "12-3": "Eid Milad-un-Nabi ﷺ - Birth of Prophet Muhammad (PBUH)",
    "1-9": "Start of Ramadan - Month of fasting and spiritual reflection",
    "27-9": "Laylatul Qadr - The Night of Power, better than 1000 months",
    "1-10": "Eid-ul-Fitr - Festival of breaking the fast",
    "10-12": "Eid-ul-Adha - Festival of sacrifice"
};

// Add this mapping to your dashboard.js
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

// ADD THIS: Islamic Months Card HTML Template
const islamicMonthsCardHTML = `
<div class="card islamic-months-card">
    <div class="card-header">
        <h2> Islamic Months</h2>
        <i class="fas fa-star-and-crescent"></i>
    </div>
    <div class="months-container">
        <div class="months-grid" id="monthsGrid">
            <!-- Months will be dynamically generated here -->
        </div>
        <div class="month-info" id="monthInfo">
            <div class="info-content">
                <h3 id="currentMonthName">Select a month</h3>
                <p id="monthDescription">Click on any month to learn more about it</p>
                <div class="month-stats">
                    <div class="stat">
                        <i class="fas fa-calendar-day"></i>
                        <span id="monthDays">-- days</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        <span id="monthEvents">No events</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// ADD THIS: Month descriptions data
const monthDescriptions = {
    en: {
        1: "Muharram - The first month of the Islamic calendar. A sacred month.",
        2: "Safar - The second month. Some consider it unlucky, but this has no basis in authentic Islamic teachings.",
        3: "Rabi' al-Awwal - The birth month of Prophet Muhammad ﷺ.",
        4: "Rabi' al-Thani - The fourth month of the Islamic calendar.",
        5: "Jumada al-Awwal - The fifth month of the Islamic calendar.",
        6: "Jumada al-Thani - The sixth month of the Islamic calendar.",
        7: "Rajab - A sacred month. The journey of Isra' and Mi'raj occurred in this month.",
        8: "Sha'ban - The month before Ramadan. Prophet Muhammad ﷺ used to fast most of this month.",
        9: "Ramadan - The month of fasting, prayer, reflection, and community.",
        10: "Shawwal - The month following Ramadan. Eid al-Fitr is celebrated on the 1st.",
        11: "Dhu al-Qi'dah - A sacred month. One of the months of Hajj.",
        12: "Dhu al-Hijjah - The month of Hajj. Eid al-Adha is celebrated on the 10th."
    },
    ur: {
        1: "محرم - اسلامی کیلنڈر کا پہلا مہینہ۔ ایک مقدس مہینہ۔",
        2: "صفر - دوسرا مہینہ۔ کچھ لوگ اسے منحوس سمجھتے ہیں، لیکن اس کی کوئی صحیح اسلامی بنیاد نہیں ہے۔",
        3: "ربیع الاول - رسول اللہ ﷺ کا یوم ولادت کا مہینہ۔",
        4: "ربیع الآخر - اسلامی کیلنڈر کا چوتھا مہینہ۔",
        5: "جمادی الاول - اسلامی کیلنڈر کا پانچواں مہینہ۔",
        6: "جمادی الآخر - اسلامی کیلنڈر کا چھٹا مہینہ۔",
        7: "رجب - ایک مقدس مہینہ۔ اسراء اور معراج کا واقعہ اسی مہینے میں پیش آیا۔",
        8: "شعبان - رمضان سے پہلے کا مہینہ۔ رسول اللہ ﷺ اس مہینے کے زیادہ تر دنوں میں روزہ رکھتے تھے۔",
        9: "رمضان - روزے، نماز، تفکر اور اجتماعیت کا مہینہ۔",
        10: "شوال - رمضان کے بعد کا مہینہ۔ عید الفطر یکم شوال کو منائی جاتی ہے۔",
        11: "ذوالقعدہ - ایک مقدس مہینہ۔ حج کے مہینوں میں سے ایک۔",
        12: "ذوالحجہ - حج کا مہینہ۔ عید الاضحی 10 ذوالحجہ کو منائی جاتی ہے۔"
    },
    ar: {
        1: "مُحَرَّم - الشهر الأول من التقويم الهجري. شهر حرام.",
        2: "صَفَر - الشهر الثاني. يعتبره البعض شهرًا غير مبارك، ولكن هذا ليس له أساس في التعاليم الإسلامية الصحيحة.",
        3: "رَبِيع ٱلْأَوَّل - شهر مولد النبي محمد ﷺ.",
        4: "رَبِيع ٱلْآخِر - الشهر الرابع من التقويم الهجري.",
        5: "جُمَادَىٰ ٱلْأُولَىٰ - الشهر الخامس من التقويم الهجري.",
        6: "جُمَادَىٰ ٱلْآخِرَة - الشهر الساس من التقويم الهجري.",
        7: "رَجَب - شهر حرام. حدثت رحلة الإسراء والمعراج في هذا الشهر.",
        8: "شَعْبَان - الشهر الذي يسبق رمضان. كان النبي محمد ﷺ يصوم معظم هذا الشهر.",
        9: "رَمَضَان - شهر الصيام والصلاة والتفكير والمجتمع.",
        10: "شَوَّال - الشهر الذي يلي رمضان. يحتفل بعيد الفطر في الأول منه.",
        11: "ذُو ٱلْقَعْدَة - شهر حرام. أحد أشهر الحج.",
        12: "ذُو ٱلْحِجَّة - شهر الحج. يحتفل بعيد الأضحى في العاشر منه."
    }
};

// ADD THIS: Month events data
const monthEvents = {
    1: ["Islamic New Year (1st)", "Day of Ashura (10th)"],
    3: ["Eid Milad-un-Nabi ﷺ (12th)"],
    7: ["Isra' and Mi'raj (27th)"],
    8: ["Mid-Sha'ban (15th)"],
    9: ["Start of Ramadan (1st)", "Laylatul Qadr (27th)"],
    10: ["Eid al-Fitr (1st)"],
    12: ["Hajj (8th-13th)", "Eid al-Adha (10th)"]
};

// Load today's dates and events
async function loadDashboardData() {
    const datesDiv = document.getElementById("dates");
    const eventBox = document.getElementById("eventBox");

    try {
        const hijriMethod = hijriMethodInput?.value || "pakistan";

const today = await getHijriToday(hijriMethod);

        const eventKey = `${today.hijriDay}-${today.hijriMonth}`;
        const event = EVENTS[eventKey];

        // Get current language for month name display
        const userLang = languageSelect.value || 'en';

        // Calculate progress percentage for visual indicator
        const dayNum = parseInt(today.hijriDay);
        const monthLength = getHijriMonthLength(parseInt(today.hijriMonth));
        const progressPercent = Math.round((dayNum / monthLength) * 100);

        // Display dates
        datesDiv.innerHTML = `
            <div class="date-item">
                <span class="date-label">Hijri Date</span>
                <span class="date-value">${today.hijri}</span>
            </div>
            <div class="date-item">
                <span class="date-label">Gregorian Date</span>
                <span class="date-value">${today.gregorian}</span>
            </div>
            <div class="date-item">
                <span class="date-label">Hijri Date</span>
                <span class="date-value">
                    ${today.hijriDay} ${getMonthName(today, userLang)}
                </span>
            </div>
            
        `;

        // Display event
        eventBox.innerHTML = event ? `
            <div class="event-highlight">
                <i class="fas fa-star"></i>
                <h3>Today's Special</h3>
                <p>${event}</p>
                <small>May Allah accept our deeds on this blessed day</small>
            </div>
        ` : `
            <div class="event-highlight">
                <i class="fas fa-heart"></i>
                <h3>Daily Reminder</h3>
                <p>No major Islamic event today. Continue your good deeds and remember Allah in all that you do.</p>
                <small>"Verily, in the remembrance of Allah do hearts find rest." (Quran 13:28)</small>
            </div>
        `;

        // ADD THIS: Render Islamic Months Card
        renderIslamicMonthsCard(parseInt(today.hijriMonth), userLang);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        datesDiv.innerHTML = `<p class="error">Error loading dates. Please refresh.</p>`;
        eventBox.innerHTML = `<p class="error">Error loading events.</p>`;
        
        // Still try to render months card even if date fails
        renderIslamicMonthsCard(1, 'en');
    }
}

// ADD THIS: Render Islamic Months Card
function renderIslamicMonthsCard(currentMonth, lang = 'en') {
    // Insert the months card before the subscription card if it doesn't exist
    const subscriptionCard = document.querySelector('.subscription-card');
    const existingMonthsCard = document.querySelector('.islamic-months-card');
    
    if (!existingMonthsCard) {
        if (subscriptionCard) {
            subscriptionCard.insertAdjacentHTML('beforebegin', islamicMonthsCardHTML);
        } else {
            // If subscription card not found, add to dashboard grid
            const dashboardGrid = document.querySelector('.dashboard-grid');
            if (dashboardGrid) {
                dashboardGrid.insertAdjacentHTML('beforeend', islamicMonthsCardHTML);
            }
        }
    }
    
    // Generate months grid
    const monthsGrid = document.getElementById('monthsGrid');
    if (!monthsGrid) return;
    
    monthsGrid.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
        const monthName = hijriMonths[lang] && hijriMonths[lang][i] ? hijriMonths[lang][i] : hijriMonths.en[i];
        const isCurrent = i === currentMonth;
        const monthLength = getHijriMonthLength(i);
        
        const monthElement = document.createElement('div');
        monthElement.className = `month-item ${isCurrent ? 'current-month' : ''}`;
        monthElement.dataset.month = i;
        monthElement.dataset.lang = lang;
        
        monthElement.innerHTML = `
            <div class="month-number">${i}</div>
            <div class="month-name">${monthName}</div>
            <div class="month-days">${monthLength} days</div>
            ${isCurrent ? '<div class="current-indicator"><i class="fas fa-circle"></i> Current</div>' : ''}
        `;
        
        monthElement.addEventListener('click', () => showMonthInfo(i, lang));
        monthsGrid.appendChild(monthElement);
    }
    
    // Show info for current month by default
    showMonthInfo(currentMonth, lang);
}

// ADD THIS: Show month info
function showMonthInfo(monthNumber, lang = 'en') {
    const monthName = hijriMonths[lang] && hijriMonths[lang][monthNumber] ? hijriMonths[lang][monthNumber] : hijriMonths.en[monthNumber];
    const description = monthDescriptions[lang] && monthDescriptions[lang][monthNumber] ? monthDescriptions[lang][monthNumber] : monthDescriptions.en[monthNumber];
    const events = monthEvents[monthNumber] || [];
    const monthLength = getHijriMonthLength(monthNumber);
    
    // Update month info display
    const monthInfo = document.getElementById('monthInfo');
    const currentMonthName = document.getElementById('currentMonthName');
    const monthDescription = document.getElementById('monthDescription');
    const monthDays = document.getElementById('monthDays');
    const monthEventsElement = document.getElementById('monthEvents');
    
    if (currentMonthName) currentMonthName.textContent = monthName;
    if (monthDescription) monthDescription.textContent = description;
    if (monthDays) monthDays.textContent = `${monthLength} days`;
    if (monthEventsElement) {
        if (events.length > 0) {
            monthEventsElement.textContent = events.length > 1 ? `${events.length} events` : events[0];
        } else {
            monthEventsElement.textContent = 'No major events';
        }
    }
    
    // Highlight selected month in grid
    document.querySelectorAll('.month-item').forEach(item => {
        item.classList.remove('selected');
        if (parseInt(item.dataset.month) === monthNumber) {
            item.classList.add('selected');
        }
    });
    
    // Add animation
    if (monthInfo) {
        monthInfo.style.animation = 'none';
        setTimeout(() => {
            monthInfo.style.animation = 'slideIn 0.5s ease-out';
        }, 10);
    }
}

// ADD THIS: Get Hijri month length
function getHijriMonthLength(monthNumber) {
    // In the Islamic lunar calendar:
    // Odd-numbered months have 30 days
    // Even-numbered months have 29 days
    // Except Dhu al-Hijjah (12th) which can be 29 or 30
    return monthNumber % 2 === 1 ? 30 : 29;
}

// Helper function to get month name based on language
function getMonthName(today, lang) {
    const monthIndex = parseInt(today.hijriMonth);
    if (hijriMonths[lang] && hijriMonths[lang][monthIndex]) {
        return hijriMonths[lang][monthIndex];
    }
    // Fallback to English
    return hijriMonths.en[monthIndex] || today.hijriMonthEn;
}

// Subscription functionality
document.getElementById("subscribeBtn").addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const language = languageSelect.value;

    if (!email) {
        showStatus("Please enter a valid email address.", "error");
        return;
    }

    if (!validateEmail(email)) {
        showStatus("Please enter a valid email address.", "error");
        return;
    }

    const btn = document.getElementById("subscribeBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
    btn.classList.add('loading');

    try {
        const q = query(
            collection(db, "subscriptions"),
            where("email", "==", email)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
            // Update existing subscription
            snap.forEach(async doc => {
                await updateDoc(doc.ref, {
                    active: true,
                    language,
                    updatedAt: new Date().toISOString()
                });
            });

            showStatus("Subscription reactivated successfully! You'll start receiving reminders tomorrow.", "success");
        } else {
            // New subscription
            await addDoc(collection(db, "subscriptions"), {
    email,
    active: true,
    language,
    hijriMethod: hijriMethodInput.value || "karachi",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});


            showStatus("Subscribed successfully! You'll receive your first reminder tomorrow morning.", "success");
        }

        emailInput.value = "";

        // Animate success
        btn.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('loading');
        }, 2000);

    } catch (err) {
        console.error(err);
        showStatus("Something went wrong. Please try again.", "error");
        btn.innerHTML = originalText;
        btn.classList.remove('loading');
    }
});

document.getElementById("unsubscribeBtn").addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
        showStatus("Please enter your email address.", "error");
        return;
    }

    if (!validateEmail(email)) {
        showStatus("Please enter a valid email address.", "error");
        return;
    }

    const btn = document.getElementById("unsubscribeBtn");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Unsubscribing...';
    btn.classList.add('loading');

    try {
        const q = query(
            collection(db, "subscriptions"),
            where("email", "==", email)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
            showStatus("No subscription found with this email.", "error");
            btn.innerHTML = originalText;
            btn.classList.remove('loading');
            return;
        }

        snap.forEach(async doc => {
            await updateDoc(doc.ref, {
    active: true,
    language,
    hijriMethod: hijriMethodInput.value || "karachi",
    updatedAt: new Date().toISOString()
});

        });

        showStatus("You have been unsubscribed. We'll miss you! May Allah keep you guided.", "success");
        emailInput.value = "";

        // Animate success
        btn.innerHTML = '<i class="fas fa-check"></i> Unsubscribed!';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('loading');
        }, 2000);

    } catch (err) {
        console.error(err);
        showStatus("Something went wrong. Please try again.", "error");
        btn.innerHTML = originalText;
        btn.classList.remove('loading');
    }
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout error:", error);
    }
});

// Helper functions
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status-message ${type}`;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status-message';
        }, 5000);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (!user && window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
    });
    
    // ADD THIS: Update months when language changes
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            loadDashboardData();
        });
    }
});

const select = document.querySelector(".custom-select");
const display = select.querySelector(".select-display");
const valueSpan = select.querySelector(".select-value");
const options = select.querySelectorAll(".select-options li");
const hiddenInput = document.getElementById("language");
const hijriSelect = document.getElementById("hijriMethodWrapper");
const hijriDisplay = hijriSelect?.querySelector(".select-display");
const hijriValueSpan = hijriSelect?.querySelector(".select-value");
const hijriOptions = hijriSelect?.querySelectorAll(".select-options li");

if (hijriDisplay) {
    hijriDisplay.addEventListener("click", () => {
        hijriSelect.classList.toggle("open");
    });
}

if (hijriOptions) {
    hijriOptions.forEach(option => {
        option.addEventListener("click", () => {
            const value = option.dataset.value;
            hijriValueSpan.textContent = option.textContent;
            hijriMethodInput.value = value;

            hijriSelect.classList.add("active");
            hijriSelect.classList.remove("open");

            // 🔁 Reload dashboard with new method
            loadDashboardData();
        });
    });
}


// Toggle curtain
if (display) {
    display.addEventListener("click", () => {
        select.classList.toggle("open");
    });
}

// Select option
if (options.length > 0) {
    options.forEach(option => {
        option.addEventListener("click", () => {
            const value = option.dataset.value;
            valueSpan.textContent = option.textContent;
            hiddenInput.value = value;

            select.classList.add("active");
            select.classList.remove("open");
            
            // Update months card when language changes
            loadDashboardData();
        });
    });
}

// Close on outside click
document.addEventListener("click", e => {
    if (select && !select.contains(e.target)) {
        select.classList.remove("open");
    }
});