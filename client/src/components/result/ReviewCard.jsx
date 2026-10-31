import { pickText, signed, splitPassage } from "../../lib/format";

const badge = {
  correct: { text: "Correct", cls: "bg-success-soft text-success", mark: "text-success" },
  wrong: { text: "Incorrect", cls: "bg-danger-soft text-danger", mark: "text-danger" },
  skipped: { text: "Skipped", cls: "bg-warn-soft text-warn", mark: "text-muted" },
};

export const reviewState = (q) => (!q.selectedOption ? "skipped" : q.isCorrect ? "correct" : "wrong");

export default function ReviewCard({ q, number, marking, lang }) {
  const state = reviewState(q);
  const b = badge[state];
  const marks = state === "correct" ? marking.correct : state === "wrong" ? -marking.negative : 0;
  const text = pickText(q.text, lang);
  const { passage, stem } = splitPassage(text.main);
  const chosen = q.options.find((o) => o.key === q.selectedOption);
  const right = q.options.find((o) => o.key === q.correctOption);
  const rightText = right ? pickText(right.text, lang) : null;
  const explanation = q.explanation ? pickText(q.explanation, lang) : null;
  const tag = [q.subject?.name?.en, q.topic?.name?.en].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-ink">Q{number}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${b.cls}`}>{b.text}</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${b.mark}`}>{signed(marks)}</span>
      </header>
      {tag && <p className="-mt-1 text-[11px] font-bold text-muted uppercase">{tag}</p>}

      <div className="flex flex-col gap-1">
        {passage && (
          <details className="mb-2 rounded-xl border border-line bg-canvas px-4 py-2 text-[13px]">
            <summary className="min-h-9 cursor-pointer py-2 font-semibold text-brand">Show passage</summary>
            <p lang={text.mainIsOdia ? "or" : "en"} className={`pb-2 leading-relaxed whitespace-pre-line text-ink ${text.mainIsOdia ? "font-odia" : ""}`}>
              {passage}
            </p>
          </details>
        )}
        <h3 lang={text.mainIsOdia ? "or" : "en"} className={`whitespace-pre-line text-ink ${text.mainIsOdia ? "font-odia text-lg font-medium" : "text-[17px] font-bold"}`}>
          {stem}
        </h3>
        {text.alt && (
          <p lang={text.mainIsOdia ? "en" : "or"} className={`text-muted ${text.mainIsOdia ? "text-sm" : "font-odia"}`}>
            {text.alt}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl bg-canvas px-4 py-3.5 text-[13px]">
        <p className={state === "wrong" ? "text-danger" : "text-muted"}>
          Your answer: {chosen ? `${chosen.key} · ${pickText(chosen.text, lang).main}` : "Not answered"}
        </p>
        {rightText && (
          <p className="font-bold text-success">
            Correct answer: {right.key} · {rightText.main}
            {rightText.alt && (
              <span lang={rightText.mainIsOdia ? "en" : "or"} className={`block font-normal ${rightText.mainIsOdia ? "" : "font-odia"}`}>
                {rightText.alt}
              </span>
            )}
          </p>
        )}
      </div>

      {explanation?.main && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-extrabold text-brand">WHY THIS IS CORRECT</p>
          <p className={`text-[13px] text-muted ${explanation.mainIsOdia ? "font-odia" : ""}`}>{explanation.main}</p>
        </div>
      )}
    </article>
  );
}
