export async function getHijriToday() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const res = await fetch(
    `https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`
  );

  const json = await res.json();

  if (!json.data) {
    throw new Error("Failed to fetch Hijri date");
  }

  return {
    hijri: json.data.hijri.date,
    hijriDay: json.data.hijri.day,
    hijriMonth: json.data.hijri.month.number,
    hijriMonthEn: json.data.hijri.month.en,  // English month name
    hijriMonthAr: json.data.hijri.month.ar,  // Arabic month name
    gregorian: json.data.gregorian.date,
    gregorianWeekday: json.data.gregorian.weekday.en,
    hijriWeekday: json.data.hijri.weekday.en
  };
}