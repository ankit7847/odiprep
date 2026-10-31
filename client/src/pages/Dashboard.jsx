import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRight, Bookmark, Files, LayoutDashboard, NotebookPen, Timer, Trophy } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { ErrorState, Loading } from "../components/ui/PageState";
import Card, { Pill } from "../components/dashboard/Card";
import TargetCard from "../components/dashboard/TargetCard";
import ScoreTrendChart from "../components/dashboard/ScoreTrendChart";
import StreakCalendar, { calendarDays } from "../components/dashboard/StreakCalendar";

const sideLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pyq", label: "PYQ Papers", icon: Files },
  { to: "/mock-tests", label: "Mock Tests", icon: Timer },
  { label: "Mistake Notebook", icon: NotebookPen },
  { label: "Bookmarks", icon: Bookmark },
  { label: "Leaderboard", icon: Trophy },
];

const todayLabel = () =>
  new Date()
    .toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

function Metric({ label, value, note, noteTone = "text-muted" }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-card">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[28px] leading-tight font-extrabold text-ink tabular-nums md:text-[32px]">{value}</span>
      <span className={`text-[11px] ${noteTone}`}>{note}</span>
    </div>
  );
}

function Sidebar({ summary, onTargetSaved }) {
  return (
    <aside className="flex w-full flex-col gap-8 border-line bg-white p-6 lg:min-h-[calc(100vh-84px)] lg:w-[248px] lg:shrink-0 lg:border-r">
      <p className="hidden text-[11px] font-bold text-muted lg:block">YOUR WORKSPACE</p>
      <nav aria-label="Workspace" className="hidden flex-col gap-2 lg:flex">
        {sideLinks.map(({ to, label, icon: Icon }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end
              className={({ isActive }) =>
                `flex min-h-[46px] items-center gap-3 rounded-[10px] p-3 text-xs ${isActive ? "bg-brand-soft font-extrabold text-brand" : "font-medium text-muted hover:bg-canvas"}`
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ) : (
            <span key={label} className="flex min-h-[46px] items-center gap-3 rounded-[10px] p-3 text-xs font-medium text-muted/70" aria-disabled="true">
              <Icon className="size-[18px]" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold">Soon</span>
            </span>
          )
        )}
      </nav>
      <TargetCard key={summary.targetExam?._id || "none"} target={summary.targetExam} onSaved={onTargetSaved} />
      <p className="hidden text-[11px] text-muted lg:block">A focused hour today is a confident step tomorrow.</p>
    </aside>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setError("");
    const days = calendarDays();
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/score-trend?limit=8"),
      api.get("/dashboard/subject-accuracy"),
      api.get("/dashboard/weak-topics?limit=3&min=3"),
      api.get(`/dashboard/streak-calendar?days=${days}`),
    ])
      .then(async ([s, t, sub, w, c]) => {
        const summary = s.data.data;
        let pyq = null;
        if (summary.targetExam) {
          pyq = await api
            .get(`/dashboard/pyq-progress?exam=${summary.targetExam.slug}`)
            .then((r) => r.data.data)
            .catch(() => null);
        }
        if (alive) setData({ summary, trend: t.data.data, subjects: sub.data.data, weak: w.data.data, calendar: c.data.data, pyq });
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, [tick]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading label="Loading your dashboard…" />;

  const { summary, trend, subjects, weak, calendar, pyq } = data;
  const firstName = (user?.name || "").split(" ")[0];
  const isNew = summary.testsTaken === 0;
  const delta = trend.length > 1 ? trend[trend.length - 1].scorePct - trend[0].scorePct : null;
  const latest = trend[trend.length - 1];
  const weakest = subjects.length > 1 ? subjects[0] : null; // API sorts weakest first
  const streak = calendar.streak;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
      <div className="order-2 lg:order-1 lg:flex">
        <Sidebar summary={summary} onTargetSaved={reload} />
      </div>

      <div className="order-1 flex min-w-0 flex-1 flex-col gap-6 p-5 md:p-9 lg:order-2">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted">{todayLabel()}</p>
            <h1 className="text-[28px] font-extrabold text-ink md:text-[32px]">
              {isNew ? `Welcome, ${firstName}.` : `Keep going, ${firstName}.`}
            </h1>
            <p className="text-[13px] text-muted">
              {isNew ? "Take your first mock and your progress will show up here." : "Your goal is getting closer. Let’s make today count."}
            </p>
          </div>
          {summary.continue ? (
            <Button to={`/attempt/${summary.continue.attemptId}`}>
              Continue last paper <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button to={summary.targetExam ? `/exams/${summary.targetExam.slug}` : "/mock-tests"}>
              {isNew ? "Take your first mock" : "Start a mock"} <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {summary.continue && (
          <Link to={`/attempt/${summary.continue.attemptId}`} className="flex items-start gap-3 rounded-xl bg-brand-soft p-4 text-xs text-brand hover:underline">
            <Files className="size-5 shrink-0" aria-hidden="true" />
            Pick up where you left off: {summary.continue.test.title} · Question {summary.continue.questionIndex + 1} of {summary.continue.test.totalQuestions}
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric label="Tests taken" value={summary.testsTaken} note={`${summary.testsThisWeek} this week`} />
          <Metric label="Average score" value={isNew ? "—" : `${summary.avgScorePct}%`} note="Across all tests" />
          <Metric label="Accuracy" value={isNew ? "—" : `${summary.accuracy}%`} note="Correct ÷ attempted" noteTone={isNew ? "text-muted" : "text-success"} />
          <Metric
            label="Best rank"
            value={summary.bestRank ? `#${summary.bestRank.rank}` : "—"}
            note={summary.bestRank?.test ? summary.bestRank.test.title : "Take a mock to get ranked"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card
            title={delta !== null && delta < 0 ? "Every test teaches something." : "Getting better, steadily."}
            subtitle={`Score % · Last ${trend.length || 8} completed tests`}
            badge={delta !== null && <Pill tone={delta >= 0 ? "success" : "warn"}>{`${delta >= 0 ? "+" : ""}${delta} pts`}</Pill>}
          >
            {trend.length ? (
              <>
                <ScoreTrendChart points={trend} />
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted">Latest: {latest.test?.title}</span>
                  <Link to={`/attempt/${latest.attemptId}/result`} className="text-xs font-extrabold whitespace-nowrap text-brand hover:underline">
                    {latest.score} / {latest.maxScore}
                  </Link>
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-canvas px-4 py-10 text-center text-sm text-muted">Your score trend appears after your first test.</p>
            )}
          </Card>

          <Card title="Know where to focus." subtitle="Correct ÷ attempted · All tests so far">
            {subjects.length ? (
              <>
                <ul className="flex flex-col gap-[18px]">
                  {subjects.map((s) => {
                    const low = weakest && s.subject._id === weakest.subject._id && s.accuracy < 70;
                    return (
                      <li key={s.subject._id} className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-ink">{s.subject.name.en}</span>
                          <span className={`font-extrabold ${low ? "text-warn" : "text-brand"}`}>{s.accuracy}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-md bg-canvas">
                          <div className={`h-2 rounded-md ${low ? "bg-[#f5a524]" : "bg-brand"}`} style={{ width: `${s.accuracy}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {weakest && weakest.accuracy < 70 && <Pill tone="warn">{weakest.subject.name.en} needs a little extra practice</Pill>}
              </>
            ) : (
              <p className="rounded-xl bg-canvas px-4 py-10 text-center text-sm text-muted">Subject accuracy appears after your first test.</p>
            )}
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card
            title="Show up. Level up."
            subtitle="A little practice, every day · Last 13 weeks"
            badge={<Pill tone={streak.current ? "warn" : "muted"}>{streak.current}-day streak</Pill>}
          >
            <StreakCalendar days={calendar.days} />
            <p className="text-[11px] text-muted">
              {streak.activeToday
                ? "You practised today. Keep it going!"
                : streak.current
                  ? "Take a test today to keep your streak alive."
                  : "Finish a test today to start a streak."}
              {streak.longest > 0 && ` Longest: ${streak.longest} day${streak.longest === 1 ? "" : "s"}.`}
            </p>
          </Card>

          <Card title="Your next small wins" subtitle="Topics where you got the most wrong">
            {weak.length ? (
              <ul className="flex flex-col gap-4">
                {weak.map((t) => (
                  <li key={t.topic._id} className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[13px] font-bold text-ink">{t.topic.name.en}</span>
                      <span className="text-[11px] text-warn">
                        {t.subject.name.en} · {t.accuracy}% accuracy · {t.attempted} answered
                      </span>
                    </div>
                    <Button to="/mock-tests" variant="secondary" size="sm">
                      Practise
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-canvas px-4 py-10 text-center text-sm text-muted">
                Answer a few more questions and we’ll show which topics to work on.
              </p>
            )}
          </Card>
        </div>

        <Card
          title="One year at a time."
          subtitle={pyq ? `${pyq.exam.name} · Your previous-year paper progress` : "Your previous-year paper progress"}
          action={
            pyq && (
              <Button to={`/exams/${pyq.exam.slug}`} variant="secondary" size="sm">
                All papers
              </Button>
            )
          }
        >
          {!summary.targetExam ? (
            <p className="rounded-xl bg-canvas px-4 py-8 text-center text-sm text-muted">Set your target exam to track its previous-year papers.</p>
          ) : !pyq || !pyq.papers.length ? (
            <p className="rounded-xl bg-canvas px-4 py-8 text-center text-sm text-muted">Previous-year papers for this exam are being added.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pyq.papers.map((p) => {
                const to = p.state === "done" ? `/attempt/${p.attemptId}/result` : p.state === "in_progress" ? `/attempt/${p.attemptId}` : `/test/${p.slug}`;
                return (
                  <li key={p._id}>
                    <Link to={to} className="flex h-full flex-col gap-3 rounded-xl border border-line bg-canvas p-3.5 hover:border-brand/40">
                      <span className="text-xl font-extrabold text-ink">{p.year || p.title}</span>
                      {p.state === "done" && <Pill tone="success">Done</Pill>}
                      {p.state === "in_progress" && <Pill tone="brand">In progress</Pill>}
                      {p.state === "not_started" && <Pill tone="muted">Not started</Pill>}
                      <span className="text-[11px] text-muted">
                        {p.state === "done"
                          ? `${p.score} / ${p.maxScore} score`
                          : p.state === "in_progress"
                            ? `Question ${p.questionIndex + 1} of ${p.totalQuestions}`
                            : `${p.totalQuestions} questions`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <p className="text-center text-[11px] text-muted">Your preparation, your pace. All practice on OdiPrep is free.</p>
      </div>
    </div>
  );
}
