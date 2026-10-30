// Bilingual text: returns { main, alt } where main is in the chosen language (falls back to English)
export function pickText(text, lang) {
  if (!text) return { main: "", alt: "", mainIsOdia: false };
  if (lang === "od" && text.od) return { main: text.od, alt: text.en, mainIsOdia: true };
  return { main: text.en, alt: text.od || "", mainIsOdia: false };
}

// 5432 -> "90:32" (minutes can go above 60, like exam timers)
export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export const signed = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
