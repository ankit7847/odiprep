import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Flag, Timer, WifiOff } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { formatClock } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/ui/LanguageToggle";
import Button from "../components/ui/Button";
import { ErrorState, Loading } from "../components/ui/PageState";
import QuestionCard from "../components/exam/QuestionCard";
import QuestionPalette, { questionStatus } from "../components/exam/QuestionPalette";
import SubmitDialog from "../components/exam/SubmitDialog";

const smallBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-xs font-bold text-brand transition-colors hover:border-brand disabled:opacity-50";

export default function ExamScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLanguage();

  const [exam, setExam] = useState(null); // test info, sections, endsAt
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);

  const offsetRef = useRef(0); // server clock - browser clock
  const openedAtRef = useRef(Date.now()); // when the current question was opened
  const queueRef = useRef(Promise.resolve()); // saves run one after another, in order
  const finishedRef = useRef(false);

  const goToResult = useCallback(() => navigate(`/attempt/${id}/result`, { replace: true }), [navigate, id]);

  // ---------- Load ----------
  const load = useCallback(async () => {
    setLoadError("");
    try {
      const { data } = await api.get(`/attempts/${id}`);
      const p = data.data;
      if (p.finished) return goToResult();
      offsetRef.current = new Date(p.serverNow).getTime() - Date.now();
      setExam({ test: p.test, sections: p.sections, endsAt: new Date(p.endsAt).getTime() });
      setQuestions(p.questions);
      const start = Math.min(p.lastQuestionIndex || 0, p.questions.length - 1);
      setCurrent(start);
      setQuestions((qs) => qs.map((q, i) => (i === start ? { ...q, visited: true } : q)));
      openedAtRef.current = Date.now();
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, [id, goToResult]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Saving ----------
  const save = useCallback(
    (body) => {
      queueRef.current = queueRef.current
        .then(() => api.patch(`/attempts/${id}/answer`, body))
        .then(() => setSaveError(""))
        .catch((err) => {
          const status = err?.response?.status;
          if (status === 410 || status === 409) {
            finishedRef.current = true;
            goToResult();
          } else {
            setSaveError(errorMessage(err));
          }
        });
      return queueRef.current;
    },
    [id, goToResult]
  );

  const update = (index, patch) => setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const spentOnCurrent = () => Math.min(3600, Math.round((Date.now() - openedAtRef.current) / 1000));

  const goTo = (next) => {
    if (next < 0 || next >= questions.length || next === current) return;
    const q = questions[current];
    save({ questionId: q._id, timeSpentSec: spentOnCurrent(), questionIndex: next });
    update(next, { visited: true });
    setCurrent(next);
    openedAtRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const select = (key) => {
    update(current, { selectedOption: key });
    save({ questionId: questions[current]._id, selectedOption: key });
  };

  const clear = () => {
    update(current, { selectedOption: null });
    save({ questionId: questions[current]._id, selectedOption: null });
  };

  const toggleReview = () => {
    const marked = !questions[current].markedForReview;
    update(current, { markedForReview: marked });
    save({ questionId: questions[current]._id, markedForReview: marked });
    if (marked && current < questions.length - 1) goTo(current + 1);
  };

  // ---------- Submit ----------
  const submit = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    try {
      await queueRef.current; // let pending saves finish first
      await api.post(`/attempts/${id}/submit`);
      goToResult();
    } catch (err) {
      finishedRef.current = false;
      setSubmitting(false);
      setSaveError(errorMessage(err));
    }
  }, [id, goToResult]);

  // ---------- Timer ----------
  useEffect(() => {
    if (!exam) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [exam]);

  const timeLeftSec = exam ? Math.max(0, Math.floor((exam.endsAt - (now + offsetRef.current)) / 1000)) : 0;

  useEffect(() => {
    if (exam && timeLeftSec === 0) submit(); // time is up
  }, [exam, timeLeftSec, submit]);

  // ---------- Tab switch warning ----------
  useEffect(() => {
    if (!exam) return;
    const onVis = () => {
      if (document.visibilityState === "hidden" && !finishedRef.current) {
        setWarnings((w) => w + 1);
        api.post(`/attempts/${id}/warning`, { kind: "tab_switch" }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [exam, id]);

  // ---------- Derived ----------
  const counts = useMemo(() => {
    const c = { answered: 0, skipped: 0, review: 0, notVisited: 0 };
    questions.forEach((q, i) => c[questionStatus(q, i === current)]++);
    return c;
  }, [questions, current]);

  const sectionInfo = useMemo(() => {
    if (!exam) return [];
    return exam.sections.map((s) => {
      const idx = questions.map((q, i) => (String(q.section) === String(s._id) ? i : -1)).filter((i) => i >= 0);
      return { ...s, first: idx[0], last: idx[idx.length - 1] };
    });
  }, [exam, questions]);

  if (loadError) return <ErrorState message={loadError} onRetry={load} backTo="/exams" />;
  if (!exam || !questions.length) return <Loading label="Opening your test…" />;

  const q = questions[current];
  const currentSection = sectionInfo.find((s) => String(s._id) === String(q.section));
  const lowTime = timeLeftSec <= 60;
  const isLast = current === questions.length - 1;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Control bar */}
      <header className="bg-ink px-5 py-5 md:px-10 md:py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-lg font-extrabold text-white md:text-[22px]">{exam.test.title}</h1>
              <p className="text-[11px] text-navy-muted">
                {questions.length} questions · {exam.test.durationMinutes} minutes{user ? ` · ${user.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
                +{exam.test.marking.correct} correct
              </span>
              <span className="text-xs text-navy-muted">−{exam.test.marking.negative} wrong</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="hidden text-xs text-navy-muted lg:block">Your progress is saved. Focus on one question at a time.</p>
            <div className="flex items-center gap-2.5" role="timer" aria-live="off">
              <Timer className={`size-5 ${lowTime ? "text-[#ffb4a8]" : "text-white"}`} aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[11px] text-navy-muted">TIME LEFT</span>
                <span className={`text-[25px] leading-tight font-extrabold tabular-nums ${lowTime ? "text-[#ffb4a8]" : "text-white"}`}>
                  {formatClock(timeLeftSec)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <LanguageToggle variant="dark" />
              <Button variant="inverse" onClick={() => setConfirmOpen(true)} disabled={submitting}>
                Submit test
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sections */}
      <nav aria-label="Sections" className="overflow-x-auto border-b border-line bg-white">
        <div className="flex gap-3 px-5 py-3 md:px-10">
          {sectionInfo.map((s) => {
            const active = s === currentSection;
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => goTo(s.first)}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-[52px] min-w-[140px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[10px] px-5 py-2 md:min-w-[180px] ${
                  active ? "bg-brand-soft" : "bg-white hover:bg-canvas"
                }`}
              >
                <span className={`text-[13px] ${active ? "font-extrabold text-brand" : "font-medium text-muted"}`}>{s.title}</span>
                <span className="text-[11px] text-muted">
                  {s.first + 1}–{s.last + 1}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {(saveError || warnings > 0) && (
        <div className="flex flex-col gap-2 px-5 pt-4 md:px-8">
          {saveError && (
            <p role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              <WifiOff className="size-4 shrink-0" aria-hidden="true" />
              Couldn’t save your last answer: {saveError} It will be saved with your next action.
            </p>
          )}
          {warnings > 0 && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              You left the test {warnings === 1 ? "once" : `${warnings} times`}. This is noted on your result.
            </p>
          )}
        </div>
      )}

      {/* Workspace */}
      <main className="flex flex-col gap-6 p-5 md:p-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <QuestionCard
            question={q}
            index={current}
            total={questions.length}
            sectionTitle={currentSection?.title}
            lang={lang}
            onSelect={select}
            disabled={submitting}
          />

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button type="button" onClick={toggleReview} className={smallBtn} aria-pressed={q.markedForReview}>
                {q.markedForReview ? "Unmark review" : "Mark for review"}
                <Flag className="size-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={clear} disabled={!q.selectedOption} className={smallBtn}>
                Clear
              </button>
            </div>
            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} className={smallBtn}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Previous
              </button>
              {isLast ? (
                <Button size="sm" onClick={() => setConfirmOpen(true)}>
                  Finish &amp; submit <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => goTo(current + 1)}>
                  Save &amp; Next <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Responses autosave as you answer. You can revisit any question before submitting.
          </p>
        </div>

        <aside className="w-full lg:w-[366px] lg:shrink-0">
          <QuestionPalette questions={questions} current={current} onJump={goTo} counts={counts} />
        </aside>
      </main>

      <SubmitDialog
        open={confirmOpen}
        counts={counts}
        total={questions.length}
        timeLeft={formatClock(timeLeftSec)}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submit}
      />
    </div>
  );
}
