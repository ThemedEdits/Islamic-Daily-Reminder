import emailjs from "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/emailjs.min.js";

emailjs.init("LQkhVpkS4QGiTEisH");

export function sendDailyEmail(to, hijri, gregorian, event) {
  return emailjs.send("Islamic Daily Reminder W", "template_08xd1gn", {
    to_email: to,
    hijri,
    gregorian,
    event: event || "No Islamic event today"
  });
}
