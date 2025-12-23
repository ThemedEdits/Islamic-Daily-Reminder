import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const emailInput = document.getElementById("subEmail");
const languageSelect = document.getElementById("language");
const status = document.getElementById("status");

document.getElementById("subscribeBtn").addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const language = languageSelect.value;

  if (!email) {
    status.textContent = "Please enter an email.";
    return;
  }

  try {
    const q = query(
      collection(db, "subscriptions"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      // Reactivate existing subscription
      snap.forEach(doc => {
        updateDoc(doc.ref, {
          active: true,
          language
        });
      });

      status.textContent = "Subscription updated successfully 🌙";
    } else {
      // New subscription
      await addDoc(collection(db, "subscriptions"), {
        email,
        active: true,
        language
      });

      status.textContent = "Subscribed successfully 🌙";
    }

    emailInput.value = "";
  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong. Please try again.";
  }
});

document.getElementById("unsubscribeBtn").addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    status.textContent = "Please enter your email.";
    return;
  }

  try {
    const q = query(
      collection(db, "subscriptions"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    snap.forEach(doc => {
      updateDoc(doc.ref, { active: false });
    });

    status.textContent = "You have been unsubscribed.";
    emailInput.value = "";
  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong.";
  }
});
