import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGoPp-fOnpK_4cgxuq1nLBogIIav-Qzlo",
  authDomain: "islamic-daily-reminder-web-app.firebaseapp.com",
  projectId: "islamic-daily-reminder-web-app",
  storageBucket: "islamic-daily-reminder-web-app.firebasestorage.app",
  messagingSenderId: "392182425456",
  appId: "1:392182425456:web:88080ef974fe249d81d1b5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
