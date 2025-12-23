export const islamicEvents = {
  "1-1": "Islamic New Year",
  "10-1": "Day of Ashura",
  "12-3": "Eid Milad-un-Nabi ﷺ",
  "1-9": "Start of Ramadan",
  "27-9": "Laylatul Qadr",
  "1-10": "Eid-ul-Fitr",
  "10-12": "Eid-ul-Adha"
};

export function getEvent(day, month) {
  return islamicEvents[`${day}-${month}`] || null;
}
