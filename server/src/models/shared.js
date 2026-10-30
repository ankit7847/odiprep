// Reusable sub-schemas

// Bilingual text: English + Odia
const localizedText = (required = true) => ({
  en: { type: String, trim: true, required },
  od: { type: String, trim: true },
});

module.exports = { localizedText };
