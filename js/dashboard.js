import { auth, db } from "./firebase.js";
import { doc, setDoc, deleteDoc, serverTimestamp } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getHijriToday } from "./hijri.js";
import { getEvent } from "./events.js";

const status = document.getElementById("status");
const subEmail = document.getElementById("subEmail");
const subscribeBtn = document.getElementById("subscribeBtn");
const unsubscribeBtn = document.getElementById("unsubscribeBtn");

auth.onAuthStateChanged(async user => {
  if (!user) location.href = "index.html";

  const date = await getHijriToday();
  const event = getEvent(date.hijriDay, date.hijriMonthNumber);

  dates.innerHTML = `
    <p><b>Hijri:</b> ${date.hijri}</p>
    <p><b>Gregorian:</b> ${date.gregorian}</p>
  `;

  eventBox.innerHTML = event
    ? `<p><b>Event:</b> ${event}</p>`
    : `<p>No Islamic event today</p>`;
});

subscribeBtn.onclick = async () => {
  if (!subEmail.value) {
    status.innerText = "Please enter an email";
    return;
  }

  await setDoc(doc(db, "subscriptions", auth.currentUser.uid), {
    email: subEmail.value,
    active: true,
    createdAt: serverTimestamp()
  });

  status.innerText = "Subscribed successfully";
};


unsubscribeBtn.onclick = async () => {
  await deleteDoc(doc(db, "subscriptions", auth.currentUser.uid));
  status.innerText = "Unsubscribed successfully";
};
