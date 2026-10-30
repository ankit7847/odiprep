import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, FileText, PlayCircle } from "lucide-react";
import { useApi } from "../lib/useApi";
import { ErrorState, Loading } from "../components/ui/PageState";
import Button from "../components/ui/Button";

function TestRow({ test }) {
  const s = test.myStatus?.state;
  let action = (
    <Button to={`/test/${test.slug}`} size="sm">
      Start
    </Button>
  );
  let status = null;

  if (s === "in_progress") {
    action = (
      <Button to={`/attempt/${test.myStatus.attemptId}`} size="sm">
        Resume
      </Button>
    );
    status = <span className="text-xs font-semibold text-brand">In progress · Q{(test.myStatus.questionIndex || 0) + 1}</span>;
  } else if (s === "done") {
    action = (
      <Button to={`/attempt/${test.myStatus.attemptId}/result`} variant="secondary" size="sm">
        View result
      </Button>
    );
    status = (
      <span className="flex items-center gap-1 text-xs font-semibold text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Done · {test.myStatus.score}/{test.myStatus.maxScore}
      </span>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-bold text-ink">{test.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" aria-hidden="true" />
            {test.totalQuestions} questions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {test.durationMinutes} min
          </span>
          <span>
            +{test.marking.correct} / −{test.marking.negative}
          </span>
          {status}
        </span>
      </div>
      <div className="flex gap-2">
        {s === "done" && (
          <Button to={`/test/${test.slug}`} variant="secondary" size="sm">
            Retake
          </Button>
        )}
        {action}
      </div>
    </li>
  );
}

function Group({ title, tests, empty }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      {tests.length ? (
        <ul className="flex flex-col gap-3">
          {tests.map((t) => (
            <TestRow key={t._id} test={t} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-6 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

export default function ExamDetail() {
  const { slug } = useParams();
  const { data, error, loading, reload, status } = useApi(`/exams/${slug}/tests`);

  if (loading) return <Loading />;
  if (status === 404) return <ErrorState message="This exam isn’t available yet." backTo="/exams" />;
  if (error) return <ErrorState message={error} onRetry={reload} backTo="/exams" />;

  const mocks = data.tests.filter((t) => t.type === "mock");
  const pyqs = data.tests.filter((t) => t.type === "pyq");

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-5 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <Link to="/exams" className="flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-brand">
          <ArrowLeft className="size-4" aria-hidden="true" /> All exams
        </Link>
        <h1 className="text-[28px] font-extrabold text-ink md:text-[32px]">{data.exam.name}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <PlayCircle className="size-4 text-brand" aria-hidden="true" />
          Pick a paper. Your progress saves automatically.
        </p>
      </div>
      <Group title="Mock tests" tests={mocks} empty="Mock tests for this exam are coming soon." />
      <Group title="Previous-year papers" tests={pyqs} empty="Previous-year papers are being added." />
    </section>
  );
}
