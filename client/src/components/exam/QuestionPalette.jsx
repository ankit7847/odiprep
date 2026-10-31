// Status of one question for the palette and the summary counts
export function questionStatus(q, isCurrent) {
  if (q.markedForReview) return "review";
  if (q.selectedOption) return "answered";
  if (q.visited && !isCurrent) return "skipped";
  return "notVisited";
}

const tone = {
  answered: "border border-success bg-success-soft text-success",
  skipped: "border border-warn bg-warn-soft text-warn",
  review: "border border-review bg-review-soft text-review",
  notVisited: "border border-line bg-white text-ink",
};

export const legend = [
  { key: "answered", label: "Answered", swatch: "border-success bg-success-soft" },
  { key: "skipped", label: "Skipped", swatch: "border-warn bg-warn-soft" },
  { key: "review", label: "Marked for review", swatch: "border-review bg-review-soft" },
  { key: "notVisited", label: "Not visited", swatch: "border-muted bg-white" },
];

const labelFor = { answered: "answered", skipped: "skipped", review: "marked for review", notVisited: "not visited" };

export default function QuestionPalette({ questions, current, onJump, counts }) {
  const total = questions.length;
  const answeredPct = total ? Math.round(((counts.answered + counts.review) / total) * 100) : 0;
  const cur = questions[current];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-[22px] shadow-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[17px] font-extrabold text-ink">Question palette</h2>
        <span className="text-[11px] text-muted">{total} questions</span>
      </div>
      <p className="-mt-2 text-[11px] text-muted">Jump to any question. Your answers are saved as you go.</p>

      <div
        className="h-1.5 overflow-hidden rounded bg-canvas"
        role="progressbar"
        aria-label="Answered"
        aria-valuenow={answeredPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-1.5 rounded bg-success transition-[width]" style={{ width: `${answeredPct}%` }} />
      </div>

      <ol className="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))] gap-1.5">
        {questions.map((q, i) => {
          const isCurrent = i === current;
          const st = questionStatus(q, isCurrent);
          return (
            <li key={q._id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Question ${i + 1}, ${labelFor[st]}`}
                className={`flex h-11 w-full items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                  isCurrent ? "border-2 border-brand bg-brand-soft text-brand" : tone[st]
                }`}
              >
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="h-px bg-line" />

      <ul className="flex flex-col gap-3">
        {legend.map((l) => (
          <li key={l.key} className="flex items-center gap-2.5 text-[11px]">
            <span className={`size-3.5 rounded border ${l.swatch}`} aria-hidden="true" />
            <span className="flex-1 text-muted">{l.label}</span>
            <span className="font-bold text-ink">{counts[l.key]}</span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-muted" aria-live="polite">
        Question {current + 1} is selected.{" "}
        {cur?.selectedOption ? `Your answer ${cur.selectedOption} is saved.` : "No answer chosen yet."}
      </p>
    </div>
  );
}
