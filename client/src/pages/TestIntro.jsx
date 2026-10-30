import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useApi } from "../lib/useApi";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ErrorState, Loading } from "../components/ui/PageState";
import Button from "../components/ui/Button";
import LanguageToggle from "../components/ui/LanguageToggle";

const rules = [
  "The timer starts when you press Start and keeps running even if you close the page.",
  "Your answers save as you go. If you leave, you can resume from where you stopped.",
  "When time is up, the test is submitted automatically.",
  "Switching tabs is noted on your result. Stay on this page for the real-exam feel.",
];

export default function TestIntro() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: test, error, loading, reload, status } = useApi(`/tests/${slug}`);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  if (loading) return <Loading />;
  if (status === 404) return <ErrorState message="This test isn’t available." backTo="/exams" />;
  if (error) return <ErrorState message={error} onRetry={reload} backTo="/exams" />;

  const start = async () => {
    if (!user) return navigate("/login", { state: { from: location.pathname } });
    setStarting(true);
    setStartError("");
    try {
      const res = await api.post("/attempts", { testId: test._id });
      navigate(`/attempt/${res.data.data.attemptId}`);
    } catch (err) {
      setStartError(errorMessage(err));
      setStarting(false);
    }
  };

  const facts = [
    { label: "Questions", value: test.totalQuestions },
    { label: "Time", value: `${test.durationMinutes} min` },
    { label: "Correct", value: `+${test.marking.correct}` },
    { label: "Wrong", value: `−${test.marking.negative}` },
  ];

  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-5 py-10 md:py-14">
      <Link to={`/exams/${test.exam.slug}`} className="flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-brand">
        <ArrowLeft className="size-4" aria-hidden="true" /> {test.exam.name}
      </Link>

      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
        <div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand uppercase">
            {test.type === "pyq" ? "Previous-year paper" : "Mock test"}
          </span>
          <h1 className="mt-3 text-[26px] font-extrabold text-ink md:text-[30px]">{test.title}</h1>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl bg-canvas px-4 py-3">
              <dt className="text-[11px] font-semibold text-muted">{f.label}</dt>
              <dd className="text-lg font-extrabold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h2 className="text-sm font-extrabold text-ink">Sections</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {test.sections.map((s) => (
              <li key={s._id} className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink">
                {s.title} · {s.questionCount}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-extrabold text-ink">Before you start</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {rules.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted">Question language</span>
            <LanguageToggle />
          </div>
          <Button onClick={start} disabled={starting}>
            {starting ? "Starting…" : user ? "Start test" : "Log in to start"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {startError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            {startError}
          </p>
        )}
      </div>
    </section>
  );
}
