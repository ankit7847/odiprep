import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatClock, formatDate } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/ui/Button";
import { ErrorState, Loading } from "../components/ui/PageState";
import AnswerDonut from "../components/result/AnswerDonut";
import ReviewCard, { reviewState } from "../components/result/ReviewCard";

const PAGE = 10;
const filters = [
  { key: "all", label: "All" },
  { key: "correct", label: "Correct" },
  { key: "wrong", label: "Wrong" },
  { key: "skipped", label: "Skipped" },
];

function Stat({ label, value, note, highlight }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border p-5 shadow-card ${highlight ? "border-brand bg-brand" : "border-line bg-white"}`}>
      <span className={`text-[11px] ${highlight ? "text-white/80" : "text-muted"}`}>{label}</span>
      <span className={`text-[32px] leading-tight font-extrabold tabular-nums ${highlight ? "text-white" : "text-ink"}`}>{value}</span>
      <span className={`text-[11px] ${highlight ? "text-white/80" : "text-muted"}`}>{note}</span>
    </div>
  );
}

export default function Result() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [data, setData] = useState(null);
  const [review, setReview] = useState([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState("all");
  const [section, setSection] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    setError("");
    Promise.all([api.get(`/attempts/${id}/result`), api.get(`/attempts/${id}/review`)])
      .then(([r, v]) => {
        if (!alive) return;
        setData(r.data.data);
        setReview(v.data.data);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [id, tick]);

  const sectionNames = useMemo(() => new Map((data?.result.sections || []).map((s) => [String(s.section), s.title])), [data]);

  const filtered = useMemo(
    () =>
      review
        .map((q, i) => ({ q, number: i + 1 }))
        .filter(({ q }) => filter === "all" || reviewState(q) === filter)
        .filter(({ q }) => section === "all" || String(q.section) === section),
    [review, filter, section]
  );

  if (error) return <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} backTo="/exams" />;
  if (!data) return <Loading label="Loading your result…" />;

  const r = data.result;
  const attempted = r.correct + r.wrong;
  const accuracy = attempted ? ((r.correct / attempted) * 100).toFixed(1).replace(/\.0$/, "") : "0";
  const total = r.correct + r.wrong + r.skipped;
  const counts = { all: total, correct: r.correct, wrong: r.wrong, skipped: r.skipped };
  const { marking } = data.test;
  const examSlug = data.test.exam?.slug;

  // Weakest section = lowest accuracy among sections the student attempted
  const weak = r.sections
    .map((s) => ({ ...s, acc: s.correct + s.wrong ? s.correct / (s.correct + s.wrong) : null }))
    .filter((s) => s.acc !== null)
    .sort((a, b) => a.acc - b.acc)[0];
  const showWeak = weak && r.sections.length > 1 && weak.acc < 0.8;

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-8 md:px-16 md:py-12">
      <Link to={examSlug ? `/exams/${examSlug}` : "/exams"} className="flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-brand">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to {data.test.exam?.name || "exams"}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="self-start rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
            {data.status === "auto_submitted" ? "Time up · auto-submitted" : "Completed"} · {formatDate(data.submittedAt)}
          </span>
          <h1 className="text-[28px] leading-tight font-extrabold text-ink md:text-[34px]">A stronger you, one mock at a time.</h1>
          <p className="text-xs text-muted">
            {user?.name} · {data.test.title}
            {data.warnings > 0 && ` · Left the test ${data.warnings} time${data.warnings > 1 ? "s" : ""}`}
          </p>
        </div>
        {examSlug && (
          <Button to={`/exams/${examSlug}`}>
            Try another mock <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat highlight label="Your score" value={r.score} note={`out of ${r.maxScore} marks`} />
        <Stat label="Your rank" value={`#${r.rank}`} note={`of ${r.totalCandidates} submission${r.totalCandidates === 1 ? "" : "s"}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} note={`${r.correct} correct / ${attempted} attempted`} />
        <Stat label="Time taken" value={formatClock(r.timeTakenSec)} note="minutes" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <h2 className="text-[17px] font-extrabold text-ink">Every answer tells a story.</h2>
          <AnswerDonut result={r} />
          <p className="border-t border-line pt-4 text-[11px] text-muted">
            {r.correct} × {marking.correct} − {r.wrong} × {marking.negative} = {r.score} marks. Skipped questions carry no penalty.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card md:p-6">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Section-wise score</h2>
            <p className="text-[11px] text-muted">
              +{marking.correct} / −{marking.negative} marking
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] text-muted">
                  <th className="py-2 text-left font-semibold">SECTION</th>
                  <th className="w-10 py-2 text-right font-semibold" title="Correct">
                    C
                  </th>
                  <th className="w-10 py-2 text-right font-semibold" title="Wrong">
                    W
                  </th>
                  <th className="w-10 py-2 text-right font-semibold" title="Skipped">
                    S
                  </th>
                  <th className="w-16 py-2 text-right font-semibold">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {r.sections.map((s) => {
                  const isWeak = showWeak && s.section === weak.section;
                  return (
                    <tr key={s.section} className="border-t border-line">
                      <td className={`py-3 ${isWeak ? "font-semibold text-warn" : "text-ink"}`}>{s.title}</td>
                      <td className="py-3 text-right text-ink">{s.correct}</td>
                      <td className="py-3 text-right text-ink">{s.wrong}</td>
                      <td className="py-3 text-right text-ink">{s.skipped}</td>
                      <td className="py-3 text-right font-bold text-brand">{s.score.toFixed(2)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-line font-extrabold text-ink">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-right">{r.correct}</td>
                  <td className="py-3 text-right">{r.wrong}</td>
                  <td className="py-3 text-right">{r.skipped}</td>
                  <td className="py-3 text-right text-brand">{r.score.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted">C = Correct · W = Wrong · S = Skipped</p>
        </section>
      </div>

      {showWeak && (
        <div className="flex items-start gap-3 rounded-2xl border border-warn/20 bg-warn-soft p-5">
          <Lightbulb className="size-5 shrink-0 text-warn" aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold text-warn">Your biggest opportunity: {weak.title}</p>
            <p className="text-xs text-warn">
              {Math.round(weak.acc * 100)}% accuracy in this section. Review the answers below, then try another mock.
            </p>
          </div>
        </div>
      )}

      {/* Review */}
      <section className="mt-4 flex flex-col gap-5">
        <div>
          <h2 className="text-[26px] font-extrabold text-ink md:text-[32px]">Understand every answer.</h2>
          <p className="text-sm text-muted">Review the reasoning, not just the result.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={`min-h-11 rounded-xl border px-4 text-xs font-bold transition-colors ${
                filter === f.key ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {f.label} {counts[f.key]}
            </button>
          ))}
          <label className="sr-only" htmlFor="section-filter">
            Section
          </label>
          <select
            id="section-filter"
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-xs font-bold text-brand"
          >
            <option value="all">All sections</option>
            {[...sectionNames].map(([sid, title]) => (
              <option key={sid} value={sid}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {shown.length ? (
          <div className="flex flex-col gap-4">
            {shown.map(({ q, number }) => (
              <ReviewCard key={q._id} q={q} number={number} marking={marking} lang={lang} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-muted">
            No questions match this filter.
          </p>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
