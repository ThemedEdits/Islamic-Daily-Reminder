export async function getHijriToday(method = "pakistan") {
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

    let hijri = json.data.hijri;

    // ✅ SOUTH ASIA ADJUSTMENT
    if (method === "pakistan") {
        // Pakistan / India usually 1 day behind calculated
        let adjustedDay = parseInt(hijri.day) - 1;

        if (adjustedDay <= 0) {
            adjustedDay = 29; // safe fallback
        }

        hijri = {
            ...hijri,
            day: adjustedDay.toString().padStart(2, "0"),
            date: `${adjustedDay}-${hijri.month.number}-${hijri.year}`
        };
    }

    return {
        hijri: hijri.date,
        hijriDay: hijri.day,
        hijriMonth: hijri.month.number,
        hijriMonthEn: hijri.month.en,
        hijriMonthAr: hijri.month.ar,
        gregorian: json.data.gregorian.date,
        gregorianWeekday: json.data.gregorian.weekday.en,
        hijriWeekday: hijri.weekday.en
    };
}
