import { useEffect, useRef } from "react";
import Button from "../ui/Button";

export default function SubmitDialog({ open, counts, total, timeLeft, submitting, onCancel, onConfirm }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !submitting && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onCancel]);

  if (!open) return null;
  const unanswered = total - counts.answered - counts.review;

  const rows = [
    { label: "Answered", value: counts.answered, cls: "text-success" },
    { label: "Marked for review", value: counts.review, cls: "text-review" },
    { label: "Not answered", value: unanswered, cls: "text-warn" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-float"
      >
        <h2 id="submit-title" className="text-xl font-extrabold text-ink">
          Submit your test?
        </h2>
        <p className="mt-1 text-sm text-muted">
          You still have <span className="font-bold text-ink">{timeLeft}</span> left. After submitting you can’t change answers.
        </p>
        <dl className="mt-5 flex flex-col gap-2 rounded-xl bg-canvas p-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <dt className="text-muted">{r.label}</dt>
              <dd className={`font-extrabold ${r.cls}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">Questions marked for review count if they have an answer.</p>
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Keep working
          </Button>
          <Button ref={confirmRef} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit test"}
          </Button>
        </div>
      </div>
    </div>
  );
}
