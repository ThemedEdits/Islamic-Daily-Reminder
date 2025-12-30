export async function getHijriToday(method = "pakistan") {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  // 👇 Offsets based on region
  let adjustment = 0;

  if (method === "pakistan") {
    adjustment = -1; // 🇵🇰 Pakistan moon sighting
  }
if (method === "global") adjustment = 0;

  const res = await fetch(
    `https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}&adjustment=${adjustment}`
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
    gregorianWeekday: json.data.gregorian.weekday.en,
    hijriWeekday: json.data.hijri.weekday.en
  };
}
