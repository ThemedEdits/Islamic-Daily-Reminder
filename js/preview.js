import { getHijriToday } from './hijri.js';

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

document.addEventListener('DOMContentLoaded', async () => {
    const previewHijri = document.getElementById('previewHijri');
    const previewGregorian = document.getElementById('previewGregorian');
    const previewEvent = document.getElementById('previewEvent');
    
    try {
        const today = await getHijriToday();
        const eventKey = `${today.hijriDay}-${today.hijriMonth}`;
        const event = EVENTS[eventKey];
        
        previewHijri.textContent = today.hijri;
        previewGregorian.textContent = today.gregorian;
        previewEvent.textContent = event || "No major Islamic event today. May Allah bless your day 🤍";
        
        // Add subtle animation
        previewHijri.style.animation = 'slideIn 0.5s ease-out';
        previewGregorian.style.animation = 'slideIn 0.5s ease-out 0.1s';
        previewEvent.style.animation = 'slideIn 0.5s ease-out 0.2s';
        
    } catch (error) {
        console.error('Error loading preview:', error);
        previewHijri.textContent = "Error loading date";
        previewGregorian.textContent = new Date().toLocaleDateString();
        previewEvent.textContent = "May your day be filled with blessings and peace.";
    }
});