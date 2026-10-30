import { CheckCircle2, Info } from "lucide-react";
import { pickText } from "../../lib/format";

export default function QuestionCard({ question, index, total, sectionTitle, lang, onSelect, disabled }) {
  const q = pickText(question.text, lang);

  return (
    <div className="flex flex-col gap-7 rounded-2xl border border-line bg-white p-5 shadow-card md:p-8">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold text-brand uppercase">{sectionTitle}</p>
        <p className="text-lg font-extrabold text-ink">
          Question {index + 1} <span className="text-xs font-extrabold text-muted">of {total}</span>
        </p>
      </div>

      <fieldset className="flex flex-col gap-7" disabled={disabled}>
        <legend className="contents">
          <span lang={q.mainIsOdia ? "or" : "en"} className={`block text-ink ${q.mainIsOdia ? "font-odia text-[22px] font-medium" : "text-xl font-bold md:text-2xl"}`}>
            {q.main}
          </span>
          {q.alt && (
            <span
              lang={q.mainIsOdia ? "en" : "or"}
              className={`mt-4 block text-muted ${q.mainIsOdia ? "text-lg" : "font-odia text-lg md:text-[22px]"}`}
            >
              {q.alt}
            </span>
          )}
        </legend>

        {question.imageUrl && (
          <img src={question.imageUrl} alt="Figure for this question" className="max-h-80 w-auto self-start rounded-xl border border-line" />
        )}

        <div className="flex flex-col gap-3">
          {question.options.map((o) => {
            const t = pickText(o.text, lang);
            const active = question.selectedOption === o.key;
            return (
              <label
                key={o.key}
                className={`flex min-h-[76px] cursor-pointer items-center gap-3.5 rounded-xl p-4 transition-colors ${
                  active ? "border-2 border-brand bg-brand-soft p-[15px]" : "border border-line bg-white hover:border-brand/40"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question._id}`}
                  value={o.key}
                  checked={active}
                  onChange={() => onSelect(o.key)}
                  className="size-5 shrink-0 accent-brand"
                />
                <span className={`text-[13px] font-bold ${active ? "text-brand" : "text-muted"}`}>{o.key}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    lang={t.mainIsOdia ? "or" : "en"}
                    className={`text-[15px] ${t.mainIsOdia ? "font-odia" : ""} ${active ? "font-bold text-brand" : "font-medium text-ink"}`}
                  >
                    {t.main}
                  </span>
                  {t.alt && (
                    <span lang={t.mainIsOdia ? "en" : "or"} className={`text-sm text-muted ${t.mainIsOdia ? "" : "font-odia"}`}>
                      {t.alt}
                    </span>
                  )}
                </span>
                {active && <CheckCircle2 className="size-5 shrink-0 text-brand" aria-hidden="true" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="flex gap-2 text-[11px] text-muted">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        Choose one option, then tap Save &amp; Next.
      </p>
    </div>
  );
}
