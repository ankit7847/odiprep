// True if the string contains Odia script (e.g. Odia-language questions stored in the English field)
export const hasOdia = (s = "") => /[଀-୿]/.test(s);

// Bilingual text: returns { main, alt } where main is in the chosen language (falls back to English)
export function pickText(text, lang) {
  if (!text) return { main: "", alt: "", mainIsOdia: false };
  if (lang === "od" && text.od) return { main: text.od, alt: text.en, mainIsOdia: true };
  return { main: text.en, alt: text.od || "", mainIsOdia: hasOdia(text.en) };
}

// Comprehension questions are stored as "passage\n\nquestion"; split them for display
export function splitPassage(text = "") {
  const i = text.lastIndexOf("\n\n");
  if (i === -1) return { passage: "", stem: text };
  return { passage: text.slice(0, i).trim(), stem: text.slice(i + 2).trim() };
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
