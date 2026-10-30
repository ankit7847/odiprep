// Streaks and daily activity use India time, so a day ends at 12 AM IST (not UTC).
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// "YYYY-MM-DD" in IST
const istDate = (d = new Date()) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const istYesterday = (d = new Date()) => istDate(new Date(d.getTime() - 24 * 60 * 60 * 1000));

module.exports = { istDate, istYesterday };
