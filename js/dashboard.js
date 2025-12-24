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

// Load today's dates and events
async function loadDashboardData() {
    const datesDiv = document.getElementById("dates");
    const eventBox = document.getElementById("eventBox");

    try {
        const today = await getHijriToday();
        const eventKey = `${today.hijriDay}-${today.hijriMonth}`;
        const event = EVENTS[eventKey];

        // Get current language for month name display
        const userLang = languageSelect.value || 'en';

        // Display dates with month names
        datesDiv.innerHTML = `
            <div class="date-item">
                <span class="date-label">Hijri Date</span>
                <span class="date-value">${today.hijri}</span>
            </div>
            <div class="date-label date-item"><span class="date-label">
            Gregorian Date</span>
                <span class="date-value">${today.gregorian}</span>
            </div>
            <div class="date-item">
                <span class="date-label">Hijri Day/Month</span>
                <span class="date-value">
                    ${today.hijriDay} ${getMonthName(today, userLang)}
                </span>
            </div>
            <div class="date-item">
                <span class="date-label">Day of Week</span>
                <span class="date-value">${today.hijriWeekday}</span>
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

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        datesDiv.innerHTML = `<p class="error">Error loading dates. Please refresh.</p>`;
        eventBox.innerHTML = `<p class="error">Error loading events.</p>`;
    }
}

// Helper function to get month name based on language
// Then update the getMonthName function:
function getMonthName(today, lang) {
    const monthIndex = parseInt(today.hijriMonth);
    if (hijriMonths[lang] && hijriMonths[lang][monthIndex]) {
        return hijriMonths[lang][monthIndex];
    }
    // Fallback to English
    return hijriMonths.en[monthIndex] || today.hijriMonthEn;
}

// Subscription functionality
document.getElementById("subscribeBtn").addEventListener("click", async() => {
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

document.getElementById("unsubscribeBtn").addEventListener("click", async() => {
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
                active: false,
                unsubscribedAt: new Date().toISOString()
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
document.getElementById("logoutBtn").addEventListener("click", async() => {
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
});



const select = document.querySelector(".custom-select");
const display = select.querySelector(".select-display");
const valueSpan = select.querySelector(".select-value");
const options = select.querySelectorAll(".select-options li");
const hiddenInput = document.getElementById("language");

// Toggle curtain
display.addEventListener("click", () => {
    select.classList.toggle("open");
});

// Select option
options.forEach(option => {
    option.addEventListener("click", () => {
        const value = option.dataset.value;
        valueSpan.textContent = option.textContent;
        hiddenInput.value = value;

        select.classList.add("active");
        select.classList.remove("open");
    });
});

// Close on outside click
document.addEventListener("click", e => {
    if (!select.contains(e.target)) {
        select.classList.remove("open");
    }
});