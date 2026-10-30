// Donut chart of correct / wrong / skipped, drawn with SVG circles
const R = 40;
const C = 2 * Math.PI * R;

export const parts = [
  { key: "correct", label: "Correct", color: "#187550" },
  { key: "wrong", label: "Wrong", color: "#c4372f" },
  { key: "skipped", label: "Skipped", color: "#e2a23b" },
];

export default function AnswerDonut({ result }) {
  const total = result.correct + result.wrong + result.skipped;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="relative size-[150px] shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`${result.correct} correct, ${result.wrong} wrong, ${result.skipped} skipped`}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#eef0f6" strokeWidth="12" />
          {parts.map((p) => {
            const len = total ? (result[p.key] / total) * C : 0;
            const el = len > 0 && (
              <circle
                key={p.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={p.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] leading-none font-extrabold text-ink">{total}</span>
          <span className="mt-1 text-[10px] font-semibold text-muted">QUESTIONS</span>
        </div>
      </div>
      <ul className="flex min-w-[160px] flex-1 flex-col gap-4">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            <span className="flex-1 text-sm text-muted">{p.label}</span>
            <span className="text-xl font-extrabold text-ink">{result[p.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
