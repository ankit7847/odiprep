import { useLanguage } from "../../context/LanguageContext";

// className must include the display (e.g. "inline-flex" or "hidden md:inline-flex")
export default function LanguageToggle({ className = "inline-flex" }) {
  const { lang, setLang } = useLanguage();
  const item = (active) =>
    `min-h-9 rounded-[7px] px-2.5 transition-colors ${active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`;

  return (
    <div
      role="group"
      aria-label="Question language"
      className={`min-h-11 items-center gap-0.5 rounded-[10px] bg-canvas p-1 ${className}`}
    >
      <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")} className={`${item(lang === "en")} text-[11px] font-bold`}>
        English
      </button>
      <button
        type="button"
        lang="or"
        aria-pressed={lang === "od"}
        onClick={() => setLang("od")}
        className={`${item(lang === "od")} font-odia text-xs`}
      >
        ଓଡ଼ିଆ
      </button>
    </div>
  );
}
